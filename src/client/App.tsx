import React, { useReducer } from 'react';

import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';

import Context from './Context';
import { useSession } from './SessionGate';
import AppContent from './AppContent';
import reducer, { initialState } from './reducer';
import useWebSocket from './hooks/useWebSocket';
import { getWebSocketUrl } from './utils/urls';

declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}

const LIGHT_THEME = createTheme({
    palette: {
        mode: 'light',
        contrastThreshold: 4.5,
    },
});

const DARK_THEME = createTheme({
    palette: {
        mode: 'dark',
        contrastThreshold: 4.5,
    },
});

function App() {
    const session = useSession();
    const [state, dispatch] = useReducer(reducer, initialState, saved => ({
        ...saved,
        playerId: session.role === 'player' ? session.playerId : session.role === 'spectator' ? null : saved.playerId,
    }));

    const { sendData } = useWebSocket({
        url: getWebSocketUrl(window.location.origin),
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
