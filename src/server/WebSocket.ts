import WS from 'ws';

import { MessageType, ChangeData } from 'common/message';
import log from './log';

export interface WebSocketServer extends WS.Server {}

export interface WebSocket extends WS {
    isAlive: boolean;
    accountId?: string | null;
}

export interface SendDataParams {
    ws: WS;
    type: MessageType;
    data?: any;
    error?: any;
}

/**
 * Send data to one client
 */
export function sendData({ ws, type, data, error }: SendDataParams) {
    // log(`Sending to "${ws.accountId || 'unknown'}:"\n`, data);
    ws.send(JSON.stringify({ type, data, error }));
}

export interface BroadcastChangeDataParams {
    wss: WebSocketServer;
    type: MessageType;
    data?: ChangeData;
    error?: any;
}

/**
 * Broadcast a message to all connected clients.
 */
export function broadcastChangeData({ wss, type, data, error }: BroadcastChangeDataParams) {
    log('Broadcasting:\n', data);
    wss.clients.forEach((ws: WS) => ws.send(JSON.stringify({ type, data, error })));
}
