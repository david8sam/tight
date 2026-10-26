import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import WebSocket from 'ws';
import { once } from 'node:events';
process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');

async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-library-'));
    let backend;
    const sockets = new Set();
    async function start() { backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory }); }
    async function stop() {
        for (const socket of sockets) socket.terminate();
        sockets.clear();
        await backend?.stop();
        backend = undefined;
    }
    t.after(async () => { await stop(); await rm(directory, { recursive: true, force: true }); });
    await start();
    const request = (route, body, cookie = `tight-session=${backend.hostToken}`) => fetch(`${backend.origin}/api/${route}`, {
        headers: { cookie, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000),
        ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
    });
    async function json(route, body) {
        const response = await request(route, body);
        assert.equal(response.status, 200);
        return response.json();
    }
    async function snapshot(id) {
        const socket = new WebSocket(`${backend.origin.replace('http:', 'ws:')}/socket?gameId=${id}`, {
            headers: { cookie: `tight-session=${backend.hostToken}` },
        });
        sockets.add(socket);
        const [raw] = await once(socket, 'message', { signal: AbortSignal.timeout(3000) });
        socket.close();
        return JSON.parse(raw).data;
    }
    function sql(operation) {
        assert.equal(backend, undefined);
        const db = new DatabaseSync(path.join(directory, 'games.sqlite'));
        try { return operation(db); } finally { db.close(); }
    }
    return { directory, start, stop, request, json, snapshot, sql };
}

test('names and archives survive restart, preserve exports and live revisions, and restore without data loss', async t => {
    const f = await fixture(t);
    const id = await f.json('game/create', {});
    const before = await f.json(`game/export?gameId=${id}`);
    const version = (await f.snapshot(id)).gameVersion;
    const initial = (await f.json('game/list')).find(game => game.id === id);
    assert.equal(initial.name, null);
    assert.equal(initial.archived, false);
    assert.ok(initial.lastPlayed >= initial.date);
    await f.json('game/rename', { gameId: id, name: '  Saturday 银河  ' });
    await f.json('game/archive', { gameId: id, archived: true });
    await f.json('game/archive', { gameId: id, archived: true });
    await f.stop();
    await f.start();
    const saved = (await f.json('game/list')).find(game => game.id === id);
    assert.equal(saved.name, 'Saturday 银河');
    assert.equal(saved.archived, true);
    assert.equal(saved.lastPlayed, initial.lastPlayed);
    assert.deepEqual(await f.json(`game/export?gameId=${id}`), before);
    assert.deepEqual((await f.snapshot(id)).gameVersion, version);
    await f.json('game/restart', { id });
    const stillArchived = (await f.json('game/list')).find(game => game.id === id);
    assert.equal(stillArchived.name, 'Saturday 银河');
    assert.equal(stillArchived.archived, true);
    assert.ok(stillArchived.lastPlayed > initial.lastPlayed);
    await f.json('game/archive', { gameId: id, archived: false });
    await f.json('game/rename', { gameId: id, name: null });
    await f.json('game/restart', { id });
    const restored = (await f.json('game/list')).find(game => game.id === id);
    assert.equal(restored.name, null);
    assert.equal(restored.archived, false);
    assert.ok(restored.lastPlayed > initial.lastPlayed);
    await f.json('game/delete', { id });
    assert.equal((await f.json('game/list')).some(game => game.id === id), false);
});

test('library mutations require host permission and reject invalid names, flags, and unknown fields', async t => {
    const f = await fixture(t);
    const id = await f.json('game/create', {});
    for (const name of ['', '   ', 'x'.repeat(81), 123])
        assert.equal((await f.request('game/rename', { gameId: id, name })).status, 400);
    assert.equal((await f.request('game/rename', { gameId: id, name: 'Valid', extra: true })).status, 400);
    assert.equal((await f.request('game/archive', { gameId: id, archived: 'true' })).status, 400);
    const missing = id === 'ZZZZ' ? 'YYYY' : 'ZZZZ';
    assert.equal((await f.request('game/rename', { gameId: missing, name: 'Missing' })).status, 404);
    assert.equal((await f.request('game/archive', { gameId: missing, archived: true })).status, 404);
    assert.equal((await f.request('game/rename', { gameId: id, name: 'No' }, '')).status, 401);
    const invite = await f.json('session/invite', { role: 'spectator', gameId: id });
    const claimed = await f.request('session/claim', { token: invite.token }, '');
    const cookie = claimed.headers.get('set-cookie').split(';')[0];
    assert.equal((await f.request('game/rename', { gameId: id, name: 'No' }, cookie)).status, 403);
    assert.equal((await f.request('game/archive', { gameId: id, archived: true }, cookie)).status, 403);
    assert.equal((await f.request('game/list', undefined, cookie)).status, 403);
    assert.equal((await f.json('game/list'))[0].name, null);
});

test('failed organization writes return 503 and preserve the previous library and game state', async t => {
    const f = await fixture(t);
    const id = await f.json('game/create', {});
    await f.json('game/rename', { gameId: id, name: 'Keep me' });
    const before = await f.json('game/list');
    await f.stop();
    f.sql(db => db.exec("CREATE TRIGGER fail_organization BEFORE UPDATE OF name, archived ON games BEGIN SELECT RAISE(ABORT, 'private storage failure'); END"));
    await f.start();
    assert.equal((await f.request('game/rename', { gameId: id, name: 'Lost name' })).status, 503);
    assert.equal((await f.request('game/archive', { gameId: id, archived: true })).status, 503);
    assert.deepEqual(await f.json('game/list'), before);
    assert.equal((await f.json(`game/export?gameId=${id}`)).game.id, id);
});

test('version-three migration preserves game versions and backs up the original schema', async t => {
    const f = await fixture(t);
    const id = await f.json('game/create', {});
    const before = await f.json(`game/export?gameId=${id}`);
    const version = (await f.snapshot(id)).gameVersion;
    await f.stop();
    f.sql(db => db.exec('ALTER TABLE access_sessions DROP COLUMN table_editing; ALTER TABLE games DROP COLUMN name; ALTER TABLE games DROP COLUMN archived; ALTER TABLE games DROP COLUMN last_played; PRAGMA user_version=3'));
    await f.start();
    assert.deepEqual(await f.json(`game/export?gameId=${id}`), before);
    assert.deepEqual((await f.snapshot(id)).gameVersion, version);
    const game = (await f.json('game/list'))[0];
    assert.equal(game.name, null);
    assert.equal(game.archived, false);
    assert.equal(game.lastPlayed, before.game.date);
    const backups = await readdir(path.join(f.directory, 'backups', 'migrations'));
    const filename = backups.find(name => name.startsWith('v3-'));
    assert.ok(filename);
    const db = new DatabaseSync(path.join(f.directory, 'backups', 'migrations', filename), { readOnly: true });
    try {
        assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3);
        assert.equal(db.prepare('PRAGMA table_info(games)').all().some(column => column.name === 'name'), false);
        assert.deepEqual(JSON.parse(db.prepare('SELECT snapshot FROM games').get().snapshot), before.game);
    } finally { db.close(); }
});


test('invalid library metadata prevents startup without replacing the original database', async t => {
    const f = await fixture(t);
    await f.json('game/create', {});
    await f.stop();
    f.sql(db => db.prepare('UPDATE games SET name=?').run('x'.repeat(81)));
    const filename = path.join(f.directory, 'games.sqlite');
    const original = await readFile(filename);
    await assert.rejects(f.start(), error => {
        assert.equal(error.name, 'ZodError');
        assert.match(error.message, /"name"/);
        return true;
    });
    assert.deepEqual(await readFile(filename), original);
});

test('invalid version-four library metadata fails before migration changes the original database', async t => {
    const f = await fixture(t);
    await f.json('game/create', {});
    await f.stop();
    f.sql(db => {
        db.exec('ALTER TABLE access_sessions DROP COLUMN table_editing; PRAGMA user_version=4');
        db.prepare('UPDATE games SET name=?').run('x'.repeat(81));
    });
    const filename = path.join(f.directory, 'games.sqlite');
    const original = await readFile(filename);
    await assert.rejects(f.start(), error => {
        assert.equal(error.name, 'ZodError');
        assert.match(error.message, /"name"/);
        return true;
    });
    assert.deepEqual(await readFile(filename), original);
    f.sql(db => assert.equal(db.prepare('PRAGMA user_version').get().user_version, 4));
});
