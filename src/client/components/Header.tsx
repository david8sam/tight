import React, { useState } from 'react';

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
} from '@material-ui/core';
import Brightness6 from '@material-ui/icons/Brightness6';
import Brightness6Outlined from '@material-ui/icons/Brightness6Outlined';
import ErroIcon from '@material-ui/icons/Error';
import MenuIcon from '@material-ui/icons/Menu';

import { AppTheme, LoginStatus } from 'common/Account';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import Drawer from './Drawer';
import TextWithTooltip from './TextWithTooltip';

function Header() {
    const appTheme = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const {
        dispatch,
        sendData,
        state: { account, loginStatus, theme = 'light', connecting, connectError },
    } = useAppContext();

    const accountId = account?.id;
    const loggedIn = loginStatus === LoginStatus.LOGGED_IN;

    const onThemeChange = (theme: AppTheme) => {
        dispatch({ type: ActionType.setTheme, payload: { theme } });
        if (loggedIn) {
            sendData({ type: MessageType.ACCOUNT_SET_SETTINGS, data: { accountId, settings: { theme } } });
        }
    };

    const accoutnName = loggedIn ? account?.name : '';

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
                            <IconButton edge="start" onClick={() => setDrawerOpen(open => !open)}>
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <TextWithTooltip text={accoutnName ?? ''} width={connectError ? '25%' : '75%'} variant="h6" />
                    </Grid>
                    {connectionStatus}
                    <Tooltip title={theme === 'light' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
                        <IconButton onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}>
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
