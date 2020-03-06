import { useCallback, useMemo } from 'react';

import { LoginStatus } from 'common/Account';
import { AllData, ChangeData, Message, MessageType } from 'common/message';

import { Action, ActionType } from '../reducer';
import { Faction } from 'common/Faction';

export interface SendDataFunction {
    ({ type, data }: { type: MessageType; data?: any }): void;
}

const webSocketMap: { [url: string]: WebSocket } = {};

function onMessage(dispatch: React.Dispatch<Action>, e: MessageEvent) {
    const msg = JSON.parse(e.data);
    const { type, data, error } = msg || {};

    switch (type) {
        case MessageType.ACCOUNT_LOGIN:
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGGED_IN, accountId: data as string },
            });
            break;
        case MessageType.ACCOUNT_LOGOUT:
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGGED_OUT, accountId: null },
            });
            break;

        case MessageType.BROADCAST_INITIALIZE:
            dispatch({ type: ActionType.initializeState, payload: data as AllData });
        case MessageType.BROADCAST_CHANGE:
            dispatch({ type: ActionType.updateState, payload: data as ChangeData });
            break;

        case MessageType.FACTION_GET:
            dispatch({ type: ActionType.setFactionInfo, payload: data as Faction });
            break;

        default:
            break;
    }
}

function sendData({ ws, type, data }: { ws: WebSocket; type: MessageType; data: any }) {
    ws.send(JSON.stringify({ type, data }));
}

function useWebSocket({
    url,
    onOpen,
    dispatch,
}: {
    url: string;
    onOpen: () => void;
    dispatch: React.Dispatch<Action>;
}) {
    let ws = webSocketMap[url];
    if (!ws) {
        ws = new WebSocket(url);
        webSocketMap[url] = ws;
    }

    useMemo(() => (ws.onopen = onOpen), [onOpen]);
    useMemo(() => (ws.onmessage = (e: MessageEvent) => onMessage(dispatch, e)), [dispatch]);

    const sd: SendDataFunction = useCallback(({ type, data }: Message): void => sendData({ ws, type, data }), [ws]);

    return { sendData: sd };
}

export default useWebSocket;
