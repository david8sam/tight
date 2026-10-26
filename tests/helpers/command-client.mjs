import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MessageType as T } from './message-types.mjs';

const versions = new WeakMap();
export function trackCommands(ws) {
    if (versions.has(ws)) return ws;
    const state = { gameId: null, version: null };
    versions.set(ws, state);
    ws.on('message', raw => {
        const packet = JSON.parse(raw);
        if (packet.type !== T.BROADCAST_INITIALIZE && packet.type !== T.BROADCAST_CHANGE) return;
        const game = packet.data.game;
        if (!game || game.deleted) { state.gameId = null; state.version = null; }
        else { state.gameId = game.id; state.version = packet.data.gameVersion; }
    });
    return ws;
}
export function makeBatch(ws, commands, options = {}) {
    const state = versions.get(ws);
    assert.ok(state?.version, 'Expected an initialized, versioned game snapshot');
    return { type: T.COMMAND_BATCH, id: options.id || randomUUID(), baseVersion: options.baseVersion || state.version,
        data: { gameId: commands[0].data.gameId, commands } };
}
export function commandResult(ws, id) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('Command result timeout')); }, 4000);
        function receive(raw) {
            const packet = JSON.parse(raw);
            if (packet.type === T.COMMAND_RESULT && packet.data.id === id) { cleanup(); resolve(packet.data); }
        }
        function close(code, reason) { cleanup(); reject(new Error(`Socket closed before command result (${code}: ${reason})`)); }
        function cleanup() { clearTimeout(timer); ws.off('message', receive); ws.off('close', close); }
        ws.on('message', receive); ws.on('close', close);
    });
}
export async function sendBatch(ws, commands, options) {
    const frame = makeBatch(ws, commands, options);
    const reply = commandResult(ws, frame.id);
    ws.send(JSON.stringify(frame));
    const result = await reply;
    assert.ok(result.status === 'saved' || result.status === 'duplicate', `${result.status}: ${result.message || ''}`);
    return result;
}
export const sendCommand = (ws, type, data, options) => sendBatch(ws, [{ type, data }], options);
