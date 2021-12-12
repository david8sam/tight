import { Dispatch, useCallback, useEffect, useRef } from 'react';

import { LoginStatus } from 'common/Account';
import { Message, MessageType } from 'common/message';

import { Action, ActionType, State } from '../reducer';

const RETRY_LIMIT = 5;
const RETRY_INTERVAL = 3000;

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

export interface WebSocketOptions {
    url: string;
    dispatch: Dispatch<Action>;
    state: State;
}

export default function useWebSocket(options: WebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const initRef = useRef({ initialized: false, initializing: false });
    const retryRef = useRef(0);

    const optionsRef = useRef<WebSocketOptions>(options);
    optionsRef.current = options;

    // These callback functions must use refs for passing data since the callbacks are only attached
    // when opening a new connection.
    const onOpen = useCallback(() => {
        // Trigger initialize callback if first time.
        const { dispatch } = optionsRef.current;
        if (!initRef.current.initialized) {
            initRef.current.initialized = true;
            initRef.current.initializing = false;
        }

        dispatch({ type: ActionType.setConnecting, payload: { connecting: false, connectError: false } });
    }, []);

    const onClose = useCallback((e: CloseEvent) => {
        const { initialized, connecting, connectError } = optionsRef.current.state;
        if (!e.wasClean && initialized && !connecting && !connectError) {
            connect();
        }
    }, []);

    const onMessage = useCallback((e: MessageEvent) => onWebSocketMessage(optionsRef.current.dispatch, e), []);

    const onError = useCallback((e: Event) => {
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.CONNECTING) {
            console.log('Error connecting web socket');
        }
    }, []);

    const connect = useCallback(() => {
        if (document.visibilityState !== 'visible') {
            return;
        }

        const { state, dispatch, url } = optionsRef.current;
        if (retryRef.current < RETRY_LIMIT) {
            let ws = wsRef.current;
            if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
                dispatch({ type: ActionType.setConnecting, payload: { connecting: true, connectError: false } });

                // Create new connection to the server
                const queryParam = initRef.current.initialized ? `?reconnect=${state.accountId ?? 'anonymous'}` : '';
                ws = new WebSocket(`${url}${queryParam}`);
                ws.onopen = onOpen;
                ws.onmessage = onMessage;
                ws.onclose = onClose;
                ws.onerror = onError;
                wsRef.current = ws;
            }
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            retryRef.current = 0;
        } else {
            if (retryRef.current < RETRY_LIMIT) {
                retryRef.current += 1;
                setTimeout(connect, RETRY_INTERVAL);
            } else if (retryRef.current === RETRY_LIMIT) {
                dispatch({ type: ActionType.setConnecting, payload: { connecting: false, connectError: true } });
            }
        }
    }, []);

    useEffect(() => {
        // When a device sleeps/moves the browser to the background, it will close web socket connections.
        // Reconnect when the page becomes visible/active again.
        document.addEventListener('visibilitychange', connect);

        if (!initRef.current.initialized && !initRef.current.initializing) {
            initRef.current.initializing = true;
            connect();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }

            document.removeEventListener('visibilitychange', connect);
        };
    }, []);

    useEffect(() => {
        if (options.state.reconnect) {
            retryRef.current = 0;
            options.dispatch({ type: ActionType.setConnecting, payload: { reconnect: false } });
            connect();
        }
    }, [options.state.reconnect]);

    // Only generate this function once. Should only rely on refs.
    const sd: SendDataFunction = useCallback(({ type, data }: Message): void => {
        const ws = wsRef.current;
        const isOpen = ws && ws.readyState === WebSocket.OPEN;
        if (isOpen) {
            sendData({ ws, type, data });
        }
    }, []);

    return { sendData: sd };
}
