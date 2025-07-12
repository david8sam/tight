import React, { useState } from 'react';
import { useLocation } from 'react-router';

import Brightness6 from '@mui/icons-material/Brightness6';
import Brightness6Outlined from '@mui/icons-material/Brightness6Outlined';
import ErroIcon from '@mui/icons-material/Error';
import MenuIcon from '@mui/icons-material/Menu';
import {
    AppBar,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Toolbar,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import { AppTheme } from '../types';

import Drawer from './Drawer';
import TextWithTooltip from './TextWithTooltip';

function Header() {
    const appTheme = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);

    useLocation();
    const { pathname } = window.location;
    const isHome = pathname === '/';

    const {
        dispatch,
        state: { playerId, theme, connecting, connectError },
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
                    <CircularProgress style={{ color: appTheme.palette.text.primary }} size={24} />
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
                            <IconButton edge="start" onClick={() => setDrawerOpen(open => !open)} size="large">
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <TextWithTooltip
                            text={isHome ? '' : playerId ?? ''}
                            width={connectError ? '25%' : '75%'}
                            variant="h6"
                        />
                    </Grid>
                    {connectionStatus}
                    <Tooltip title={theme === 'light' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
                        <IconButton onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} size="large">
                            {theme === 'dark' ? <Brightness6Outlined /> : <Brightness6 />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <Drawer open={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

export default Header;
