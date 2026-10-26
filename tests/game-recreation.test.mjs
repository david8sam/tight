import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import WebSocket from 'ws';
import { MessageType as T } from './helpers/message-types.mjs';

process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');

test('a replacement game supersedes a queued deletion before the next broadcast', async t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-recreation-'));
    const backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
    const sockets = [];
    t.after(async () => {
        for (const socket of sockets) socket.terminate();
        await backend.stop();
        await rm(directory, { recursive: true, force: true });
    });
    const request = (route, body) => fetch(backend.origin + '/api/' + route, {
        headers: { cookie: `tight-session=${backend.hostToken}`, 'content-type': 'application/json' },
        ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(3000),
    });
    const created = await request('game/create', { numPlayers: 1 });
    assert.equal(created.status, 200);
    const id = await created.json();
    const exported = await (await request('game/export?gameId=' + id)).json();
    exported.game.numRounds = 7;
    const connect = async () => {
        const socket = new WebSocket(backend.origin.replace('http:', 'ws:') + '/socket?gameId=' + id, {
            headers: { cookie: `tight-session=${backend.hostToken}` },
        });
        sockets.push(socket);
        const [raw] = await once(socket, 'message', { signal: AbortSignal.timeout(3000) });
        return { socket, initial: JSON.parse(raw).data };
    };
    const old = await connect();
    assert.equal((await request('game/delete', { id })).status, 200);
    assert.equal((await request('game/import', exported)).status, 200);
    const replacement = await connect();
    assert.notEqual(replacement.initial.gameVersion.incarnation, old.initial.gameVersion.incarnation);
    const updates = sockets.map(socket => once(socket, 'message', { signal: AbortSignal.timeout(3000) }));
    t.mock.timers.tick(300);
    for (const [raw] of await Promise.all(updates)) {
        const packet = JSON.parse(raw);
        assert.equal(packet.type, T.BROADCAST_CHANGE);
        assert.equal(packet.data.game.deleted, undefined, 'the old deletion cannot delete the replacement snapshot');
        assert.equal(packet.data.game.created.numRounds, 7);
        assert.deepEqual(packet.data.gameVersion, replacement.initial.gameVersion);
    }
    const deleted = sockets.map(socket => once(socket, 'message', { signal: AbortSignal.timeout(3000) }));
    assert.equal((await request('game/delete', { id })).status, 200);
    t.mock.timers.tick(300);
    for (const [raw] of await Promise.all(deleted)) assert.equal(JSON.parse(raw).data.game.deleted, true);
});
