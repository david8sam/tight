import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import WebSocket from 'ws';
import { MessageType as T } from './helpers/message-types.mjs';
import { trackCommands, makeBatch } from './helpers/command-client.mjs';
process.env.TIGHT_USE_HTTP = 'true';
const { startBackend } = await import('../build/backend.js');
const source = await readFile(new URL('../src/server/trafficLimits.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { RateLimit } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('peer allowances refill with time, retain depleted peers, and bound new-peer allocation', () => {
    let now = 0;
    const limit = new RateLimit(2, 1, 2, () => now);
    assert.equal(limit.consume('first'), 0);
    assert.equal(limit.consume('first'), 0);
    assert.equal(limit.consume('first'), 1);
    assert.equal(limit.consume('second'), 0);
    assert.equal(limit.consume('second'), 0);
    assert.equal(limit.consume('third'), 2);
    assert.equal(limit.consume('first'), 1, 'a new peer must not evict and reset a depleted allowance');
    now = 500;
    assert.equal(limit.consume('first'), 1);
    now = 1000;
    assert.equal(limit.consume('first'), 0);
    now = 500;
    assert.equal(limit.consume('first'), 1, 'a backwards clock must not add tokens');
    now = 3000;
    assert.equal(limit.consume('third'), 0, 'fully refilled idle entries can be reclaimed');
    assert.equal(limit.consume('third'), 0);
    assert.equal(limit.consume('third'), 1);
});

test('a batch spends one allowance per inner command without partially spending a rejected batch', () => {
    let now = 0;
    const limit = new RateLimit(60, 10, 1, () => now);
    assert.equal(limit.consume('device', 32), 0);
    assert.equal(limit.consume('device', 32), 1);
    assert.equal(limit.consume('device', 28), 0);
    assert.equal(limit.consume('device'), 1);
    now = 3200;
    assert.equal(limit.consume('device', 32), 0);
    assert.equal(limit.consume('device'), 1);
});

async function host(t) {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-limits-'));
    const backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
    const sockets = [];
    t.after(async () => {
        sockets.forEach(ws => ws.terminate());
        await backend.stop();
        await rm(directory, { recursive: true, force: true });
    });
    const cookie = `tight-session=${backend.hostToken}`;
    const api = (route, body, headers = {}) =>
        fetch(`${backend.origin}/api/${route}`, {
            headers: { cookie, 'Content-Type': 'application/json', ...headers },
            ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
            signal: AbortSignal.timeout(3000),
        });
    const open = async (query = '') => {
        const ws = trackCommands(new WebSocket(backend.origin.replace('http:', 'ws:') + '/' + query, { headers: { cookie } }));
        sockets.push(ws);
        ws.on('error', () => {});
        await once(ws, 'message');
        return ws;
    };
    const reject = (headers = { cookie }) =>
        new Promise((resolve, reject) => {
            const ws = new WebSocket(backend.origin.replace('http:', 'ws:'), { headers });
            sockets.push(ws);
            const timer = setTimeout(() => {
                ws.terminate();
                reject(new Error('Upgrade was not rejected'));
            }, 3000);
            ws.on('error', () => {});
            ws.once('open', () => {
                clearTimeout(timer);
                reject(new Error('Unexpected upgrade'));
            });
            ws.once('unexpected-response', (_request, response) => {
                response.resume();
                clearTimeout(timer);
                ws.terminate();
                resolve({ status: response.statusCode, retry: response.headers['retry-after'] });
            });
        });
    return { backend, api, open, reject };
}

test('HTTP and pairing limits reject bursts before parsing and ignore forwarded-IP spoofing', async t => {
    const { api } = await host(t);
    let response;
    for (let attempt = 0; attempt < 40; attempt++) {
        response = await api('SESSION/CLAIM', { token: 'invalid' }, { 'X-Forwarded-For': `192.168.1.${attempt}` });
        if (response.status === 429) break;
        assert.equal(response.status, 403);
    }
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get('retry-after')) > 0);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(
        (await api('session/claim', { token: 'x'.repeat(100000) })).status,
        429,
        'throttling runs before JSON body parsing',
    );
    assert.equal((await api('game/list')).status, 200, 'a pairing burst must not exhaust ordinary host requests');
    for (let attempt = 0; attempt < 200; attempt++) {
        response = await api('session', undefined, { 'X-Forwarded-For': `10.0.${attempt}.1` });
        if (response.status === 429) break;
        assert.equal(response.status, 200);
    }
    assert.equal(response.status, 429);
    const spoofed = await Promise.all(Array.from({ length: 16 }, (_, index) =>
        api('session', undefined, { 'X-Forwarded-For': `203.0.113.${index}` }),
    ));
    assert.ok(spoofed.some(reply => reply.status === 429), 'changing forwarded addresses must not grant each request a fresh allowance');
    assert.match((await response.json()).error, /Wait a moment/);
});

test('connection slots release on close and command or handshake floods do not reset on reconnect', async t => {
    const { api, open, reject } = await host(t);
    const id = await (await api('game/create', { numPlayers: 1 })).json();
    const clients = [];
    for (let index = 0; index < 16; index++) clients.push(await open(`?gameId=${id}`));
    assert.equal((await reject()).status, 503);
    const closed = once(clients[0], 'close');
    clients[0].close();
    await closed;
    const replacement = await open(`?gameId=${id}`);
    assert.equal(replacement.readyState, WebSocket.OPEN);
    const throttled = once(replacement, 'close');
    const command = JSON.stringify({ type: T.GAME_LOAD, data: { gameId: id } });
    for (let index = 0; index < 100; index++) replacement.send(command);
    assert.equal((await throttled)[0], 1008);
    const exhaustedAt = performance.now();
    const reconnected = await open(`?gameId=${id}`);
    const again = once(reconnected, 'close');
    const batches = Array.from({ length: 2 }, (_, batch) => makeBatch(reconnected,
        Array.from({ length: 32 }, (_, index) => ({
            type: T.GAME_ADD_PLAYER,
            data: { gameId: id, playerId: `Retry ${batch * 32 + index}` },
        })),
    ));
    for (const batch of batches) reconnected.send(JSON.stringify(batch));
    assert.equal((await again)[0], 1008);
    const saved = await (await api(`game/export?gameId=${id}`)).json();
    assert.ok(
        Object.keys(saved.game.players).length <= Math.ceil((performance.now() - exhaustedAt) / 100) + 1,
        'reconnecting must not mint a fresh command burst',
    );
    assert.equal(clients[1].readyState, WebSocket.OPEN, 'other connected clients remain open');
    assert.equal((await api(`game/export?gameId=${id}`)).status, 200, 'the saved game and HTTP host remain usable');
    let rejection;
    for (let attempt = 0; attempt < 45; attempt++) {
        rejection = await reject({ 'X-Forwarded-For': `10.0.0.${attempt}` });
        if (rejection.status === 429) break;
        assert.equal(rejection.status, 401);
    }
    assert.equal(rejection.status, 429);
    assert.ok(Number(rejection.retry) > 0);
    assert.equal(clients[1].readyState, WebSocket.OPEN);
});

for (const flood of ['api', 'pages']) {
    test(`${flood} request bursts cannot consume the other HTTP allowance`, async t => {
        const { backend, api } = await host(t);
        // Exercise the page bucket without requiring assets, which are built after backend CI.
        const page = () => fetch(backend.origin + '/', { method: 'OPTIONS', signal: AbortSignal.timeout(3000) });
        const request = flood === 'api' ? () => api('session') : page;
        let response;
        for (let attempt = 0; attempt < 200; attempt++) {
            response = await request();
            if (response.status === 429) break;
            assert.equal(response.status, 200);
            await response.body?.cancel();
        }
        assert.equal(response.status, 429, 'both request classes remain bounded');
        assert.ok(Number(response.headers.get('retry-after')) > 0);
        const other = await (flood === 'api' ? page() : api('session'));
        assert.equal(other.status, 200, 'page assets and host APIs have independent allowances');
        await other.body?.cancel();
    });
}
