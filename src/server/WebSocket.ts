import { WebSocketServer as WSServer, WebSocket as WS } from 'ws';

import { AccountMap } from 'common/Account.js';
import { MessageType, ChangeData } from 'common/message.js';

import { logDebug, logWS } from './log.js';

export interface WebSocketServer extends WSServer {}

export interface WebSocket extends WS {
    isAlive: boolean;
    accountId?: string | null;
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
    logWS(true, ws.accountId, { type, data, error });
    ws.send(JSON.stringify({ type, data, error }));
}

export interface BroadcastChangeDataParams {
    wss: WebSocketServer;
    updatedAccounts?: AccountMap | null;
    data?: ChangeData;
    error?: any;
}

/**
 * Broadcast a message to all connected clients.
 */
export function broadcastChangeData({ wss, updatedAccounts, data, error }: BroadcastChangeDataParams) {
    const payload = { type: MessageType.BROADCAST_CHANGE, data, error };
    const accountIds: string[] = [];
    wss.clients.forEach(ws => {
        const id = (ws as WebSocket).accountId;
        if (id) {
            accountIds.push(id);
        }
    });

    if (updatedAccounts) {
        logDebug('Updated Accounts:\n', updatedAccounts);
    }
    logWS(true, accountIds, payload);

    wss.clients.forEach((ws: WS) => {
        // If an user updated their account, only broadcast account changes to that user.
        const accountId = (ws as WebSocket).accountId;
        const updatedAccount = updatedAccounts && accountId ? updatedAccounts[accountId] : null;
        if (updatedAccount && payload.data) {
            payload.data.account = updatedAccount;
        }

        ws.send(JSON.stringify(payload));

        // Reset user specific data for next account to broadcast to.
        delete payload.data?.account;
    });
}
