import React, { useState } from 'react';
import { useLocation } from 'react-router';

import Brightness6 from '@mui/icons-material/Brightness6';
import Brightness6Outlined from '@mui/icons-material/Brightness6Outlined';
import ErroIcon from '@mui/icons-material/Error';
import MenuIcon from '@mui/icons-material/Menu';
import {
    AppBar,
    Alert,
    Snackbar,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Toolbar,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';

import { useSession } from '../SessionGate';
import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import { AppTheme } from '../types';

import Drawer from './Drawer';
import SharingButton from './SharingButton';
import TextWithTooltip from './TextWithTooltip';

function Header() {
    const session = useSession();
    const appTheme = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);

    useLocation();
    const { pathname } = window.location;
    const isHome = pathname === '/';

    const {
        dispatch,
        state: { playerId, theme, connecting, connectError, saveStatus, commandNotice },
    } = useAppContext();

    const onThemeChange = (theme: AppTheme) => {
        dispatch({ type: ActionType.setTheme, payload: theme });
    };

    let connectionStatus = null;
    if (connectError) {
        connectionStatus = (
            <Grid container justifyContent="center" alignItems="center" spacing={1}>
                <Grid item>
                    <ErroIcon color="error" />
                </Grid>
                <Grid item>
                    <Button
                        color="secondary"
                        variant="contained"
                        size="small"
                        onClick={() => dispatch({ type: ActionType.setConnecting, payload: { reconnect: true } })}
                    >
                        <Typography color="textPrimary">Reconnect</Typography>
                    </Button>
                </Grid>
            </Grid>
        );
    } else if (connecting) {
        connectionStatus = (
            <Grid container justifyContent="center" alignItems="center" spacing={1}>
                <Grid item>
                    <CircularProgress
                        aria-label="Connecting"
                        style={{ color: appTheme.palette.text.primary }}
                        size={24}
                    />
                </Grid>
                <Grid item>
                    <Typography color="textPrimary">Connecting...</Typography>
                </Grid>
            </Grid>
        );
    }

    return (
        <>
            <AppBar position="sticky">
                <Toolbar>
                    <Grid container alignItems="center">
                        <Tooltip title="Menu">
                            <IconButton
                                aria-label="Menu"
                                aria-expanded={drawerOpen}
                                edge="start"
                                onClick={() => setDrawerOpen(open => !open)}
                                size="large"
                            >
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <TextWithTooltip
                            text={isHome ? '' : (playerId ?? '')}
                            width={connectError ? '25%' : '75%'}
                            variant="h6"
                        />
                    </Grid>
                    {connectionStatus}
                    <SharingButton />
                    {saveStatus !== 'idle' && (
                        <Typography role="status" aria-live="polite" variant="caption" sx={{ px: 1, flexShrink: 0 }}>
                            {saveStatus === 'pending'
                                ? 'Saving…'
                                : saveStatus === 'saved'
                                  ? 'Saved'
                                  : saveStatus === 'unconfirmed'
                                    ? 'Unconfirmed'
                                    : 'Not saved'}
                        </Typography>
                    )}
                    <Tooltip title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
                        <IconButton onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} size="large">
                            {theme === 'dark' ? <Brightness6Outlined /> : <Brightness6 />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <Snackbar open={Boolean(commandNotice)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert
                    severity={commandNotice?.kind === 'failed' ? 'error' : 'warning'}
                    onClose={
                        commandNotice?.kind === 'failed'
                            ? () =>
                                  dispatch({
                                      type: ActionType.setCommandStatus,
                                      payload: { commandNotice: null, saveStatus: 'idle' },
                                  })
                            : undefined
                    }
                >
                    {commandNotice?.message}
                    <div>
                        {commandNotice?.kind === 'unconfirmed' && (
                            <Button
                                color="inherit"
                                onClick={() =>
                                    dispatch({ type: ActionType.setConnecting, payload: { reconnect: true } })
                                }
                            >
                                Check last change
                            </Button>
                        )}
                        <Button color="inherit" onClick={() => window.location.reload()}>
                            Reload current game
                        </Button>
                    </div>
                </Alert>
            </Snackbar>
            {session.role === 'player' && (
                <Typography variant="body2" sx={{ px: 2, py: 1 }}>
                    Playing as {session.playerId}. {session.tableEditing
                        ? 'Table-wide public editing enabled. The host controls setup, game start/end and device access.'
                        : 'The host controls setup and game phases.'}
                </Typography>
            )}
            {session.role === 'spectator' && (
                <Typography variant="body2" sx={{ px: 2, py: 1 }}>
                    Spectator, read only.
                </Typography>
            )}
            <Drawer open={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

export default Header;
