import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import WebSocket from 'ws';
import { MessageType as T } from './helpers/message-types.mjs';
import { trackCommands, makeBatch, commandResult, sendBatch, sendCommand } from './helpers/command-client.mjs';

process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');

function packet(ws, predicate) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('Expected command protocol packet')); }, 4000);
        function receive(raw) {
            const value = JSON.parse(raw);
            if (predicate(value)) { cleanup(); resolve(value); }
        }
        function close(code) { cleanup(); reject(new Error(`Connection closed before packet (${code})`)); }
        function cleanup() { clearTimeout(timer); ws.off('message', receive); ws.off('close', close); }
        ws.on('message', receive);
        ws.on('close', close);
    });
}

async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-wire-'));
    let backend;
    const sockets = new Set();
    async function stop() {
        for (const ws of sockets) ws.terminate();
        sockets.clear();
        await backend?.stop();
        backend = undefined;
    }
    async function start() {
        backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
        return backend.hostToken;
    }
    t.after(async () => {
        await stop();
        await rm(directory, { recursive: true, force: true });
    });
    await start();
    async function request(route, body) {
        const response = await fetch(`${backend.origin}/api/game/${route}`, {
            headers: { cookie: `tight-session=${backend.hostToken}`, 'Content-Type': 'application/json' },
            ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(4000),
        });
        assert.equal(response.status, 200, `Request ${route} failed`);
        return response.json();
    }
    const id = await request('create', { numPlayers: 1 });
    async function connect(playerId) {
        const url = new URL('/socket', backend.origin.replace('http:', 'ws:'));
        url.searchParams.set('gameId', id);
        if (playerId) url.searchParams.set('playerId', playerId);
        const ws = trackCommands(new WebSocket(url, { headers: { cookie: `tight-session=${backend.hostToken}` } }));
        ws.on('error', () => {});
        sockets.add(ws);
        ws.once('close', () => sockets.delete(ws));
        const initial = await packet(ws, value => value.type === T.BROADCAST_INITIALIZE);
        return { ws, initial: initial.data };
    }
    async function snapshot(ws, playerId) {
        const reply = packet(ws, value => value.type === T.BROADCAST_INITIALIZE);
        ws.send(JSON.stringify({ type: T.GAME_LOAD, data: { gameId: id, ...(playerId ? { playerId } : {}) } }));
        return (await reply).data;
    }
    async function send(ws, frame) {
        const reply = commandResult(ws, frame.id);
        ws.send(JSON.stringify(frame));
        return reply;
    }
    function sql(statement) {
        const db = new DatabaseSync(path.join(directory, 'games.sqlite'));
        try { db.exec(statement); } finally { db.close(); }
    }
    return { id, directory, request, connect, snapshot, send, start, stop, sql, token: () => backend.hostToken };
}

const add = (id, playerId) => ({ type: T.GAME_ADD_PLAYER, data: { gameId: id, playerId } });

test('subscriptions return versioned snapshots without registering an unknown player or changing durable state', async t => {
    const f = await fixture(t);
    const before = await f.request(`export?gameId=${f.id}`);
    const { ws, initial } = await f.connect('Unknown player');
    assert.equal(initial.loadedGameId, f.id);
    assert.equal(initial.playerId, null);
    assert.equal(initial.gameVersion.revision, 1);
    const loaded = await f.snapshot(ws, 'Another unknown player');
    assert.equal(loaded.loadedGameId, f.id);
    assert.equal(loaded.playerId, null);
    assert.deepEqual(loaded.gameVersion, initial.gameVersion);
    assert.deepEqual(loaded.game.players, []);
    assert.deepEqual(await f.request(`export?gameId=${f.id}`), before);
});

test('a missing game snapshot still identifies the requested subscription', async t => {
    const f = await fixture(t);
    const { ws } = await f.connect();
    assert.equal(await f.request('delete', { id: f.id }), true);
    const loaded = await f.snapshot(ws);
    assert.equal(loaded.loadedGameId, f.id);
    assert.equal(loaded.game, null);
    assert.equal(loaded.gameVersion, null);
});

test('concurrent editors get one saved result and one stale result; IDs reject changed payloads and survive host restart', async t => {
    const f = await fixture(t);
    const a = await f.connect();
    const b = await f.connect();
    const frames = [makeBatch(a.ws, [add(f.id, 'First')]), makeBatch(b.ws, [add(f.id, 'Second')])];
    const replies = await Promise.all([f.send(a.ws, frames[0]), f.send(b.ws, frames[1])]);
    assert.deepEqual(replies.map(reply => reply.status).sort(), ['saved', 'stale']);
    const winner = replies.findIndex(reply => reply.status === 'saved');
    const accepted = frames[winner];
    const saved = replies[winner];
    assert.equal(saved.version.revision, a.initial.gameVersion.revision + 1);
    const current = await f.snapshot(a.ws);
    assert.deepEqual(current.game.players, [accepted.data.commands[0].data.playerId]);
    assert.deepEqual(current.gameVersion, saved.version);
    const changed = structuredClone(accepted);
    changed.data.commands[0].data.playerId = 'Changed payload';
    assert.equal((await f.send(a.ws, changed)).status, 'conflict');
    assert.equal((await f.send(a.ws, accepted)).status, 'duplicate');
    const token = f.token();
    await f.stop();
    assert.notEqual(await f.start(), token, 'a new host credential must not lose administrator receipts');
    const reopened = await f.connect();
    const replay = await f.send(reopened.ws, accepted);
    assert.equal(replay.status, 'duplicate');
    assert.deepEqual(replay.version, saved.version);
    assert.deepEqual(reopened.initial.game.players, current.game.players);
    assert.deepEqual(reopened.initial.gameVersion, saved.version);
});

test('reconnecting after an ignored acknowledgment retries the same command once without applying it twice', async t => {
    const f = await fixture(t);
    const { ws, initial } = await f.connect();
    const frame = makeBatch(ws, [{ type: T.GAME_NEXT_ROUND, data: { gameId: f.id } }]);
    const applied = packet(ws, value => value.type === T.BROADCAST_INITIALIZE && value.data.game?.status.round === 2);
    ws.send(JSON.stringify(frame));
    await applied;
    ws.terminate();
    const reconnected = await f.connect();
    assert.equal(reconnected.initial.game.status.round, 2);
    const duplicate = await f.send(reconnected.ws, frame);
    assert.equal(duplicate.status, 'duplicate');
    assert.equal(duplicate.version.revision, initial.gameVersion.revision + 1);
    const current = await f.snapshot(reconnected.ws);
    assert.equal(current.game.status.round, 2);
    assert.deepEqual(current.gameVersion, duplicate.version);
});

test('an invalid second command rolls back the complete gesture, its revision, player binding, and later broadcasts', async t => {
    const f = await fixture(t);
    const { ws, initial } = await f.connect();
    const observer = await f.connect();
    const before = await f.request(`export?gameId=${f.id}`);
    const frame = makeBatch(ws, [add(f.id, 'Must roll back'), {
        type: T.GAME_UPDATE_FACTION, data: { gameId: f.id, order: 7, name: 'The Arborec' },
    }]);
    const rejected = await f.send(ws, frame);
    assert.equal(rejected.status, 'rejected');
    assert.match(rejected.message, /bounds/);
    assert.deepEqual(rejected.version, initial.gameVersion);
    const after = await f.snapshot(ws);
    assert.equal(after.playerId, null);
    assert.deepEqual(after.gameVersion, initial.gameVersion);
    assert.deepEqual(await f.request(`export?gameId=${f.id}`), before);
    const observed = packet(observer.ws, value => value.type === T.BROADCAST_CHANGE);
    await sendCommand(ws, T.GAME_STATUS_SET, { gameId: f.id });
    const broadcast = await observed;
    assert.ok(!broadcast.data.game.players?.includes('Must roll back'));
    assert.deepEqual((await f.snapshot(observer.ws)).game.players, []);
    await sendCommand(ws, T.GAME_ADD_PLAYER, { gameId: f.id, playerId: 'Healthy connection' });
    assert.deepEqual((await f.snapshot(ws)).game.players, ['Healthy connection']);
});

test('a repeated start gesture is acknowledged before later state validation and never reapplies its home planets', async t => {
    const f = await fixture(t);
    const { ws } = await f.connect();
    await sendBatch(ws, [add(f.id, 'Host'), {
        type: T.GAME_UPDATE_FACTION,
        data: { gameId: f.id, order: 0, name: 'The Arborec', color: '#d50000', playerIds: ['Host'] },
    }, { type: T.GAME_STATUS_SET, data: { gameId: f.id, pickOrder: ['The Arborec'] } }]);
    const start = makeBatch(ws, [{ type: T.START_GAME, data: { gameId: f.id } }]);
    const saved = await f.send(ws, start);
    assert.equal(saved.status, 'saved');
    const started = await f.snapshot(ws);
    assert.equal(started.game.status.started, true);
    const home = started.game.factions[0].planets[0];
    assert.ok(home);
    await sendCommand(ws, T.LOST_PLANET, { gameId: f.id, factionName: 'The Arborec', planetId: home });
    await sendCommand(ws, T.GAME_UPDATE_FACTION, { gameId: f.id, order: 0, color: 'None' });
    const beforeReplay = await f.request(`export?gameId=${f.id}`);
    const duplicate = await f.send(ws, start);
    assert.equal(duplicate.status, 'duplicate');
    assert.deepEqual(duplicate.version, saved.version, 'the receipt reports its original committed revision');
    assert.deepEqual(await f.request(`export?gameId=${f.id}`), beforeReplay);
    const newlyInvalid = makeBatch(ws, [{ type: T.START_GAME, data: { gameId: f.id } }]);
    assert.equal((await f.send(ws, newlyInvalid)).status, 'rejected');
    assert.ok(!(await f.snapshot(ws)).game.factions[0].planets.includes(home));
});

test('deleting and importing the same game code starts a new incarnation and rejects old command receipts', async t => {
    const f = await fixture(t);
    const { ws, initial } = await f.connect();
    const frame = makeBatch(ws, [add(f.id, 'Old incarnation')]);
    assert.equal((await f.send(ws, frame)).status, 'saved');
    const exported = await f.request(`export?gameId=${f.id}`);
    assert.equal(await f.request('delete', { id: f.id }), true);
    await f.request('import', exported);
    const reopened = await f.connect();
    assert.notEqual(reopened.initial.gameVersion.incarnation, initial.gameVersion.incarnation);
    const result = await f.send(reopened.ws, frame);
    assert.equal(result.status, 'stale');
    assert.deepEqual(result.version, reopened.initial.gameVersion);
    assert.deepEqual(await f.request(`export?gameId=${f.id}`), exported);
});

test('a failed receipt write is unconfirmed, rolls back the game, and can safely retry the exact command after repair', async t => {
    const f = await fixture(t);
    const { ws, initial } = await f.connect();
    const frame = makeBatch(ws, [add(f.id, 'Recovered player')]);
    const before = await f.request(`export?gameId=${f.id}`);
    await f.stop();
    f.sql("CREATE TRIGGER fail_receipt BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'receipt write rejected'); END;");
    await f.start();
    const failing = await f.connect();
    const closed = once(failing.ws, 'close');
    assert.equal((await f.send(failing.ws, frame)).status, 'unconfirmed');
    assert.equal((await closed)[0], 1011);
    assert.deepEqual(await f.request(`export?gameId=${f.id}`), before);
    await f.stop();
    f.sql('DROP TRIGGER fail_receipt;');
    await f.start();
    const retry = await f.connect();
    assert.deepEqual(retry.initial.gameVersion, initial.gameVersion);
    const saved = await f.send(retry.ws, frame);
    assert.equal(saved.status, 'saved');
    assert.equal(saved.version.revision, initial.gameVersion.revision + 1);
    assert.equal((await f.send(retry.ws, frame)).status, 'duplicate');
    const recovered = await f.snapshot(retry.ws);
    assert.deepEqual(recovered.game.players, ['Recovered player']);
    assert.deepEqual(recovered.gameVersion, saved.version);
});
