import { Dispatch, useCallback, useEffect, useRef } from 'react';
import { sessionHints } from '../utils/sessionHints';
import { z } from 'zod';
import { MessageType } from 'common/message';
import { commandResultSchema } from 'common/commandResult';
import { GameVersion, gameVersionSchema } from 'common/gameVersion';
import { GAME_CODE_PATTERN } from 'common/gameCode';
import uuidv4 from 'common/uuidv4';
import { Action, ActionType, CommandNotice, State } from '../reducer';

const RETRY_LIMIT = 5;
const RETRY_INTERVAL = 3000;
const OPEN_TIMEOUT = 10000;
const ACK_TIMEOUT = 10000;
const SNAPSHOT_TIMEOUT = 10000;
const COMMAND_ATTEMPTS = 3;
const MAX_PENDING = 32;
const gameIdSchema = z.string().regex(GAME_CODE_PATTERN);
const gameLoadSchema = z.object({ gameId: gameIdSchema, playerId: z.string().nullable().optional() }).passthrough();
const envelopeSchema = z.object({ type: z.nativeEnum(MessageType), data: z.unknown() }).strict();
const snapshotSchema = z
    .object({
        game: z
            .object({ id: gameIdSchema, created: z.unknown().optional(), deleted: z.boolean().optional() })
            .passthrough()
            .nullable(),
        gameVersion: gameVersionSchema.nullable(),
        playerId: z.string().nullable().optional(),
    })
    .passthrough();
const initialSnapshotSchema = snapshotSchema.extend({ loadedGameId: gameIdSchema.nullable() });
interface PendingCommand {
    id: string;
    gameId: string;
    encoded: string;
    attempts: number;
    uncertain: boolean;
    timer?: ReturnType<typeof setTimeout>;
}
interface StagedBatch {
    entry: PendingCommand;
    baseVersion: GameVersion;
    commands: { type: MessageType; data: unknown }[];
}
export interface SendDataFunction {
    ({ type, data }: { type: MessageType; data?: unknown }): boolean;
}
export interface WebSocketOptions {
    url: string;
    dispatch: Dispatch<Action>;
    state: State;
}

export default function useWebSocket(options: WebSocketOptions) {
    const optionsRef = useRef(options);
    optionsRef.current = options;
    const wsRef = useRef<WebSocket | null>(null);
    const pending = useRef(new Map<string, PendingCommand>());
    const staged = useRef<StagedBatch | null>(null);
    const attempts = useRef(0);
    const active = useRef(false);
    const retryTimer = useRef<ReturnType<typeof setTimeout>>();
    const openTimer = useRef<ReturnType<typeof setTimeout>>();
    const snapshotWait = useRef<{
        socket: WebSocket;
        gameId: string | null;
        timer: ReturnType<typeof setTimeout>;
    } | null>(null);
    const recoverCurrent = useRef<(() => void) | null>(null);
    const manualRecovery = useRef(false);
    const clearTimers = useCallback(() => {
        clearTimeout(retryTimer.current);
        clearTimeout(openTimer.current);
        if (snapshotWait.current) clearTimeout(snapshotWait.current.timer);
        snapshotWait.current = null;
    }, []);
    const waitForSnapshot = useCallback((socket: WebSocket, gameId: string | null) => {
        if (snapshotWait.current?.socket === socket && snapshotWait.current.gameId === gameId) return;
        if (snapshotWait.current) clearTimeout(snapshotWait.current.timer);
        optionsRef.current.dispatch({
            type: ActionType.setConnecting,
            payload: { connecting: true, connectError: false },
        });
        snapshotWait.current = {
            socket,
            gameId,
            timer: setTimeout(() => {
                if (snapshotWait.current?.socket === socket) recoverCurrent.current?.();
            }, SNAPSHOT_TIMEOUT),
        };
    }, []);
    const requestSnapshot = useCallback((socket: WebSocket, data: z.infer<typeof gameLoadSchema>): boolean => {
        waitForSnapshot(socket, data.gameId);
        try {
            socket.send(JSON.stringify({ type: MessageType.GAME_LOAD, data }));
            return true;
        } catch {
            recoverCurrent.current?.();
            return false;
        }
    }, [waitForSnapshot]);
    const failed = useCallback(() => {
        optionsRef.current.dispatch({
            type: ActionType.setConnecting,
            payload: { connecting: false, connectError: true },
        });
    }, []);
    const publish = useCallback((notice?: CommandNotice | null) => {
        const entries = [...pending.current.values()];
        const currentNotice = notice === undefined ? optionsRef.current.state.commandNotice : notice;
        optionsRef.current.dispatch({
            type: ActionType.setCommandStatus,
            payload: {
                pendingCommands: entries.length,
                saveStatus: entries.length
                    ? entries.some(entry => entry.uncertain)
                        ? 'unconfirmed'
                        : 'pending'
                    : currentNotice?.kind === 'failed'
                      ? 'failed'
                      : 'saved',
                ...(notice !== undefined ? { commandNotice: notice } : {}),
            },
        });
    }, []);
    const unconfirmed = useCallback(
        (message: string) => {
            if (!pending.current.size) return;
            for (const entry of pending.current.values()) {
                clearTimeout(entry.timer);
                entry.uncertain = true;
            }
            publish({ kind: 'unconfirmed', message });
        },
        [publish],
    );
    const deliver = useCallback(
        function deliverEntry(entry: PendingCommand): boolean {
            clearTimeout(entry.timer);
            const ws = wsRef.current;
            if (!active.current || !pending.current.has(entry.id)) return false;
            if (!ws || ws.readyState !== WebSocket.OPEN || entry.attempts >= COMMAND_ATTEMPTS) {
                entry.uncertain = true;
                publish({
                    kind: 'unconfirmed',
                    message: 'Could not confirm your last change. Check it before making it again.',
                });
                return false;
            }
            entry.attempts += 1;
            entry.uncertain = false;
            publish();
            try {
                ws.send(entry.encoded);
            } catch {
                entry.uncertain = true;
                publish({ kind: 'unconfirmed', message: 'The connection closed before your change was confirmed.' });
                recoverCurrent.current?.();
                return false;
            }
            entry.timer = setTimeout(() => {
                if (!active.current || !pending.current.has(entry.id)) return;
                entry.uncertain = true;
                deliverEntry(entry);
            }, ACK_TIMEOUT);
            return true;
        },
        [publish],
    );

    const flush = useCallback(() => {
        const batch = staged.current;
        staged.current = null;
        if (batch && pending.current.has(batch.entry.id)) deliver(batch.entry);
    }, [deliver]);

    const connect = useCallback(() => {
        if (!active.current || document.visibilityState !== 'visible' || manualRecovery.current) return;
        const current = wsRef.current;
        if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) return;
        clearTimers();
        if (attempts.current >= RETRY_LIMIT) {
            failed();
            return;
        }
        attempts.current += 1;
        const { state, dispatch, url } = optionsRef.current;
        dispatch({ type: ActionType.setConnecting, payload: { connecting: true, connectError: false } });
        const endpoint = new URL(url);
        // Navigation records its target before a load request can fail; state may still hold the previous game.
        const gameId = sessionHints.getItem('gameId') || state.game?.id;
        const playerId = state.playerId || sessionHints.getItem('playerId');
        if (gameId) endpoint.searchParams.set('gameId', gameId);
        if (playerId) endpoint.searchParams.set('playerId', playerId);
        const ws = new WebSocket(endpoint.href);
        wsRef.current = ws;
        const isCurrent = () => active.current && wsRef.current === ws;
        openTimer.current = setTimeout(() => {
            if (isCurrent() && ws.readyState !== WebSocket.OPEN) ws.close();
        }, OPEN_TIMEOUT);
        ws.onopen = () => {
            if (!isCurrent()) return;
            clearTimers();
            waitForSnapshot(ws, gameId || null);
        };
        ws.onmessage = event => {
            if (!isCurrent()) return;
            try {
                const raw: unknown = JSON.parse(event.data);
                const { type, data } = envelopeSchema.parse(raw);
                if (type === MessageType.COMMAND_RESULT) {
                    const reply = commandResultSchema.parse(data);
                    const entry = pending.current.get(reply.id);
                    if (!entry) return;
                    if (entry.gameId !== reply.gameId) throw new Error('Unexpected command reply');
                    clearTimeout(entry.timer);
                    if (reply.status === 'unconfirmed') {
                        entry.uncertain = true;
                        publish({
                            kind: 'unconfirmed',
                            message: reply.message || 'The host could not confirm your last change.',
                        });
                        return;
                    }
                    pending.current.delete(reply.id);
                    if (reply.status === 'saved' || reply.status === 'duplicate') {
                        const notice = optionsRef.current.state.commandNotice;
                        publish(notice?.kind === 'unconfirmed' && !pending.current.size ? null : undefined);
                    } else
                        publish({
                            kind: 'failed',
                            message: `Game ${reply.gameId}: ${reply.message || 'Your change was not applied. Review the current game and try again.'}`,
                        });
                } else if (type === MessageType.BROADCAST_INITIALIZE || type === MessageType.BROADCAST_CHANGE) {
                    const snapshot =
                        type === MessageType.BROADCAST_INITIALIZE
                            ? initialSnapshotSchema.parse(data)
                            : snapshotSchema.parse(data);
                    // Ignore the previous subscription while a newer game is loading.
                    if (
                        snapshotWait.current?.socket === ws &&
                        snapshotWait.current.gameId !== null &&
                        ('loadedGameId' in snapshot ? snapshot.loadedGameId : snapshot.game?.id) !==
                            snapshotWait.current.gameId
                    )
                        return;
                    if (type === MessageType.BROADCAST_INITIALIZE && snapshotWait.current?.socket === ws) {
                        clearTimeout(snapshotWait.current.timer);
                        snapshotWait.current = null;
                        attempts.current = 0;
                        optionsRef.current.dispatch({
                            type: ActionType.setConnecting,
                            payload: { connecting: false, connectError: false },
                        });
                        for (const entry of pending.current.values())
                            if (entry.uncertain && entry.attempts < COMMAND_ATTEMPTS) deliver(entry);
                    }
                    const previous = optionsRef.current.state;
                    if (
                        snapshot.game &&
                        previous.game?.id === snapshot.game.id &&
                        previous.gameVersion &&
                        snapshot.gameVersion
                    ) {
                        if (
                            previous.gameVersion.incarnation === snapshot.gameVersion.incarnation &&
                            snapshot.gameVersion.revision < previous.gameVersion.revision
                        )
                            return;
                        if (
                            type === MessageType.BROADCAST_CHANGE &&
                            previous.gameVersion.incarnation !== snapshot.gameVersion.incarnation &&
                            !snapshot.game.created &&
                            !snapshot.game.deleted
                        ) {
                            requestSnapshot(ws, { gameId: snapshot.game.id, playerId: previous.playerId });
                            return;
                        }
                    }
                    optionsRef.current.dispatch({
                        type: type === MessageType.BROADCAST_INITIALIZE ? ActionType.setState : ActionType.updateState,
                        payload: snapshot,
                    });
                } else throw new Error('Unsupported host message');
            } catch {
                unconfirmed('The host sent an unsupported reply. Reload the page to update or pair this device again.');
                optionsRef.current.dispatch({
                    type: ActionType.setCommandStatus,
                    payload: {
                        saveStatus: 'failed',
                        commandNotice: {
                            kind: 'failed',
                            message: 'The host sent an unsupported reply. Reload this page.',
                        },
                    },
                });
                failed();
                ws.close(1008, 'Unsupported host reply');
            }
        };
        const disconnected = (code: number) => {
            if (!isCurrent()) return;
            clearTimers();
            wsRef.current = null;
            recoverCurrent.current = null;
            unconfirmed('The connection closed before your last change was confirmed. Reconnect to check it.');
            if (code === 1008 || code === 1011) manualRecovery.current = true;
            if (manualRecovery.current || attempts.current >= RETRY_LIMIT) {
                failed();
                return;
            }
            if (document.visibilityState === 'visible') {
                const delay = RETRY_INTERVAL * 2 ** Math.max(0, attempts.current - 1);
                retryTimer.current = setTimeout(connect, delay);
            }
        };
        ws.onclose = event => disconnected(event.code);
        recoverCurrent.current = () => {
            if (!isCurrent()) return;
            // Retire before closing: a dead network need not finish its close handshake.
            disconnected(1006);
            ws.close();
        };
        // The close handler owns retrying failures, including rejected handshakes.
        ws.onerror = () => {};
    }, [clearTimers, failed, deliver, publish, unconfirmed, waitForSnapshot, requestSnapshot]);

    useEffect(() => {
        active.current = true;
        connect();
        const visible = () => {
            if (document.visibilityState !== 'visible') return;
            const ws = wsRef.current;
            if (ws?.readyState === WebSocket.OPEN) {
                const { state } = optionsRef.current;
                if (state.game) {
                    if (snapshotWait.current?.socket === ws) return;
                    if (!requestSnapshot(ws, { gameId: state.game.id, playerId: state.playerId })) return;
                }
                for (const entry of pending.current.values())
                    if (entry.uncertain && entry.attempts < COMMAND_ATTEMPTS) deliver(entry);
            } else connect();
        };
        document.addEventListener('visibilitychange', visible);
        return () => {
            active.current = false;
            clearTimers();
            for (const entry of pending.current.values()) clearTimeout(entry.timer);
            pending.current.clear();
            staged.current = null;
            const ws = wsRef.current;
            wsRef.current = null;
            recoverCurrent.current = null;
            ws?.close();
            document.removeEventListener('visibilitychange', visible);
        };
    }, [connect, clearTimers, deliver, requestSnapshot]);

    useEffect(() => {
        if (!options.state.reconnect) return;
        attempts.current = 0;
        manualRecovery.current = false;
        options.dispatch({ type: ActionType.setConnecting, payload: { reconnect: false } });
        for (const entry of pending.current.values()) entry.attempts = 0;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            for (const entry of pending.current.values()) deliver(entry);
        } else connect();
    }, [options.state.reconnect, connect, deliver]);

    const sendData: SendDataFunction = useCallback(
        ({ type, data }) => {
            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                failed();
                return false;
            }
            if (type === MessageType.GAME_LOAD) return requestSnapshot(ws, gameLoadSchema.parse(data));
            const target = z.object({ gameId: gameIdSchema }).passthrough().safeParse(data);
            const { state } = optionsRef.current;
            if (
                !target.success ||
                !state.gameVersion ||
                state.game?.id !== target.data.gameId ||
                (pending.current.size >= MAX_PENDING && !staged.current)
            ) {
                publish({
                    kind: 'failed',
                    message: 'Wait for the current game and outstanding changes to load, then try again.',
                });
                return false;
            }
            let batch = staged.current;
            if (
                batch &&
                (batch.entry.gameId !== target.data.gameId ||
                    batch.baseVersion.incarnation !== state.gameVersion.incarnation ||
                    batch.baseVersion.revision !== state.gameVersion.revision)
            ) {
                flush();
                batch = null;
            }
            if (!batch) {
                const entry: PendingCommand = {
                    id: uuidv4(),
                    gameId: target.data.gameId,
                    encoded: '',
                    attempts: 0,
                    uncertain: false,
                };
                batch = { entry, baseVersion: state.gameVersion, commands: [] };
                staged.current = batch;
                pending.current.set(entry.id, entry);
            }
            try {
                batch.commands.push({ type, data: structuredClone(data) });
                batch.entry.encoded = JSON.stringify({
                    type: MessageType.COMMAND_BATCH,
                    id: batch.entry.id,
                    baseVersion: batch.baseVersion,
                    data: { gameId: batch.entry.gameId, commands: batch.commands },
                });
                if (batch.commands.length > 32 || new TextEncoder().encode(batch.entry.encoded).length > 64 * 1024)
                    throw new Error('Change is too large');
            } catch {
                pending.current.delete(batch.entry.id);
                staged.current = null;
                publish({
                    kind: 'failed',
                    message: 'This change is too large or cannot be sent. Shorten it and try again.',
                });
                return false;
            }
            const queued = batch;
            queueMicrotask(() => {
                if (staged.current === queued) flush();
            });
            return true;
        },
        [failed, flush, publish, requestSnapshot],
    );
    return { sendData };
}
