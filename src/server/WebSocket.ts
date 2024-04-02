import { WebSocketServer as WSServer, WebSocket as WS } from 'ws';

import { GameChangeDataMap } from 'common/Game.js';
import { ChangeData, MessageType } from 'common/message.js';

import { logWS } from './log.js';

export interface WebSocketServer extends WSServer {}

export interface WebSocket extends WS {
    isAlive: boolean;
    socketId?: string;
    gameId?: string | null;
    playerId?: string | null;
}

export function getWebSocketLogId(ws: WebSocket) {
    return `${ws.socketId} (${ws.gameId || 'no game'}, ${ws.playerId || 'anonymous'})`;
}

export interface SendDataParams {
    ws: WebSocket;
    type: MessageType;
    data?: any;
    error?: any;
}

/**
 * Send data to one client
 */
export function sendData({ ws, type, data, error }: SendDataParams) {
    const id = getWebSocketLogId(ws);
    logWS(true, id, { type, data, error });
    ws.send(JSON.stringify({ type, data, error }));
}

export interface BroadcastChangeDataParams {
    wss: WebSocketServer;
    dirtyGames: GameChangeDataMap;
    error?: any;
}

/**
 * Broadcast a message to all connected clients.
 */
export function broadcastChangeData({ wss, dirtyGames, error }: BroadcastChangeDataParams) {
    wss.clients.forEach((socket: WS) => {
        const ws = socket as WebSocket;
        const game = ws.gameId && dirtyGames[ws.gameId];
        if (game) {
            const data: ChangeData = { game };
            const payload = { type: MessageType.BROADCAST_CHANGE, data, error };
            const id = getWebSocketLogId(ws);
            logWS(true, id, payload);
            ws.send(JSON.stringify(payload));
        }
    });
}
