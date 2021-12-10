import React, { useReducer, useState } from 'react';

import { CssBaseline } from '@material-ui/core';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';

import { WSS_PORT } from 'common/constants';

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

function App() {
    const [state, dispatch] = useReducer(reducer, initialState);

    const { sendData } = useWebSocket({
        url: `ws://${window.location.hostname}:${WSS_PORT}/`,
        dispatch,
        state,
    });

    return (
        <ThemeProvider theme={state.theme === 'dark' ? DARK_THEME : LIGHT_THEME}>
            <CssBaseline />
            <Context.Provider value={{ state, dispatch, sendData }}>
                <AppContent />
            </Context.Provider>
        </ThemeProvider>
    );
}

export default App;
