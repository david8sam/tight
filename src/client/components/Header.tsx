import React, { useState } from 'react';

import { AppBar, Grid, IconButton, Toolbar, Tooltip, Typography } from '@material-ui/core';
import Brightness6 from '@material-ui/icons/Brightness6';
import Brightness6Outlined from '@material-ui/icons/Brightness6Outlined';
import MenuIcon from '@material-ui/icons/Menu';

import { useAppContext } from '../Context';
import Drawer from './Drawer';
import { ActionType } from '../reducer';

function Header(props: object) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const {
        state: { accountId, useDarkTheme },
        dispatch,
    } = useAppContext();

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
                        <Typography variant="h6">{accountId || ''}</Typography>
                    </Grid>
                    <Tooltip title={useDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
                        <IconButton onClick={() => dispatch({ type: ActionType.useDarkTheme, payload: !useDarkTheme })}>
                            {useDarkTheme ? <Brightness6Outlined /> : <Brightness6 />}
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
