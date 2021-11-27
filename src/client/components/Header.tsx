import React, { useState } from 'react';

import { AppBar, Grid, IconButton, Toolbar, Tooltip, Typography } from '@material-ui/core';
import Brightness6 from '@material-ui/icons/Brightness6';
import Brightness6Outlined from '@material-ui/icons/Brightness6Outlined';
import MenuIcon from '@material-ui/icons/Menu';

import { AppTheme, LoginStatus } from 'common/Account';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import Drawer from './Drawer';
import TextWithTooltip from './TextWithTooltip';

function Header() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const {
        dispatch,
        sendData,
        state: { accountId, accounts, loginStatus, theme = 'light' },
    } = useAppContext();

    const account = accountId ? accounts[accountId] : null;
    const loggedIn = loginStatus === LoginStatus.LOGGED_IN;

    const onThemeChange = (theme: AppTheme) => {
        if (loggedIn) {
            sendData({ type: MessageType.ACCOUNT_SET_SETTINGS, data: { accountId, settings: { theme } } });
        } else {
            dispatch({ type: ActionType.setTheme, payload: { theme } });
        }
    };

    return (
        <>
            <AppBar position="fixed">
                <Toolbar>
                    <Grid container alignItems="center">
                        <Tooltip title="Menu">
                            <IconButton edge="start" onClick={() => setDrawerOpen(open => !open)}>
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <TextWithTooltip text={account?.name ?? ''} width="75%" variant="h6" />
                    </Grid>
                    <Tooltip title={theme === 'light' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
                        <IconButton onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}>
                            {theme === 'dark' ? <Brightness6Outlined /> : <Brightness6 />}
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <Toolbar />
            <Drawer open={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

export default Header;
