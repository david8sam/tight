import { WebSocketServer as WSServer, WebSocket as WS } from 'ws';

import { GameChangeDataMap, GameChangeData } from 'common/Game.js';
import { ChangeData, MessageType } from 'common/message.js';

import { logWS } from './log.js';
import { getGameVersion } from './database/game.js';

export interface WebSocketServer extends WSServer {}

export interface WebSocket extends WS {
    isAlive: boolean;
    accessToken?: string | null;
    socketId?: string;
    gameId?: string | null;
    playerId?: string | null;
}

export function getWebSocketLogId(ws: WebSocket) {
    return ws.socketId || 'unidentified';
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
    if (ws.readyState !== WS.OPEN) return;
    // A stalled reader must not retain an unbounded queue of game snapshots.
    if (ws.bufferedAmount > 1024 * 1024) {
        ws.terminate();
        return;
    }
    const id = getWebSocketLogId(ws);
    logWS(true, id, type);
    ws.send(JSON.stringify({ type, data, error }));
}

export interface BroadcastChangeDataParams {
    wss: WebSocketServer;
    dirtyGames: GameChangeDataMap;
    serialize: (ws: WebSocket, change: GameChangeData) => GameChangeData | null;
    error?: any;
}

/**
 * Broadcast a message to all connected clients.
 */
export function broadcastChangeData({ wss, dirtyGames, error, serialize }: BroadcastChangeDataParams) {
    wss.clients.forEach((socket: WS) => {
        const ws = socket as WebSocket;
        const game = ws.gameId && dirtyGames[ws.gameId];
        if (game && ws.readyState === WS.OPEN) {
            const serialized = serialize(ws, game);
            if (!serialized) return;
            const data: ChangeData = { game: serialized, gameVersion: getGameVersion(game.id) };
            sendData({ ws, type: MessageType.BROADCAST_CHANGE, data, error });
        }
    });
}
