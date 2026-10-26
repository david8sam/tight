import assert from 'node:assert/strict';
import { test } from 'node:test';
import { request } from 'node:http';
import { connect } from 'node:net';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';

process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');

let cookie = '';
function http(port, headers = {}, method = 'GET', pathname = '/api/game/list') {
    return new Promise((resolve, reject) => {
        const req = request({ hostname: '127.0.0.1', port, path: pathname, method, headers: { Cookie: cookie, ...headers } }, res => {
            res.resume();
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
        });
        req.on('error', reject);
        req.end();
    });
}
async function rawStatus(port, headers) {
    const socket = connect(port, '127.0.0.1');
    socket.setEncoding('utf8');
    let response = '';
    socket.on('data', data => (response += data));
    const ended = once(socket, 'end', { signal: AbortSignal.timeout(2000) });
    socket.write(`GET /api/game/list HTTP/1.1\r\n${headers.join('\r\n')}\r\nConnection: close\r\n\r\n`);
    try {
        await ended;
        return Number(response.match(/^HTTP\/1.1 (\d+)/)?.[1]);
    } finally {
        socket.destroy();
    }
}
function rejectedSocket(origin, options) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(origin.replace('http:', 'ws:'), options);
        const timer = setTimeout(() => {
            ws.terminate();
            reject(new Error('Handshake timeout'));
        }, 2000);
        ws.on('error', () => {});
        ws.once('open', () => {
            clearTimeout(timer);
            ws.terminate();
            reject(new Error('Unexpected successful handshake'));
        });
        ws.once('unexpected-response', (_request, response) => {
            clearTimeout(timer);
            response.resume();
            ws.terminate();
            resolve(response.statusCode);
        });
    });
}

test('HTTP and WebSocket accept the bound host and reject foreign origins and rebinding hosts', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-network-'));
    const backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
    t.after(async () => {
        await backend.stop();
        await rm(directory, { recursive: true, force: true });
    });
    const { port, origin } = backend;
    cookie = `tight-session=${backend.hostToken}`;
    const valid = await http(port);
    assert.equal(valid.status, 200);
    assert.equal(valid.headers['x-content-type-options'], 'nosniff');
    assert.equal(valid.headers['x-frame-options'], 'DENY');
    assert.equal(valid.headers['cross-origin-resource-policy'], 'same-origin');
    assert.equal(valid.headers['referrer-policy'], 'no-referrer');
    assert.equal((await http(port, { Origin: origin })).status, 200);
    assert.equal((await http(port, { Host: `localhost:${port}`, Origin: `http://localhost:${port}` })).status, 200);
    for (const value of ['https://evil.invalid', 'null', `${origin}/path`, `http://localhost:${port}`]) {
        assert.equal((await http(port, { Origin: value })).status, 403, value);
        assert.equal(await rejectedSocket(origin, { origin: value }), 403, value);
    }
    assert.equal((await http(port, { Origin: 'https://evil.invalid' }, 'POST', '/api/game/create')).status, 403);
    assert.equal((await http(port, { Origin: 'https://evil.invalid' }, 'OPTIONS', '/api/game/create')).status, 403);
    assert.equal((await http(port, { Host: `evil.invalid:${port}` })).status, 421);
    assert.equal((await http(port, { Host: `evil.invalid:${port}` }, 'GET', '/')).status, 421);
    assert.equal(await rejectedSocket(origin, { headers: { Host: `evil.invalid:${port}` } }), 421);
    const foreign = await http(port, { Origin: 'https://evil.invalid' });
    assert.equal(foreign.headers['access-control-allow-origin'], undefined);
    assert.equal(await rawStatus(port, [`Host: 127.0.0.1:${port}`, `Origin: ${origin}`, `Origin: ${origin}`]), 403);
    assert.ok([400, 421].includes(await rawStatus(port, [`Host: 127.0.0.1:${port}`, `Host: evil.invalid:${port}`])));
    const socket = new WebSocket(origin.replace('http:', 'ws:'), { origin, headers: { cookie } });
    try {
        await once(socket, 'message', { signal: AbortSignal.timeout(2000), headers: { cookie: `tight-session=${backend.hostToken}` } });
    } finally {
        socket.terminate();
    }
});

test('explicit localhost binding reports a usable origin and rejects invalid host configuration before startup', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-localhost-'));
    let backend;
    t.after(async () => { await backend?.stop(); await rm(directory, { recursive: true, force: true }); });
    await assert.rejects(startBackend({ host: 'untrusted.invalid', port: 0, dataDirectory: directory }), /TIGHT_HOST/);
    backend = await startBackend({ host: 'localhost', port: 0, dataDirectory: directory });
    assert.equal(new URL(backend.origin).hostname, 'localhost');
    assert.equal((await fetch(`${backend.origin}/api/game/list`, { signal: AbortSignal.timeout(2000), headers: { cookie: `tight-session=${backend.hostToken}` } })).status, 200);
});
