import { Application } from 'express';
import http, { IncomingMessage } from 'http';
import https from 'https';
import { parse } from 'url';
import { WebSocketServer as WSServer, WebSocket as WebSocketType } from 'ws';

import { WSS_PORT } from 'common/constants.js';
import { MessageType, PartialData } from 'common/message.js';
import uuidv4 from 'common/uuidv4.js';

import { getGameForClient } from './database/game.js';

import { WebSocket, WebSocketServer, broadcastChangeData, getWebSocketLogId, sendData } from './WebSocket.js';
import { cert, key } from './certs.js';
import { getDirtyGameData, isDirty, removeOldGames, setDirty } from './dirty.js';
import handleMessage from './handleMessage.js';
import log from './log.js';

const KEEP_ALIVE_INTERVAL = 10000; // ms
const BROADCAST_INTERVAL = 300; // ms
const REMOVE_GAME_INTERVAL = 1000 * 60 * 60; // 1 hour

interface OnConnectionParam {
    wss: WebSocketServer;
    ws: WebSocket;
    request: IncomingMessage;
}

let wss: WebSocketServer;

function onConnection({ wss, ws, request }: OnConnectionParam) {
    const queryParams = request.url ? parse(request.url, true).query : null;
    const { gameId, playerId } = queryParams || {};
    ws.gameId = (gameId as string) || null;

    ws.isAlive = true;
    if (!ws.socketId) {
        ws.socketId = uuidv4();
    }

    const idMsg = getWebSocketLogId(ws);
    log(`Opening web socket connection: ${idMsg}`);

    ws.on('pong', () => (ws.isAlive = true));
    ws.on('message', (message: string) => handleMessage({ wss, ws, message }));
    ws.on('close', () => log(`Closing web socket connection: ${idMsg}`));

    // Maybe use as API token?
    // const data: PartialData = { socketId: ws.socketId };
    const data: PartialData = {};

    if (ws.gameId) {
        data.game = getGameForClient(ws.gameId);
    }

    const pid = playerId as string;
    if (playerId && data.game?.players.includes(pid)) {
        data.game?.players.includes(pid);
        ws.playerId = pid;
    }

    // Send initial packet
    sendData({ ws, type: MessageType.BROADCAST_INITIALIZE, data });
}

export default function initialize(app: Application) {
    if (wss) {
        return wss;
    }

    // Create server for websocket connections
    const server = key && cert ? https.createServer({ key, cert }, app) : http.createServer(app);

    wss = new WSServer({ server });
    wss.on('connection', (ws: WebSocket, request: IncomingMessage) => onConnection({ wss, ws, request }));

    // Keep connections alive
    setInterval(() => {
        if (!wss) {
            return;
        }

        wss.clients.forEach((websocket: WebSocketType) => {
            const ws: WebSocket = websocket as WebSocket;
            if (!ws.isAlive) {
                const idMsg = getWebSocketLogId(ws);
                log(`Terminating websocket for ${idMsg}`);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping(null, false);
        });
    }, KEEP_ALIVE_INTERVAL);

    // Interval to remove games that haven't had activity in a while.
    setInterval(removeOldGames, REMOVE_GAME_INTERVAL);

    // Broadcast changes on an interval
    setInterval(() => {
        if (!isDirty()) {
            // Nothing changed, don't broadcast.
            return;
        }

        const dirtyGames = getDirtyGameData();
        setDirty(false);

        if (dirtyGames) {
            broadcastChangeData({ wss, dirtyGames });
        }
    }, BROADCAST_INTERVAL);

    server.listen(WSS_PORT, () => {
        console.log(`WebSocket server started on port: ${WSS_PORT}`);
    });

    return wss;
}
