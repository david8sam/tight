import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import WebSocket from 'ws';
import ts from 'typescript';
import { claimHost, withCookie } from './helpers/host-access.mjs';
import { trackCommands, makeBatch, sendCommand } from './helpers/command-client.mjs';

const source = await readFile(new URL('../src/common/message.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { MessageType: T } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

async function host(directory, fails = false, port = '0') {
    const child = spawn(process.execPath, ['build/server.js'], {
        env: { ...process.env, TIGHT_DATA_DIR: directory, TIGHT_USE_HTTP: 'true', TIGHT_HOST: '127.0.0.1', PORT: port },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    child.stderr.on('data', b => logs += b);
    const ready = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(logs)); }, 10000);
        child.stdout.on('data', b => {
            logs += b;
            const match = logs.match(/Server listening on port: (\d+)/);
            if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
        });
        child.once('exit', code => {
            clearTimeout(timer);
            if (fails && code !== 0) resolve(null);
            else reject(new Error(`Unexpected host exit ${code}: ${logs}`));
        });
    });
    const origin = await ready;
    if (fails) {
        if (origin !== null) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; }
        assert.equal(origin, null, 'second or incompatible host must fail before listening');
        return;
    }
    const cookie = await claimHost(origin, logs);
    return {
        async request(route, body) {
            return fetch(`${origin}/api/game/${route}`, withCookie(cookie, {
                ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
                signal: AbortSignal.timeout(3000),
            }));
        },
        async connect(id) {
            const ws = trackCommands(new WebSocket(`${origin.replace('http:', 'ws:')}/socket?gameId=${id}`, { headers: { cookie } }));
            const initial = await message(ws);
            return { ws, initial };
        },
        async stop() {
            if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited; }
        },
    };
}
function message(ws, predicate = () => true) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('Message timeout')); }, 4000);
        function receive(raw) { const value = JSON.parse(raw); if (predicate(value)) { cleanup(); resolve(value); } }
        function cleanup() { clearTimeout(timer); ws.off('message', receive); }
        ws.on('message', receive);
    });
}
function sql(directory, command) {
    const db = new DatabaseSync(path.join(directory, 'games.sqlite'));
    try { db.exec(command); } finally { db.close(); }
}

test('durable saves survive crashes, reject competing hosts, and recover failed writes', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-storage-'));
    const importedDirectory = await mkdtemp(path.join(tmpdir(), 'tight-import-'));
    let running, imported;
    const sockets = [];
    t.after(async () => {
        sockets.forEach(ws => ws.terminate());
        await running?.stop(); await imported?.stop();
        await rm(directory, { recursive: true, force: true });
        await rm(importedDirectory, { recursive: true, force: true });
    });
    running = await host(directory);
    const created = await running.request('create', { numPlayers: 2, publicObjectives: [{ id: 3, description: 'Saved score', vp: 2 }] });
    assert.equal(created.status, 200);
    const id = await created.json();
    await host(directory, true);
    const { ws } = await running.connect(id); sockets.push(ws);
    const changed = message(ws, value => value.data?.game?.players?.includes('Saved player'));
    await sendCommand(ws, T.GAME_ADD_PLAYER, { gameId: id, playerId: 'Saved player' });
    await changed;
    for (const [type, fields] of [
        [T.GAME_UPDATE_FACTION, { order: 0, name: 'The Arborec', playerIds: ['Saved player'] }],
        [T.SET_PUBLIC_OBJECTIVES, { factionName: 'The Arborec', publicObjectives: [null, null, true] }],
        [T.TAKE_PLANET, { factionName: 'The Arborec', planetId: 'Mecatol Rex' }],
        [T.UPDATE_PLANET, { planetId: 'Mecatol Rex', modifiers: { resources: 2 } }],
        [T.GAME_NEXT_ROUND, {}],
    ]) {
        const broadcast = message(ws, value => value.type === T.BROADCAST_CHANGE);
        await sendCommand(ws, type, { gameId: id, ...fields });
        await broadcast;
    }
    const beforeCrash = await (await running.request(`export?gameId=${id}`)).json();
    await running.stop();
    running = await host(directory);
    const restored = await running.connect(id); sockets.push(restored.ws);
    assert.deepEqual(restored.initial.data.game.players, ['Saved player']);
    const exported = await (await running.request(`export?gameId=${id}`)).json();
    assert.deepEqual(exported, beforeCrash, 'complete state survives forced termination');
    assert.deepEqual(exported.game.factions[0].publicObjectives, [false, false, true]);
    assert.equal(exported.game.planets['Mecatol Rex'].owner, 'The Arborec');
    assert.equal(exported.game.status.round, 2);
    assert.equal(exported.format, 'tight-game');
    const backupFiles = await readdir(path.join(directory, 'backups'));
    assert.ok(backupFiles.length > 0);
    const backup = new DatabaseSync(path.join(directory, 'backups', backupFiles[0]), { readOnly: true });
    try {
        assert.equal(backup.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
        assert.deepEqual(JSON.parse(backup.prepare('SELECT snapshot FROM games WHERE id=?').get(id).snapshot), exported.game);
    } finally { backup.close(); }
    imported = await host(importedDirectory);
    assert.equal((await imported.request('import', exported)).status, 200);
    assert.deepEqual(await (await imported.request(`export?gameId=${id}`)).json(), exported);
    assert.equal((await imported.request('import', exported)).status, 409);
    assert.equal((await imported.request('import', { ...exported, version: 99 })).status, 400);
    assert.equal((await imported.request('import', { ...exported, game: { ...exported.game, planets: {} } })).status, 400);
    await running.stop();
    sql(directory, "CREATE TRIGGER fail_update BEFORE UPDATE ON games BEGIN SELECT RAISE(ABORT, 'disk write rejected'); END; CREATE TRIGGER fail_delete BEFORE DELETE ON games BEGIN SELECT RAISE(ABORT, 'disk write rejected'); END;");
    running = await host(directory);
    const failing = await running.connect(id); sockets.push(failing.ws);
    const observer = await running.connect(id); sockets.push(observer.ws);
    const observed = [];
    observer.ws.on('message', raw => observed.push(JSON.parse(raw)));
    const closed = once(failing.ws, 'close');
    const failedCommand = makeBatch(failing.ws, [{ type: T.GAME_ADD_PLAYER, data: { gameId: id, playerId: 'Unsaved player' } }]);
    const failure = message(failing.ws, value => value.type === T.COMMAND_RESULT && value.data.id === failedCommand.id);
    failing.ws.send(JSON.stringify(failedCommand));
    assert.equal((await failure).data.status, 'unconfirmed');
    assert.equal((await closed)[0], 1011);
    const stillHealthy = message(observer.ws, value => value.type === T.BROADCAST_CHANGE);
    await sendCommand(observer.ws, T.GAME_STATUS_SET, { gameId: id });
    await stillHealthy;
    assert.equal(observer.ws.readyState, WebSocket.OPEN);
    assert.ok(observed.every(value => !value.data?.game?.players?.includes('Unsaved player')));
    observer.ws.close();
    assert.deepEqual(await (await running.request(`export?gameId=${id}`)).json(), exported, 'failed command restores cached state');
    assert.equal((await running.request('restart', { id })).status, 503);
    assert.equal((await running.request('delete', { id })).status, 503);
    assert.deepEqual(await (await running.request(`export?gameId=${id}`)).json(), exported);
    await running.stop();
    sql(directory, "CREATE TRIGGER fail_create BEFORE INSERT ON games BEGIN SELECT RAISE(ABORT, 'disk write rejected'); END;");
    running = await host(directory);
    assert.equal((await running.request('create', {})).status, 503);
    await running.stop();
    sql(directory, 'DROP TRIGGER fail_create; DROP TRIGGER fail_update; DROP TRIGGER fail_delete;');
    running = await host(directory);
    assert.deepEqual(await (await running.request(`export?gameId=${id}`)).json(), exported, 'failed command never reaches disk');
    assert.equal((await running.request('restart', { id, numRounds: 3 })).status, 200);
    await running.stop();
    running = await host(directory);
    assert.equal((await (await running.request(`export?gameId=${id}`)).json()).game.numRounds, 3);
    assert.equal((await running.request('delete', { id })).status, 200);
    await running.stop();
    running = await host(directory);
    assert.equal((await running.request(`export?gameId=${id}`)).status, 404);
    assert.equal((await readdir(path.join(directory, 'backups'))).length, 3);
});

test('unsupported database versions and malformed saved games fail without erasing data', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-invalid-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    sql(directory, 'PRAGMA user_version=99; CREATE TABLE precious (value TEXT); INSERT INTO precious VALUES ("keep");'.replace('"keep"', "'keep'"));
    const filename = path.join(directory, 'games.sqlite');
    const before = await readFile(filename);
    await host(directory, true);
    assert.deepEqual(await readFile(filename), before);
    sql(directory, "DROP TABLE precious; PRAGMA user_version=1; CREATE TABLE games(id TEXT PRIMARY KEY, snapshot TEXT); INSERT INTO games VALUES ('ABCD', '{}');");
    const invalid = await readFile(filename);
    await host(directory, true);
    assert.deepEqual(await readFile(filename), invalid);
});


test('a failed bind releases timers and storage so the host can be started again', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-bind-'));
    const occupied = createServer();
    let running;
    t.after(async () => {
        await running?.stop();
        if (occupied.listening) await new Promise(resolve => occupied.close(resolve));
        await rm(directory, { recursive: true, force: true });
    });
    await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve));
    const address = occupied.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP address');
    await host(directory, true, String(address.port));
    running = await host(directory);
    assert.equal((await running.request('create', {})).status, 200);
});
