import React, { useState } from 'react';

import { AppBar, Grid, IconButton, Toolbar, Tooltip, Typography } from '@material-ui/core';
import Brightness6 from '@material-ui/icons/Brightness6';
import Brightness6Outlined from '@material-ui/icons/Brightness6Outlined';
import MenuIcon from '@material-ui/icons/Menu';

import { AppTheme } from 'common/Account';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import Drawer from './Drawer';
import TextWithTooltip from './TextWithTooltip';

function Header() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const {
        sendData,
        state: { accountId, accounts },
    } = useAppContext();

    const account = accountId ? accounts[accountId] : null;
    const theme = account?.settings?.theme ?? 'light';

    const onThemeChange = (theme: AppTheme) => {
        sendData({ type: MessageType.ACCOUNT_SET_SETTINGS, data: { accountId, settings: { theme } } });
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
