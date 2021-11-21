import React, { useReducer, useState } from 'react';

import { CssBaseline } from '@material-ui/core';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';

import Context from './Context';
import AppContent from './AppContent';
import reducer, { initialState } from './reducer';
import useWebSocket from './hooks/useWebSocket';

const LIGHT_THEME = createTheme({
    palette: {
        type: 'light',
    },
});

const DARK_THEME = createTheme({
    palette: {
        type: 'dark',
    },
});

function App(props: Object) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [webSocketOpen, setWebSocketOpen] = useState(false);

    const { sendData } = useWebSocket({
        url: `ws://${window.location.hostname}:8080/`,
        onOpen: () => setWebSocketOpen(true),
        dispatch,
    });

    return (
        <ThemeProvider theme={state.useDarkTheme ? DARK_THEME : LIGHT_THEME}>
            <CssBaseline />
            <Context.Provider value={{ state, dispatch, sendData }}>
                <AppContent loading={!webSocketOpen} />
            </Context.Provider>
        </ThemeProvider>
    );
}

export default App;
