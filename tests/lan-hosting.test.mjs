import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer, request as httpRequest } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';
import { MessageType as T } from './helpers/message-types.mjs';
import { trackCommands, sendCommand } from './helpers/command-client.mjs';
process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');

function packet(ws, predicate = () => true) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('No expected LAN packet'));
        }, 3000);
        const receive = raw => {
            const value = JSON.parse(raw);
            if (predicate(value)) {
                cleanup();
                resolve(value);
            }
        };
        function cleanup() {
            clearTimeout(timeout);
            ws.off('message', receive);
        }
        ws.on('message', receive);
    });
}

test('one host shares over a selected private adapter without restarting the host or splitting broadcasts', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-lan-'));
    const backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
    const sockets = [];
    const occupied = createServer();
    t.after(async () => {
        sockets.forEach(ws => ws.terminate());
        if (occupied.listening) await new Promise(resolve => occupied.close(resolve));
        await backend.stop();
        await rm(directory, { recursive: true, force: true });
    });
    const hostCookie = `tight-session=${backend.hostToken}`;
    const admin = (route, body) =>
        fetch(`${backend.origin}/api/${route}`, {
            headers: { cookie: hostCookie, 'Content-Type': 'application/json' },
            ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(3000),
        });
    assert.equal(backend.getHosting().mode, 'local');
    for (const value of ['0.0.0.0', '127.0.0.1', '8.8.8.8', 'example.com', '::'])
        await assert.rejects(backend.setLanHost(value), /private network/);
    const adapter = backend.getHosting().interfaces[0];
    if (!adapter) {
        t.skip('No private IPv4 adapter in this execution environment');
        return;
    }
    // Different adapters may use the same port; a conflict on the selected adapter must not stop the host.
    await new Promise(resolve => occupied.listen(backend.port, adapter.address, resolve));
    await assert.rejects(backend.setLanHost(adapter.address), { code: 'EADDRINUSE' });
    assert.equal(backend.getHosting().mode, 'local');
    assert.equal((await admin('game/list')).status, 200);
    await new Promise(resolve => occupied.close(resolve));
    const sharing = await backend.setLanHost(adapter.address);
    assert.equal(sharing.mode, 'lan');
    const lanOrigin = `http://${adapter.address}:${backend.port}`;
    assert.equal((await fetch(`${lanOrigin}/api/game/list`)).status, 401);
    assert.equal(
        (await fetch(`${lanOrigin}/api/session`, { headers: { Origin: 'https://evil.invalid' } })).status,
        403,
    );
    const badHost = await new Promise((resolve, reject) => {
        const req = httpRequest(
            { hostname: adapter.address, port: backend.port, path: '/api/session', headers: { Host: 'evil.invalid' } },
            res => {
                res.resume();
                res.on('end', () => resolve(res.statusCode));
            },
        );
        req.on('error', reject);
        req.end();
    });
    assert.equal(badHost, 421);
    const id = await (await admin('game/create', { numPlayers: 1 })).json();
    const invitation = await (
        await admin('session/invite', { role: 'player', gameId: id, playerId: 'LAN player' })
    ).json();
    const claimed = await fetch(`${lanOrigin}/api/session/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitation.token }),
    });
    assert.equal(claimed.status, 200);
    const guestCookie = claimed.headers.get('set-cookie').split(';')[0];
    async function connect(origin, cookie) {
        const ws = trackCommands(new WebSocket(`${origin.replace('http:', 'ws:')}/socket?gameId=${id}`, { headers: { cookie } }));
        ws.on('error', () => {});
        sockets.push(ws);
        await packet(ws);
        return ws;
    }
    const host = await connect(backend.origin, hostCookie);
    const guest = await connect(lanOrigin, guestCookie);
    async function both(type, data, predicate) {
        const observed = [host, guest].map(ws =>
            packet(ws, event => event.type === T.BROADCAST_CHANGE && predicate(event.data.game)),
        );
        await sendCommand(host, type, data);
        await Promise.all(observed);
    }
    await both(
        T.GAME_UPDATE_FACTION,
        { gameId: id, order: 0, name: 'The Arborec', playerIds: ['LAN player'] },
        game => game.factions?.[0]?.name === 'The Arborec',
    );
    const observed = [host, guest].map(ws => packet(ws, event => event.type === T.BROADCAST_CHANGE && event.data.game?.factions?.[0]?.victoryPoints === 2));
    await sendCommand(guest, T.SET_VICTORY_POINTS, { gameId: id, factionName: 'The Arborec', victoryPoints: 2 });
    await Promise.all(observed);
    await backend.setLanHost(adapter.address);
    assert.equal(guest.readyState, WebSocket.OPEN, 'choosing the current adapter is idempotent');
    const disconnected = once(guest, 'close', { signal: AbortSignal.timeout(3000) });
    await backend.setLanHost(null);
    await disconnected;
    assert.equal(host.readyState, WebSocket.OPEN, 'turning Wi-Fi off must preserve the host socket');
    await assert.rejects(fetch(lanOrigin, { signal: AbortSignal.timeout(1000) }));
    const saved = await (await admin('game/export?gameId=' + id)).json();
    assert.equal(saved.game.factions[0].victoryPoints, 2);
    await Promise.all([backend.setLanHost(adapter.address), backend.setLanHost(adapter.address)]);
    assert.equal(
        (await (await fetch(`${lanOrigin}/api/session`, { headers: { cookie: guestCookie } })).json()).role,
        'player',
    );
    await connect(lanOrigin, guestCookie);
    await Promise.all([backend.stop(), backend.stop()]);
    for (const origin of [backend.origin, lanOrigin])
        await assert.rejects(fetch(origin, { signal: AbortSignal.timeout(1000) }));
});
