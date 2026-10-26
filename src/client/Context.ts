import React, { useContext } from 'react';
import { Action, State } from './reducer';
import { SendDataFunction } from './hooks/useWebSocket';

interface ContextValue {
    readonly state: State;
    dispatch: React.Dispatch<Action>;
    sendData: SendDataFunction;
}

const Context = React.createContext<ContextValue>({
    state: {} as State,
    dispatch: (() => {}) as React.Dispatch<Action>,
    sendData: () => false,
});

export const useAppContext = (): ContextValue => useContext(Context);

export default Context;
