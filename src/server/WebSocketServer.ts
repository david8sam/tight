import { Application } from 'express';
import http, { IncomingMessage } from 'http';
import { parse } from 'url';
import ws from 'ws';

import { AccountMap } from 'common/Account';
import { WSS_PORT } from 'common/constants';
import { AllData, ChangeData, MessageType, PartialData } from 'common/message';

import * as FactionDB from './database/faction';
import * as GameDB from './database/game';
import * as AccountDB from './database/account';
import * as PlanetDB from './database/planet';
import * as StrategyDB from './database/strategy';

import { dirty, isDirty, setDirty, getDirtyGameData } from './dirty';
import handleMessage from './handleMessage';
import log from './log';
import { WebSocket, WebSocketServer, sendData, broadcastChangeData } from './WebSocket';

const KEEP_ALIVE_INTERVAL = 10000; // ms
const BROADCAST_INTERVAL = 300; // ms

interface OnConnectionParam {
    wss: WebSocketServer;
    ws: WebSocket;
    request: IncomingMessage;
}

let wss: WebSocketServer;

function onConnection({ wss, ws, request }: OnConnectionParam) {
    const reconnectId = request.url ? (parse(request.url, true).query?.reconnect as string) : null;
    if (reconnectId && reconnectId !== 'anonymous') {
        ws.accountId = reconnectId;
    }

    const wsKey = request.headers['sec-websocket-key'];
    const idMsg = ws.accountId ? `${wsKey} (${ws.accountId})` : wsKey;
    log(`Opening web socket connection: ${idMsg}`);

    ws.isAlive = true;

    ws.on('pong', () => (ws.isAlive = true));
    ws.on('message', (message: string) => handleMessage({ wss, ws, message }));
    ws.on('close', () => log(`Closing web socket connection: ${idMsg}`));

    // TODO: Design a better way to initialize without sending everything.
    // Send initial packet to client
    if (reconnectId) {
        const data: PartialData = {
            games: GameDB.listGames(),
            accountsInfo: AccountDB.listAccountsInfo(),
        };

        sendData({ ws, type: MessageType.BROADCAST_RECONNECT, data });
    } else {
        const data: AllData = {
            // Dynamic data
            games: GameDB.listGames(),
            accountsInfo: AccountDB.listAccountsInfo(),

            // Static data
            planets: PlanetDB.listPlanets(),
            strategyCards: StrategyDB.listCards(),
            factionNames: FactionDB.listFactionNames(),
        };

        sendData({ ws, type: MessageType.BROADCAST_INITIALIZE, data });
    }
}

export default function initialize(app: Application) {
    if (wss) {
        return wss;
    }

    // Create server for websocket connections
    const server: http.Server = http.createServer(app);

    wss = new ws.Server({ server });
    wss.on('connection', (ws: WebSocket, request: IncomingMessage) => onConnection({ wss, ws, request }));

    // Keep connections alive
    setInterval(() => {
        if (!wss) {
            return;
        }

        wss.clients.forEach((websocket: ws) => {
            const ws: WebSocket = websocket as WebSocket;
            if (!ws.isAlive) {
                const idMsg = ws.accountId ? `for ${ws.accountId}` : '';
                log(`Terminating websocket${idMsg}`);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping(null, false);
        });
    }, KEEP_ALIVE_INTERVAL);

    // Broadcast changes on an interval
    setInterval(() => {
        if (!isDirty()) {
            // Nothing changed, don't broadcast.
            return;
        }

        const data: ChangeData = {};

        let updatedAccounts: AccountMap | null = null;
        if (dirty.accounts.length) {
            updatedAccounts = {};
            dirty.accounts.forEach(a => {
                const account = AccountDB.getAccount(a);
                if (account && updatedAccounts) {
                    updatedAccounts[account.id] = account;
                }
            });
        }

        if (dirty.accountsInfo) {
            data.accountsInfo = AccountDB.listAccountsInfo();
        }

        const dirtyGames = getDirtyGameData();
        if (dirtyGames) {
            data.games = dirtyGames;
        }

        // TODO: Save changes to disk

        setDirty(false);
        broadcastChangeData({ wss, updatedAccounts, data });
    }, BROADCAST_INTERVAL);

    server.listen(WSS_PORT, () => {
        console.log(`WebSocket server started on port: ${WSS_PORT}`);
    });

    return wss;
}
