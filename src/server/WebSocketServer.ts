import express from 'express';
import http from 'http';
import ws from 'ws';

import { ChangeData, MessageType, AllData } from 'common/message';

import * as FactionDB from './database/faction';
import * as GameDB from './database/game';
import * as AccountDB from './database/account';
import * as PlanetDB from './database/planet';
import * as StrategyDB from './database/strategy';

import { dirty, isDirty, setDirty, getDirtyGameData } from './dirty';
import handleMessage from './handleMessage';
import { WebSocket, WebSocketServer, sendData, broadcastChangeData } from './WebSocket';

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
        accounts: AccountDB.listAccounts(),
        planets: PlanetDB.listPlanets(),
        strategyCards: StrategyDB.listCards(),
        factionNames: FactionDB.listFactionNames(),
    };

    sendData({ ws, type: MessageType.STATE_ALL, data: allData });
}

export default function initialize(app: express.Application) {
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
                console.log('Terminating websocket');
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping(null, false);
        });
    }, 10000);

    // Broadcast game state on an interval
    setInterval(() => {
        if (!isDirty()) {
            return;
        }

        const data: ChangeData = {};
        if (dirty.planets) {
            data.planets = PlanetDB.listPlanets();
        }

        if (dirty.accounts) {
            data.accounts = AccountDB.listAccounts();
        }

        const dirtyGames = getDirtyGameData();
        if (dirtyGames) {
            data.games = dirtyGames;
        }

        setDirty(false);

        broadcastChangeData({ wss, type: MessageType.STATE_CHANGE, data });
    }, 1000);

    server.listen(8080, () => {
        console.log(`WebSocket server started on port: 8080`);
    });

    return wss;
}
