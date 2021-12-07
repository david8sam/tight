import { Dispatch, useCallback, useEffect, useRef } from 'react';

import { LoginStatus } from 'common/Account';
import { Message, MessageType } from 'common/message';

import { Action, ActionType } from '../reducer';

export interface SendDataFunction {
    ({ type, data }: { type: MessageType; data?: any }): void;
}

function onWebSocketMessage(dispatch: React.Dispatch<Action>, e: MessageEvent) {
    const msg = JSON.parse(e.data);
    const { type, data, error } = msg || {};

    switch (type) {
        case MessageType.ACCOUNT_LOGIN:
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGGED_IN, accountId: data, loginError: null },
            });
            break;
        case MessageType.ACCOUNT_LOGOUT:
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGGED_OUT, accountId: null },
            });
            break;

        case MessageType.BROADCAST_INITIALIZE:
            dispatch({ type: ActionType.setState, payload: data });
            break;
        case MessageType.BROADCAST_RECONNECT:
            dispatch({ type: ActionType.setState, payload: data });
            break;
        case MessageType.BROADCAST_CHANGE:
            dispatch({ type: ActionType.updateState, payload: data });
            break;

        case MessageType.FACTION_GET:
            dispatch({ type: ActionType.setFactionInfo, payload: data });
            break;

        default:
            break;
    }
}

function sendData({ ws, type, data }: { ws: WebSocket; type: MessageType; data?: any }) {
    ws.send(JSON.stringify({ type, data }));
}

type OpenConnectionParams = {
    url: string;
    onOpen: WebSocket['onopen'];
    onMessage: WebSocket['onmessage'];
};

function openConnection({ url, onOpen, onMessage }: OpenConnectionParams): WebSocket {
    // Create new connection to the server
    const ws = new WebSocket(url);
    ws.onopen = onOpen;
    ws.onmessage = onMessage;

    return ws;
}

export default function useWebSocket({
    url,
    onInitialized,
    dispatch,
    accountId,
}: {
    url: string;
    onInitialized: () => void;
    dispatch: Dispatch<Action>;
    accountId: string | null;
}) {
    const wsRef = useRef<WebSocket | null>(null);
    const messageQueueRef = useRef<Message[]>([]);

    const initializedRef = useRef(false);
    const onInitializedRef = useRef(onInitialized);
    onInitializedRef.current = onInitialized;

    const dispatchRef = useRef(dispatch);
    dispatchRef.current = dispatch;

    const accountIdRef = useRef(accountId);
    accountIdRef.current = accountId;

    // When a device sleeps/moves the browser to the background, it will close web socket connections.
    // Reconnect when the page becomes visible/active again.
    useEffect(() => {
        const reconnect = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            const ws = wsRef.current;
            if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
                dispatchRef.current({ type: ActionType.setReconnecting, payload: true });

                const acctId = accountIdRef.current;
                const queryParam = `?reconnect=${acctId ?? 'anonymous'}`;
                wsRef.current = openConnection({ url: `${url}${queryParam}`, onOpen, onMessage });
            }
        };

        document.addEventListener('visibilitychange', reconnect);

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }

            document.removeEventListener('visibilitychange', reconnect);
        };
    }, []);

    // These callback functions must use refs for passing data since the callbacks are only attached
    // when opening a new connection.
    const onOpen = useCallback(() => {
        const ws = wsRef.current;

        // Should always exists at this point.
        if (!ws) {
            return;
        }

        // Send out any queued messages to the server.
        messageQueueRef.current.forEach(msg => sendData({ ws, ...msg }));
        messageQueueRef.current.length = 0;

        // Trigger initialize callback if first time.
        if (!initializedRef.current) {
            initializedRef.current = true;
            onInitializedRef.current();
        }

        dispatchRef.current({ type: ActionType.setReconnecting, payload: false });
    }, []);

    const onMessage = useCallback((e: MessageEvent) => onWebSocketMessage(dispatchRef.current, e), []);

    if (!wsRef.current) {
        wsRef.current = openConnection({ url, onOpen, onMessage });
    }

    // Only generate this function once. Should only rely on refs.
    const sd: SendDataFunction = useCallback(({ type, data }: Message): void => {
        const ws = wsRef.current;
        const isOpen = ws && ws.readyState === WebSocket.OPEN;
        if (isOpen) {
            // If web socket is open, can send message to the server.
            sendData({ ws, type, data });
        } else {
            // If web socket is not open anymore, queue the message and reopen the connection.
            messageQueueRef.current.push({ type, data });
        }
    }, []);

    return { sendData: sd };
}
