import React, { useReducer } from 'react';

import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import { WSS_PORT } from 'common/constants';

import Context from './Context';
import AppContent from './AppContent';
import reducer, { initialState } from './reducer';
import useWebSocket from './hooks/useWebSocket';
import { getAppTheme } from './theme';

function App() {
    const [state, dispatch] = useReducer(reducer, initialState);

    const { sendData } = useWebSocket({
        url: `ws://${window.location.hostname}:${WSS_PORT}/`,
        dispatch,
        state,
    });

    return (
        <ThemeProvider theme={getAppTheme(state.theme)}>
            <CssBaseline />
            <Context.Provider value={{ state, dispatch, sendData }}>
                <AppContent />
            </Context.Provider>
        </ThemeProvider>
    );
}

export default App;
