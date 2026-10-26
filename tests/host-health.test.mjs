import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';
process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');

test('private host status counts connected player devices and follows coordinated shutdown', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-health-'));
    let backend;
    const sockets = [];
    t.after(async () => {
        for (const socket of sockets) socket.terminate();
        await backend?.stop();
        await rm(directory, { recursive: true, force: true });
    });
    backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
    const cookie = `tight-session=${backend.hostToken}`;
    const post = async (route, data, credential = cookie) => {
        const response = await fetch(backend.origin + '/api/' + route, {
            method: 'POST',
            headers: { cookie: credential, 'content-type': 'application/json' },
            body: JSON.stringify(data),
        });
        assert.equal(response.status, 200);
        return { data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    };
    const id = (await post('game/create', {})).data;
    const invitation = (await post('session/invite', { role: 'player', gameId: id, playerId: 'Private player' })).data;
    const player = await post('session/claim', { token: invitation.token }, '');
    for (const credential of [cookie, player.cookie, player.cookie]) {
        const socket = new WebSocket(backend.origin.replace('http:', 'ws:') + '/socket?gameId=' + id, {
            headers: { cookie: credential },
        });
        sockets.push(socket);
        await once(socket, 'message', { signal: AbortSignal.timeout(3000) });
    }
    assert.deepEqual(backend.getDiagnostics(), { storage: 'open', connections: 3, connectedPlayers: 1 });
    assert.equal(JSON.stringify(backend.getDiagnostics()).includes('Private player'), false);
    const secondId = (await post('game/create', {})).data;
    const secondInvitation = (
        await post('session/invite', { role: 'player', gameId: secondId, playerId: 'Private player' })
    ).data;
    const secondPlayer = await post('session/claim', { token: secondInvitation.token }, '');
    const secondSocket = new WebSocket(backend.origin.replace('http:', 'ws:') + '/socket?gameId=' + secondId, {
        headers: { cookie: secondPlayer.cookie },
    });
    sockets.push(secondSocket);
    await once(secondSocket, 'message', { signal: AbortSignal.timeout(3000) });
    assert.deepEqual(backend.getDiagnostics(), { storage: 'open', connections: 4, connectedPlayers: 2 });
    assert.equal((await fetch(backend.origin + '/api/diagnostics', { headers: { cookie } })).status, 404);
    await backend.stop();
    assert.deepEqual(backend.getDiagnostics(), { storage: 'closed', connections: 0, connectedPlayers: 0 });
});
