import { CommandRejected } from './database/GameStore.js';
import { createHash } from 'node:crypto';
import { commandResultSchema, CommandResult } from 'common/commandResult.js';
import { peerAddress, RateLimit } from './trafficLimits.js';
import { IncomingMessage, type Server as HttpServer } from 'http';
import { Duplex } from 'node:stream';
import { type Server as HttpsServer } from 'https';
import { WebSocketServer as WSServer, WebSocket as WebSocketType } from 'ws';

import { Session } from 'common/session.js';
import { GameConnections } from 'common/gameConnections.js';
import { MessageType } from 'common/message.js';
import uuidv4 from 'common/uuidv4.js';

import { getGame, getGameForClient, getGameVersion, commitGameCommand } from './database/game.js';

import { WebSocket, WebSocketServer, broadcastChangeData, getWebSocketLogId, sendData } from './WebSocket.js';
import { dirty, getDirtyGameData, isDirty, setDirty } from './dirty.js';
import handleMessage from './handleMessage.js';
import parseClientMessage from './parseClientMessage.js';
import { connectionQuerySchema } from './commandSchemas.js';
import validateCommandState from './validateCommandState.js';
import log from './log.js';
import { AccessSessions, authorizeCommand, mayReadGame, visibleGame, visibleChange } from './accessSessions.js';
import { VerifyNetworkRequest } from './networkPolicy.js';

const KEEP_ALIVE_INTERVAL = 10000; // ms
const BROADCAST_INTERVAL = 300; // ms

interface OnConnectionParam {
    wss: WebSocketServer;
    ws: WebSocket;
    request: IncomingMessage;
    sessions: AccessSessions;
    commands: RateLimit;
}

function snapshot(ws: WebSocket, session: Session): void {
    const game = ws.gameId ? getGameForClient(ws.gameId) : null;
    const identity = session.role === 'player' ? session.playerId : session.role === 'host' ? ws.playerId : null;
    ws.playerId = identity && game?.players.includes(identity) ? identity : null;
    sendData({
        ws,
        type: MessageType.BROADCAST_INITIALIZE,
        data: {
            loadedGameId: ws.gameId || null,
            game: game ? visibleGame(game, session) : null,
            playerId: ws.playerId,
            gameVersion: game ? getGameVersion(game.id) : null,
        },
    });
}
function result(ws: WebSocket, data: CommandResult): void {
    sendData({ ws, type: MessageType.COMMAND_RESULT, data: commandResultSchema.parse(data) });
}

function onConnection({ wss, ws, request, sessions, commands }: OnConnectionParam) {
    ws.on('error', () => log('Web socket connection error'));
    let query: URLSearchParams;
    try {
        query = new URL(request.url || '/', 'http://localhost').searchParams;
    } catch {
        ws.close(1008, 'Invalid connection URL');
        return;
    }
    const parameters = [...query.entries()];
    const parsed = connectionQuerySchema.safeParse(Object.fromEntries(parameters));
    if (!parsed.success || new Set(parameters.map(([key]) => key)).size !== parameters.length) {
        ws.close(1008, 'Invalid connection query');
        return;
    }
    const { gameId, playerId } = parsed.data;
    ws.accessToken = sessions.token(request);
    const session = sessions.resolve(ws.accessToken);
    if (gameId && !mayReadGame(session, gameId)) {
        ws.close(1008, 'This device cannot access that game');
        return;
    }
    ws.gameId = session.role === 'player' || session.role === 'spectator' ? session.gameId : gameId || null;
    if (playerId && session.role !== 'host' && (session.role !== 'player' || playerId !== session.playerId)) {
        ws.close(1008, 'Cannot select another player');
        return;
    }

    ws.isAlive = true;
    if (!ws.socketId) {
        ws.socketId = uuidv4();
    }

    const idMsg = getWebSocketLogId(ws);
    log(`Opening web socket connection: ${idMsg}`);

    ws.on('pong', () => (ws.isAlive = true));
    const peer = peerAddress(request);
    ws.on('message', (raw, isBinary) => {
        if (ws.readyState !== WebSocketType.OPEN) return;
        if (commands.consume(peer)) {
            ws.close(1008, 'Too many commands. Wait a moment before reconnecting.');
            return;
        }
        if (isBinary) {
            ws.close(1003, 'Text commands required');
            return;
        }
        const parsedMessage = parseClientMessage(raw.toString());
        if (parsedMessage.kind === 'invalid') {
            ws.close(parsedMessage.code, parsedMessage.reason);
            return;
        }
        const command = parsedMessage.message;
        const id = command.data.gameId;
        const previousDirty = structuredClone(dirty.games[id]);
        const previousBinding = { gameId: ws.gameId, playerId: ws.playerId };
        const restore = () => {
            if (previousDirty) dirty.games[id] = previousDirty;
            else delete dirty.games[id];
            Object.assign(ws, previousBinding);
        };
        let committed = false;
        try {
            const access = sessions.resolve(ws.accessToken || null);
            if (access.role === 'unpaired') {
                ws.close(1008, 'Pair this device with the host first');
                return;
            }
            if (!mayReadGame(access, id)) {
                ws.close(1008, 'This device cannot access that game');
                return;
            }
            const game = getGame(id);
            if (command.type === MessageType.GAME_LOAD) {
                if (
                    command.data.playerId &&
                    access.role !== 'host' &&
                    (access.role !== 'player' || access.playerId !== command.data.playerId)
                ) {
                    ws.close(1008, 'Cannot select another player');
                    return;
                }
                ws.gameId = id;
                ws.playerId =
                    access.role === 'player'
                        ? access.playerId
                        : access.role === 'host'
                          ? command.data.playerId || null
                          : null;
                snapshot(ws, access);
                return;
            }
            if (!game) {
                if (ws.gameId === id) snapshot(ws, access);
                result(ws, { id: command.id, gameId: id, status: 'missing', version: null, message: 'Game not found' });
                return;
            }
            if (command.data.commands.length > 1 && commands.consume(peer, command.data.commands.length - 1)) {
                ws.close(1008, 'Too many commands. Wait a moment before reconnecting.');
                return;
            }
            const digest = (value: string) => createHash('sha256').update(value).digest('hex');
            let outcome: ReturnType<typeof commitGameCommand>;
            try {
                outcome = commitGameCommand(
                    id,
                    {
                        id: command.id,
                        version: command.baseVersion,
                        principal: digest(access.role === 'host' ? 'tight:host-administrator' : ws.accessToken || ''),
                        payloadHash: digest(JSON.stringify(command)),
                    },
                    () => {
                        for (const message of command.data.commands) {
                            const error =
                                authorizeCommand(access, message, game) || validateCommandState(message, game);
                            if (error) throw new CommandRejected(error);
                            handleMessage({ wss, ws, message });
                        }
                    },
                );
            } catch (error) {
                if (!(error instanceof CommandRejected)) throw error;
                restore();
                if (ws.gameId === id) snapshot(ws, access);
                result(ws, {
                    id: command.id,
                    gameId: id,
                    status: 'rejected',
                    version: getGameVersion(id),
                    message: error.message,
                });
                return;
            }
            committed = outcome.status === 'saved';
            if (!committed) restore();
            if (ws.gameId === id) snapshot(ws, access);
            const message =
                outcome.status === 'stale'
                    ? 'The game changed. Review the latest state and try again.'
                    : outcome.status === 'conflict'
                      ? 'This command ID was already used for a different change.'
                      : undefined;
            result(ws, {
                id: command.id,
                gameId: id,
                status: outcome.status,
                version: outcome.status === 'missing' ? null : outcome.version,
                ...(message ? { message } : {}),
            });
        } catch (error) {
            if (!committed) restore();
            console.error('Could not confirm game command', error);
            if (command.type !== MessageType.GAME_LOAD)
                result(ws, {
                    id: command.id,
                    gameId: id,
                    status: 'unconfirmed',
                    version: null,
                    message: 'The host could not confirm this change. Check host storage before retrying.',
                });
            ws.close(1011, 'Could not confirm game state');
        }
    });
    ws.on('close', () => log(`Closing web socket connection: ${idMsg}`));

    ws.playerId = session.role === 'player' ? session.playerId : session.role === 'host' ? playerId || null : null;
    snapshot(ws, session);
}

export default function initialize(
    server: HttpServer | HttpsServer,
    verifyRequest: VerifyNetworkRequest,
    sessions: AccessSessions,
) {
    const commands = new RateLimit(60, 10, 256);
    const handshakes = new RateLimit(40, 2, 256);
    const addresses = new WeakMap<WebSocketType, string>();
    const wss = new WSServer({
        noServer: true,
        maxPayload: 64 * 1024,
        verifyClient: (info, done) => {
            const rejection = verifyRequest(info.req);
            if (rejection) done(false, rejection.status, rejection.message);
            else {
                const peer = peerAddress(info.req);
                const wait = handshakes.consume(peer);
                if (wait) {
                    done(false, 429, 'Too many connection attempts', { 'Retry-After': String(wait) });
                    return;
                }
                let peerConnections = 0;
                for (const client of wss.clients) if (addresses.get(client) === peer) peerConnections += 1;
                if (wss.clients.size >= 64 || peerConnections >= 16) {
                    done(false, 503, 'Too many open connections', { 'Retry-After': '5' });
                    return;
                }
                try {
                    if (sessions.resolve(sessions.token(info.req)).role === 'unpaired')
                        done(false, 401, 'Pair this device with the host first');
                    else done(true);
                } catch (error) {
                    console.error('Could not verify device access', error);
                    done(false, 503, 'Could not verify device access');
                }
            }
        },
    });
    const owners = new WeakMap<WebSocketType, HttpServer | HttpsServer>();
    const attachments = new Map<
        HttpServer | HttpsServer,
        (request: IncomingMessage, socket: Duplex, head: Buffer) => void
    >();
    const attach = (listener: HttpServer | HttpsServer) => {
        if (attachments.has(listener)) return;
        const upgrade = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
            wss.handleUpgrade(request, socket, head, ws => {
                owners.set(ws, listener);
                addresses.set(ws, peerAddress(request));
                wss.emit('connection', ws, request);
            });
        };
        attachments.set(listener, upgrade);
        listener.on('upgrade', upgrade);
    };
    const detach = (listener: HttpServer | HttpsServer) => {
        const upgrade = attachments.get(listener);
        if (upgrade) listener.off('upgrade', upgrade);
        attachments.delete(listener);
        for (const ws of wss.clients) if (owners.get(ws) === listener) ws.terminate();
    };
    attach(server);
    wss.on('error', () => log('WebSocket server error'));
    wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
        try {
            onConnection({ wss, ws, request, sessions, commands });
        } catch (error) {
            console.error('Could not initialize device connection', error);
            ws.close(1011, 'Could not initialize connection');
        }
    });

    // Keep connections alive
    const heartbeat = setInterval(() => {
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

    // Broadcast changes on an interval
    const broadcasts = setInterval(() => {
        const authorized = new Map<WebSocket, Session>();
        wss.clients.forEach(socket => {
            const ws = socket as WebSocket;
            let access;
            try {
                access = sessions.resolve(ws.accessToken || null);
            } catch (error) {
                console.error('Could not verify device access', error);
                ws.gameId = null;
                ws.close(1011, 'Could not verify device access');
                return;
            }
            if (access.role === 'unpaired' || (ws.gameId && !mayReadGame(access, ws.gameId))) {
                ws.gameId = null;
                ws.close(1008, 'Device access changed. Pair again with the host.');
                return;
            }
            authorized.set(ws, access);
        });
        if (!isDirty()) {
            // Nothing changed, don't broadcast.
            return;
        }

        const dirtyGames = getDirtyGameData();
        setDirty(false);

        if (dirtyGames) {
            broadcastChangeData({
                wss,
                dirtyGames,
                serialize: (ws, change) => {
                    const access = authorized.get(ws);
                    return access ? visibleChange(change, access) : null;
                },
            });
        }
    }, BROADCAST_INTERVAL);

    let stopped: Promise<void> | undefined;
    return {
        attach,
        detach,
        getGameConnections: (gameId: string): GameConnections => {
            const devices = new Set<string>();
            const players = new Map<string, GameConnections['players'][number]>();
            let spectators = 0;
            for (const socket of wss.clients) {
                const ws = socket as WebSocket;
                if (ws.readyState !== WebSocketType.OPEN || ws.gameId !== gameId || !ws.accessToken) continue;
                if (devices.has(ws.accessToken)) continue;
                const access = sessions.resolve(ws.accessToken);
                if ((access.role !== 'player' && access.role !== 'spectator') || access.gameId !== gameId) continue;
                devices.add(ws.accessToken);
                if (access.role === 'player') {
                    players.set(access.playerId, { playerId: access.playerId, tableEditing: access.tableEditing === true });
                } else spectators += 1;
            }
            return { players: [...players.values()].sort((a, b) => a.playerId.localeCompare(b.playerId)), spectators };
        },
        getConnections: () => {
            const players = new Set<string>();
            let connections = 0;
            for (const client of wss.clients) {
                if (client.readyState !== WebSocketType.OPEN) continue;
                connections += 1;
                const access = sessions.resolve((client as WebSocket).accessToken || null);
                if (access.role === 'player') players.add(JSON.stringify([access.gameId, access.playerId]));
            }
            return { connections, connectedPlayers: players.size };
        },
        stop: () =>
            (stopped ??= new Promise<void>(resolve => {
                clearInterval(heartbeat);
                clearInterval(broadcasts);
                for (const listener of attachments.keys()) detach(listener);
                wss.clients.forEach(client => client.terminate());
                wss.close(() => resolve());
            })),
    };
}
