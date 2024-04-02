import React, { useReducer } from 'react';

import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';

import { WSS_PORT } from 'common/constants';

import Context from './Context';
import AppContent from './AppContent';
import reducer, { initialState } from './reducer';
import useWebSocket from './hooks/useWebSocket';

declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}

const LIGHT_THEME = createTheme({
    palette: {
        mode: 'light',
    },
});

const DARK_THEME = createTheme({
    palette: {
        mode: 'dark',
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
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={state.theme === 'dark' ? DARK_THEME : LIGHT_THEME}>
                <CssBaseline />
                <Context.Provider value={{ state, dispatch, sendData }}>
                    <AppContent />
                </Context.Provider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}

export default App;
