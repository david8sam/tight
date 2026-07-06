import React, { useReducer } from 'react';

import { CssBaseline } from '@mui/material';
import { createTheme, Theme, ThemeProvider } from '@mui/material/styles';

import { WSS_PORT } from 'common/constants';

import Context from './Context';
import AppContent from './AppContent';
import reducer, { initialState } from './reducer';
import useWebSocket from './hooks/useWebSocket';

const baseThemeOptions = {
    typography: {
        fontFamily: '"Exo 2", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700, letterSpacing: '0.02em' },
        h2: { fontFamily: '"Orbitron", sans-serif', fontWeight: 700, letterSpacing: '0.02em' },
        h3: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600, letterSpacing: '0.01em' },
        h4: { fontFamily: '"Orbitron", sans-serif', fontWeight: 600 },
        h5: { fontFamily: '"Orbitron", sans-serif', fontWeight: 500 },
        h6: { fontFamily: '"Orbitron", sans-serif', fontWeight: 500, letterSpacing: '0.01em' },
        button: { fontFamily: '"Exo 2", sans-serif', fontWeight: 600, letterSpacing: '0.03em' },
    },
    shape: { borderRadius: 2 },
    components: {
        MuiAppBar: {
            defaultProps: { color: 'primary' as const },
            styleOverrides: { root: { backgroundImage: 'none' } },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme }: { theme: Theme }) => ({
                    borderRight: `1px solid ${theme.palette.divider}`,
                }),
            },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
};

const LIGHT_THEME = createTheme({
    ...baseThemeOptions,
    palette: {
        mode: 'light',
        primary: { main: '#2C4A8C', light: '#5C77B5', dark: '#1A2F5C', contrastText: '#FFFFFF' },
        secondary: { main: '#A8721E', light: '#C99440', dark: '#7A5012', contrastText: '#FFFFFF' },
        error: { main: '#C62828' },
        warning: { main: '#B8860B' },
        success: { main: '#2E8B6B' },
        info: { main: '#2D6FA3' },
        background: { default: '#EDEFF5', paper: '#FFFFFF' },
        text: { primary: '#1A1E2E', secondary: '#4B5268', disabled: '#9AA0B4' },
        divider: 'rgba(40, 50, 80, 0.14)',
    },
});

const DARK_THEME = createTheme({
    ...baseThemeOptions,
    palette: {
        mode: 'dark',
        primary: { main: '#5C8DEA', light: '#8FB2F2', dark: '#3A63B0', contrastText: '#0A0E17' },
        secondary: { main: '#D9A23B', light: '#E8C171', dark: '#A87A22', contrastText: '#0A0E17' },
        error: { main: '#E5484D' },
        warning: { main: '#E8A33D' },
        success: { main: '#3DBE8B' },
        info: { main: '#5AAFE0' },
        background: { default: '#0B0E1A', paper: '#141A2E' },
        text: { primary: '#E8EAF2', secondary: '#A0A8C0', disabled: '#5A6178' },
        divider: 'rgba(150, 165, 210, 0.16)',
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
