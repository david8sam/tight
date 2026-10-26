import { trackCommands, makeBatch, sendBatch, sendCommand } from './helpers/command-client.mjs';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import WebSocket from 'ws';
import ts from 'typescript';
import { claimHost, withCookie } from './helpers/host-access.mjs';
let cookie = '';
const fetch = (url, options) => globalThis.fetch(url, withCookie(cookie, options));

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('../src/common/message.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { MessageType: T } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
let server, origin, logs = '';
const sockets = new Set();
let dataDir;

beforeEach(async () => {
    logs = '';
    cookie = '';
    dataDir = await mkdtemp(path.join(tmpdir(), 'tight-server-'));
    server = spawn(process.execPath, ['build/server.js'], {
        cwd: root, env: { ...process.env, TIGHT_USE_HTTP: 'true', PORT: '0', TIGHT_DATA_DIR: dataDir }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stderr.on('data', b => logs += b);
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Server readiness timeout: ${logs}`)), 10000);
        server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${logs}`)); });
        server.stdout.on('data', b => {
            logs += b;
            const match = logs.match(/Server listening on port: (\d+)/);
            if (match) { origin = `http://127.0.0.1:${match[1]}`; clearTimeout(timer); resolve(); }
        });
    });
    cookie = await claimHost(origin, logs);
});

afterEach(async () => {
    for (const ws of sockets) ws.terminate();
    sockets.clear();
    if (server && server.exitCode === null && server.signalCode === null) { const stopped = once(server, 'exit'); server.kill('SIGTERM'); await stopped; }
    await rm(dataDir, { recursive: true, force: true });
});

async function request(path, body) {
    const response = await fetch(origin + '/api' + path, {
        ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(3000),
    });
    assert.equal(response.status, 200);
    return response.json();
}

function waitMessage(ws, predicate) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error(`WebSocket message timeout: ${logs}`)); }, 3000);
        const onMessage = raw => { const value = JSON.parse(raw); if (predicate(value)) { cleanup(); resolve(value); } };
        const onClose = () => { cleanup(); reject(new Error('Socket closed before expected message')); };
        function cleanup() { clearTimeout(timer); ws.off('message', onMessage); ws.off('close', onClose); }
        ws.on('message', onMessage); ws.on('close', onClose);
    });
}

async function connect(id, playerId) {
    const endpoint = new URL('/socket', origin.replace('http:', 'ws:'));
    if (id) endpoint.searchParams.set('gameId', id);
    if (playerId) endpoint.searchParams.set('playerId', playerId);
    const ws = new WebSocket(endpoint, { headers: { cookie } });
    trackCommands(ws);
    sockets.add(ws); ws.on('error', () => {}); ws.once('close', () => sockets.delete(ws));
    const initial = await waitMessage(ws, msg => msg.type === T.BROADCAST_INITIALIZE);
    return { ws, game: initial.data.game, playerId: initial.data.playerId };
}

async function snapshot(id, existing) {
    if (existing) {
        const result = waitMessage(existing, msg => msg.type === T.BROADCAST_INITIALIZE);
        existing.send(JSON.stringify({ type: T.GAME_LOAD, data: { gameId: id } }));
        return (await result).data.game;
    }
    const { ws, game } = await connect(id); ws.close(); return game;
}
async function command(ws, type, data) {
    const changed = waitMessage(ws, msg => msg.type === T.BROADCAST_CHANGE);
    await sendBatch(ws, [{ type, data }, { type: T.GAME_STATUS_SET, data: { gameId: data.gameId } }]);
    await changed;
}
async function gameTest(t, options = {}) {
    const id = await request('/game/create', options);
    const { ws } = await connect(id);
    t.after(() => ws.close());
    return { id, ws };
}

test('WebSocket diagnostics retain message types without player names or private game payloads', async t => {
    // The standalone host-claim URL is an intentional startup credential. Only inspect later traffic.
    logs = '';
    const player = 'Private player 机密';
    const description = 'Private objective must never reach standard output';
    const { id, ws } = await gameTest(t, { numPlayers: 1 });
    await command(ws, T.GAME_ADD_PLAYER, { gameId: id, playerId: player });
    await command(ws, T.GAME_UPDATE_FACTION, {
        gameId: id, order: 0, name: 'The Arborec', color: '#d50000', playerIds: [player],
    });
    await command(ws, T.SET_SECRET_OBJECTIVE, {
        gameId: id, factionName: 'The Arborec',
        secretObjectives: Array.from({ length: 3 }, (_, index) => ({
            cleared: false, objective: { id: -index - 1, description, vp: 1 },
        })),
    });
    const state = await snapshot(id, ws);
    assert.equal(state.factions[0].secretObjectives[0].objective.description, description);
    const second = await connect(id, player);
    assert.equal(second.playerId, player);
    const closed = once(second.ws, 'close');
    second.ws.close();
    await closed;
    while (!logs.includes('Closing web socket connection')) {
        await once(server.stdout, 'data', { signal: AbortSignal.timeout(3000) });
    }
    const traffic = stripVTControlCharacters(logs);
    for (const privateValue of [player, description, 'secretObjectives', cookie.split('=')[1]]) {
        assert.equal(traffic.includes(privateValue), false, `Traffic logs exposed ${privateValue}`);
    }
    assert.doesNotMatch(traffic, new RegExp(`\\b${id}\\b`));
    assert.match(traffic, /Receiving from [a-f0-9-]{36} SET_SECRET_OBJECTIVE/);
    assert.match(traffic, /Sending to [a-f0-9-]{36} BROADCAST_INITIALIZE/);
});

test('round progression respects configured limits of 1, 2, 10, and 20', async t => {
    for (const limit of [1, 2, 10, 20]) {
        const { id, ws } = await gameTest(t, { numRounds: limit });
        const changed = waitMessage(ws, msg => msg.type === T.BROADCAST_CHANGE);
        await sendBatch(ws, [
            ...Array.from({ length: limit + 2 }, () => ({ type: T.GAME_NEXT_ROUND, data: { gameId: id } })),
            { type: T.GAME_STATUS_SET, data: { gameId: id } },
        ]);
        await changed;
        assert.equal((await snapshot(id)).status.round, limit);
    }
});

test('repeated planet acquisition is a no-op and transfer/lose preserve ownership', async t => {
    const { id, ws } = await gameTest(t);
    for (const [order, name] of [[0, 'The Arborec'], [1, 'The Emirates of Hacan']]) {
        await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order, name });
    }
    const data = { gameId: id, factionName: 'The Arborec', planetId: 'Mecatol Rex' };
    await command(ws, T.TAKE_PLANET, { ...data, planetId: [data.planetId, data.planetId] });
    await command(ws, T.REFRESH_PLANET, data);
    await command(ws, T.TAKE_PLANET, data);
    let game = await snapshot(id);
    assert.deepEqual(game.factions[0].planets, ['Mecatol Rex']);
    assert.equal(game.planets['Mecatol Rex'].owner, data.factionName);
    assert.equal(game.planets['Mecatol Rex'].refreshed, true);
    const transfer = { ...data, factionName: 'The Emirates of Hacan' };
    await command(ws, T.TAKE_PLANET, transfer);
    game = await snapshot(id);
    assert.deepEqual(game.factions[0].planets, []);
    assert.deepEqual(game.factions[1].planets, ['Mecatol Rex']);
    assert.equal(game.planets['Mecatol Rex'].owner, transfer.factionName);
    await command(ws, T.LOST_PLANET, transfer);
    await command(ws, T.LOST_PLANET, transfer);
    game = await snapshot(id);
    assert.equal(game.planets['Mecatol Rex'].owner, null);
    assert.deepEqual(game.factions[1].planets, []);
});

test('HTTP deletion notifies both subscribers without affecting another game', async t => {
    const { id, ws } = await gameTest(t);
    const second = await connect(id);
    const other = await gameTest(t);
    const deleted = [ws, second.ws].map(socket => waitMessage(socket, msg => msg.data?.game?.deleted));
    assert.equal(await request('/game/delete', { id }), true);
    await Promise.all(deleted); second.ws.close();
    assert.equal(await request(`/game/validate?gameId=${id}`), false);
    assert.equal(await request(`/game/validate?gameId=${other.id}`), true);
    assert.equal(await request('/game/delete', { id }), false);
});

test('missing restart ends with a structured 404', async () => {
    const response = await fetch(origin + '/api/game/restart', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 'AAAA' }),
        signal: AbortSignal.timeout(1500),
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Game not found' });
});

test('unknown API operations return JSON errors instead of the application HTML', async () => {
    for (const method of ['GET', 'POST']) {
        const response = await fetch(origin + '/api/not-an-operation', { method, signal: AbortSignal.timeout(1500) });
        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), { error: 'API operation not found' });
    }
});

test('malformed JSON and invalid envelopes close only the offending socket', async () => {
    for (const [payload, expected] of [
        ['{', 1007], ['null', 1008], ['[]', 1008], ['true', 1008],
        ['{"type":9999,"data":{}}', 1008], ['{"type":"9","data":{}}', 1008],
        [JSON.stringify({ type: T.GAME_NEXT_ROUND, data: null }), 1008],
        [JSON.stringify({ type: T.GAME_NEXT_ROUND, data: [] }), 1008],
    ]) {
        const { ws } = await connect(); const closed = once(ws, 'close'); ws.send(payload);
        const [code] = await closed; assert.equal(code, expected);
        assert.equal(server.exitCode, null);
        assert.ok((await request('/planet/list-names')).includes('Mecatol Rex'));
    }
});

test('binary and oversized messages are bounded without killing a healthy client', async () => {
    const healthy = await connect();
    for (const [payload, code] of [[Buffer.from('{}'), 1003], ['x'.repeat(65537), 1009]]) {
        const { ws } = await connect(); const closed = once(ws, 'close'); ws.send(payload);
        // ws reports oversized payload errors before close; connect() consumes errors.
        const [actual] = await closed; assert.equal(actual, code);
    }
    const id = await request('/game/create', {});
    try {
        const loaded = waitMessage(healthy.ws, msg => msg.type === T.BROADCAST_INITIALIZE && msg.data?.game?.id === id);
        healthy.ws.send(JSON.stringify({ type: T.GAME_LOAD, data: { gameId: id } }));
        assert.equal((await loaded).data.game.id, id);
    } finally { healthy.ws.close(); await request('/game/delete', { id }); }
});

test('game creation rejects malformed, oversized, and unknown fields without accepting invalid state', async () => {
    for (const body of [
        null, [], 'not an object', { numPlayers: 0 }, { numPlayers: 9 }, { numPlayers: 1.5 },
        { numPlayers: '2' }, { numRounds: 0 }, { numRounds: 21 }, { numVictoryPoints: -1 },
        { version: 'unknown' }, { players: { injected: { id: 'injected' } } },
        { publicObjectives: [{ id: 1, description: '', vp: 99 }] },
        { publicObjectives: [{ id: 1, description: 'x'.repeat(1025), vp: 1 }] },
        { publicObjectives: [{ id: 1, description: '', vp: 1 }, { id: 1, description: '', vp: 1 }] },
        JSON.parse('{"__proto__":{"polluted":true}}'),
    ]) {
        const response = await fetch(origin + '/api/game/create', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(2000),
        });
        assert.equal(response.status, 400, JSON.stringify(body).slice(0, 100));
        assert.equal(typeof (await response.json()).error, 'string');
        assert.equal(server.exitCode, null);
    }
});

test('REST query and body validation reject arrays, duplicate keys, and unsafe identifiers', async () => {
    for (const path of [
        '/game/validate?gameId=constructor', '/game/validate?gameId=ABCD&gameId=EFGH',
        '/game/list-players?gameId[]=ABCD', '/faction/get-faction',
        '/faction/get-faction?name[]=The%20Arborec', '/faction/get-faction?name=constructor',
        '/planet/search?select[]=name', '/planet/search?select=__proto__',
    ]) {
        const response = await fetch(origin + '/api' + path, { signal: AbortSignal.timeout(2000) });
        assert.equal(response.status, 400, path);
        assert.deepEqual(await response.json(), { error: 'Invalid request' });
    }
    for (const [body, expected] of [['{', 400], [JSON.stringify({ padding: 'x'.repeat(65537) }), 413]]) {
        const response = await fetch(origin + '/api/game/create', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(2000),
        });
        assert.equal(response.status, expected);
        assert.equal(typeof (await response.json()).error, 'string');
    }
    assert.ok((await request('/planet/list-names')).includes('Mecatol Rex'));
});

test('invalid commands cannot crash the host, overwrite state, or reference missing game entities', async t => {
    const { id, ws } = await gameTest(t, { numPlayers: 2, publicObjectives: [{ id: 1, description: '', vp: 1 }] });
    await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order: 0, name: 'The Arborec' });
    await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order: 1, name: 'The Emirates of Hacan' });
    const before = await snapshot(id, ws);
    const planet = { factionName: 'The Arborec', planetId: 'Mecatol Rex' };
    for (const [type, fields] of [
        [T.GAME_UPDATE_FACTION, { order: -1 }], [T.GAME_UPDATE_FACTION, { order: 2 }],
        [T.GAME_UPDATE_FACTION, { order: 0, planets: [] }], [T.GAME_UPDATE_FACTION, { order: 0, name: 'Unknown' }],
        [T.GAME_UPDATE_FACTION, { order: 0, color: 'url(javascript:evil)' }],
        [T.GAME_UPDATE_FACTION, { order: 0, playerIds: ['Unregistered'] }],
        [T.GAME_REORDER_FACTION, { index: 1, newIndex: 2 }],
        [T.TAKE_PLANET, { ...planet, planetId: 'Unknown' }], [T.TAKE_PLANET, { factionName: 'The Arborec' }],
        [T.TAKE_PLANET, { ...planet, factionName: 'The Naalu Collective' }],
        [T.UPDATE_PLANET, { planetId: 'Mecatol Rex', modifiers: { owner: 'The Arborec' } }],
        [T.UPDATE_PLANET, { planetId: 'Mecatol Rex', modifiers: { resources: 'many' } }],
        [T.GAME_STATUS_SET, { turn: 999 }], [T.GAME_STATUS_SET, { turn: 1 }], [T.GAME_STATUS_SET, { phase: 2 }],
        [T.GAME_STATUS_SET, { pickOrder: [] }], [T.GAME_STATUS_SET, { pickTurn: 7 }],
        [T.GAME_STATUS_SET, { pickOrder: ['The Arborec', 'The Arborec'] }],
        [T.GAME_SET_SPEAKER, { speaker: 'The Naalu Collective' }],
        [T.GAME_SET_PUBLIC_OBJECTIVES, { publicObjectives: [{ id: -1, description: '', vp: 1 }] }],
        [T.SET_PUBLIC_OBJECTIVES, { factionName: 'The Arborec', publicObjectives: [false, true] }],
        [T.SET_SECRET_OBJECTIVE, { factionName: 'The Arborec', secretObjectives: [] }],
        [T.PASS_TURN, { factionName: 'The Arborec', passed: 'true' }],
        [T.START_GAME, {}], [T.GAME_ADD_PLAYER, { playerId: '__proto__' }],
        [T.GAME_ADD_PLAYER, { playerId: 'constructor' }], [T.GAME_ADD_PLAYER, { playerId: 'x'.repeat(81) }],
    ]) {
        const offender = await connect(id);
        const rejected = new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Expected command rejection')), 3000);
            offender.ws.once('close', code => { clearTimeout(timer); resolve(code === 1008); });
            offender.ws.on('message', raw => {
                const packet = JSON.parse(raw);
                if (packet.type === T.COMMAND_RESULT) { clearTimeout(timer); resolve(packet.data.status === 'rejected'); }
            });
        });
        offender.ws.send(JSON.stringify(makeBatch(offender.ws, [{ type, data: { gameId: id, ...fields } }])));
        assert.equal(await rejected, true, `Command ${T[type]} ${JSON.stringify(fields)}`);
        offender.ws.close();
        assert.equal(server.exitCode, null);
        assert.deepEqual(await snapshot(id, ws), before);
    }
    await command(ws, T.GAME_NEXT_ROUND, { gameId: id });
    assert.equal((await snapshot(id, ws)).status.round, 2);
});

test('sparse scored-objective arrays normalize safely and nested valid updates still work', async t => {
    const { id, ws } = await gameTest(t, { numPlayers: 1, publicObjectives: [{ id: 3, description: 'Sparse ID', vp: 2 }] });
    await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order: 0, name: 'The Arborec' });
    await command(ws, T.SET_PUBLIC_OBJECTIVES, { gameId: id, factionName: 'The Arborec', publicObjectives: [null, null, true] });
    await command(ws, T.UPDATE_PLANET, { gameId: id, planetId: 'Mecatol Rex', modifiers: { influence: -1, trait: ['CULTURAL'], DMZ: true } });
    const game = await snapshot(id);
    assert.deepEqual(game.factions[0].publicObjectives, [false, false, true]);
    assert.deepEqual(game.planets['Mecatol Rex'].modifiers, { influence: -1, trait: ['CULTURAL'], DMZ: true });
});

test('invalid handshake queries close without creating a player or crashing the host', async () => {
    for (const query of ['gameId[]=ABCD', 'gameId=ABCD&gameId=EFGH', 'playerId=constructor', 'unknown=field']) {
        const ws = new WebSocket(origin.replace('http:', 'ws:') + '/socket?' + query, { headers: { cookie } });
        trackCommands(ws);
    sockets.add(ws); ws.on('error', () => {}); ws.once('close', () => sockets.delete(ws));
        const [code] = await once(ws, 'close');
        assert.equal(code, 1008);
        assert.equal(server.exitCode, null);
    }
});

test('reconnect snapshots retain a registered Unicode player and leave unknown names unset', async t => {
    const { id, ws } = await gameTest(t);
    const name = 'Host & Unicode 测试';
    await command(ws, T.GAME_ADD_PLAYER, { gameId: id, playerId: name });
    const resumed = await connect(id, name);
    assert.equal(resumed.playerId, name);
    resumed.ws.close();
    const unknown = await connect(id, 'Unknown player');
    assert.equal(unknown.playerId, null);
    unknown.ws.close();
});

test('saved-game list returns summaries and reflects deletion', async t => {
    const { id } = await gameTest(t, { numPlayers: 2, numRounds: 3 });
    const games = await request('/game/list');
    const saved = games.find(game => game.id === id);
    assert.deepEqual(Object.keys(saved).sort(), ['archived', 'date', 'id', 'lastPlayed', 'name', 'numRounds', 'players', 'round', 'state']);
    assert.equal(saved.numRounds, 3);
    assert.equal(saved.round, 1);
    assert.equal(saved.state, 'setup');
    assert.deepEqual(saved.players, []);
    await request('/game/delete', { id });
    assert.equal((await request('/game/list')).some(game => game.id === id), false);
});

test('base and expansion strategy cards cannot be owned by two factions', async t => {
    const { id, ws } = await gameTest(t, { numPlayers: 2 });
    const first = 'The Arborec', second = 'The Emirates of Hacan';
    await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order: 0, name: first });
    await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order: 1, name: second });
    for (const [held, requested] of [[2, 2.1], [2.1, 2], [4, 4.1], [4.1, 4]]) {
        await command(ws, T.TAKE_STRATEGY_CARD, { gameId: id, factionName: first, strategyCard: held });
        await command(ws, T.TAKE_STRATEGY_CARD, { gameId: id, factionName: second, strategyCard: requested });
        const game = await snapshot(id, ws);
        assert.equal(game.factions[0].strategyCard, held);
        assert.equal(game.factions[1].strategyCard, 0);
        assert.equal(game.factions.filter(faction => Math.floor(faction.strategyCard) === Math.floor(held)).length, 1);
        await command(ws, T.RETURN_STRATEGY_CARD, { gameId: id, factionName: first });
    }
});

test('speaker rotation, Naalu initiative, passes and the next round retain the correct game state', async t => {
    const { id, ws } = await gameTest(t, { numPlayers: 3, numRounds: 2 });
    const names = ['The Naalu Collective', 'The Arborec', 'The Emirates of Hacan'];
    for (const [order, name] of names.entries()) {
        await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order, name });
    }
    await command(ws, T.GAME_STATUS_SET, { gameId: id, pickOrder: names });
    await command(ws, T.GAME_SET_SPEAKER, { gameId: id, speaker: names[2] });
    let game = await snapshot(id, ws);
    assert.deepEqual(game.status.pickOrder, [names[2], names[0], names[1]]);
    assert.equal(game.status.speaker, names[2]);
    for (const [index, strategyCard] of [8, 1, 5].entries()) {
        await command(ws, T.TAKE_STRATEGY_CARD, { gameId: id, factionName: names[index], strategyCard });
    }
    game = await snapshot(id, ws);
    assert.equal(game.status.turn, 8);
    await command(ws, T.GAME_STATUS_SET, { gameId: id, phase: 1 });
    for (const [index, expectedTurn] of [1, 5, 9].entries()) {
        await command(ws, T.PASS_TURN, { gameId: id, factionName: names[index], passed: true });
        assert.equal((await snapshot(id, ws)).status.turn, expectedTurn);
    }
    await command(ws, T.TAKE_PLANET, { gameId: id, factionName: names[0], planetId: 'Mecatol Rex' });
    await command(ws, T.SET_VICTORY_POINTS, { gameId: id, factionName: names[0], victoryPoints: 2 });
    await command(ws, T.GAME_STATUS_SET, { gameId: id, phase: 2 });
    await command(ws, T.GAME_NEXT_ROUND, { gameId: id });
    game = await snapshot(id, ws);
    assert.equal(game.status.round, 2);
    assert.equal(game.status.phase, 0);
    assert.equal(game.status.turn, 0);
    assert.equal(game.status.speaker, names[2]);
    assert.deepEqual(game.status.pickOrder, [names[2], names[0], names[1]]);
    assert.ok(game.factions.every(faction => faction.strategyCard === 0 && !faction.passed && !faction.stragetyCardFlipped));
    assert.equal(game.factions[0].hasNaaluZeroToken, true);
    assert.equal(game.factions[0].victoryPoints, 2);
    assert.deepEqual(game.factions[0].planets, ['Mecatol Rex']);
    assert.equal(game.planets['Mecatol Rex'].owner, names[0]);
});

test('restarting a game preserves players and configuration while resetting its played state', async t => {
    const objective = { id: 3, description: 'Configured objective', vp: 2 };
    const { id, ws } = await gameTest(t, { numPlayers: 2, numRounds: 3, numVictoryPoints: 12, publicObjectives: [objective] });
    await command(ws, T.GAME_ADD_PLAYER, { gameId: id, playerId: 'Returning player' });
    await command(ws, T.GAME_UPDATE_FACTION, { gameId: id, order: 0, name: 'The Arborec', playerIds: ['Returning player'] });
    await command(ws, T.GAME_NEXT_ROUND, { gameId: id });
    await command(ws, T.SET_VICTORY_POINTS, { gameId: id, factionName: 'The Arborec', victoryPoints: 4 });
    await request('/game/restart', { id });
    const game = await snapshot(id, ws);
    assert.deepEqual(game.players, ['Returning player']);
    assert.equal(game.numPlayers, 2);
    assert.equal(game.numRounds, 3);
    assert.equal(game.numVictoryPoints, 12);
    assert.deepEqual(game.publicObjectives, [objective]);
    assert.equal(game.status.round, 1);
    assert.equal(game.status.started, false);
    assert.equal(game.status.phase, 0);
    assert.ok(game.factions.every(faction => faction.name === 'None' && faction.victoryPoints === 0));
});
