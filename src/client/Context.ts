import React, { useContext } from 'react';
import { Action, State } from './reducer';
import { SendDataFunction } from './hooks/useWebSocket';

interface ContextValue {
    readonly state: State;
    dispatch: React.Dispatch<Action>;
    sendData: SendDataFunction;
}

const Context = React.createContext({
    state: {} as State,
    dispatch: (() => {}) as React.Dispatch<Action>,
    sendData: (() => {}) as SendDataFunction,
});

export const useAppContext = (): ContextValue => useContext(Context);

export default Context;
