import assert from 'node:assert/strict';
import { test } from 'node:test';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import WebSocket from 'ws';
import { startHttpsHost } from './helpers/https-host.mjs';
import { MessageType } from './helpers/message-types.mjs';

function request(url, ca, { method = 'GET', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
        const client = https.request(url, { ca, method, headers, timeout: 4000 }, response => {
            let text = '';
            response.setEncoding('utf8');
            response.on('data', chunk => { text += chunk; });
            response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, text }));
            response.on('error', reject);
        });
        client.once('error', reject);
        client.once('timeout', () => client.destroy(new Error('HTTPS request timeout')));
        client.end(body);
    });
}

test('configured HTTPS and WSS preserve a nondefault port and verify the configured certificate', async t => {
    const host = await startHttpsHost();
    t.after(host.stop);
    const ca = await readFile(host.certificate);
    assert.ok(Number(new URL(host.origin).port) > 1024);
    const token = new URLSearchParams(new URL(host.claimUrl).hash.slice(1)).get('host');
    const claimed = await request(`${host.origin}/api/session/host`, ca, {
        method: 'POST', headers: { 'content-type': 'application/json', origin: host.origin }, body: JSON.stringify({ token }),
    });
    assert.equal(claimed.status, 200);
    const cookie = claimed.headers['set-cookie']?.[0]?.split(';')[0];
    assert.ok(cookie);
    const headers = { cookie, origin: host.origin };
    const created = await request(`${host.origin}/api/game/create`, ca, {
        method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: '{"numPlayers":1}',
    });
    assert.equal(created.status, 200);
    const id = JSON.parse(created.text);
    const endpoint = new URL('/socket', host.origin);
    endpoint.protocol = 'wss:';
    endpoint.searchParams.set('gameId', id);
    const ws = new WebSocket(endpoint, { ca, headers });
    t.after(() => ws.terminate());
    const snapshot = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { cleanup(); reject(new Error('WSS initialization timeout')); }, 4000);
        const message = raw => { cleanup(); resolve(JSON.parse(raw)); };
        const error = failure => { cleanup(); reject(failure); };
        function cleanup() { clearTimeout(timeout); ws.off('message', message); ws.off('error', error); }
        ws.once('message', message);
        ws.once('error', error);
    });
    assert.equal(snapshot.type, MessageType.BROADCAST_INITIALIZE);
    assert.equal(snapshot.data.game.id, id);
    assert.equal(ws.url, endpoint.href);
    const foreign = await request(`${host.origin}/api/game/validate?gameId=${id}`, ca, {
        headers: { ...headers, origin: host.origin.replace('https:', 'http:') },
    });
    assert.equal(foreign.status, 403);
    await assert.rejects(request(`${host.origin}/api/session`), /self.signed certificate/i);
});
