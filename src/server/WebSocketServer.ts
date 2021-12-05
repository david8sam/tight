import { Application } from 'express';
import http from 'http';
import ws from 'ws';

import { AccountMap } from 'common/Account';
import { ChangeData, MessageType, AllData } from 'common/message';

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

const WSS_PORT = 8080;

interface OnConnectionParam {
    wss: WebSocketServer;
    ws: WebSocket;
}

let wss: WebSocketServer;

function onConnection({ wss, ws }: OnConnectionParam) {
    ws.isAlive = true;

    ws.on('pong', () => (ws.isAlive = true));
    ws.on('message', (message: string) => handleMessage({ wss, ws, message }));

    // TODO: Design a better way to initialize without sending everything.
    // Send initial packet to client
    const allData: AllData = {
        games: GameDB.listGames(),
        account: ws.accountId ? AccountDB.getAccount(ws.accountId) : null,
        accountsInfo: AccountDB.listAccountsInfo(),
        planets: PlanetDB.listPlanets(),
        strategyCards: StrategyDB.listCards(),
        factionNames: FactionDB.listFactionNames(),
    };

    sendData({ ws, type: MessageType.BROADCAST_INITIALIZE, data: allData });
}

export default function initialize(app: Application) {
    if (wss) {
        return wss;
    }

    // Create server for websocket connections
    const server: http.Server = http.createServer(app);

    wss = new ws.Server({ server });
    wss.on('connection', (ws: WebSocket) => onConnection({ wss, ws }));

    // Keep connections alive
    setInterval(() => {
        if (!wss) {
            return;
        }

        wss.clients.forEach((websocket: ws) => {
            const ws: WebSocket = websocket as WebSocket;
            if (!ws.isAlive) {
                log(`Terminating websocket (${ws.accountId})`);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping(null, false);
        });
    }, KEEP_ALIVE_INTERVAL);

    // Broadcast game state on an interval
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
