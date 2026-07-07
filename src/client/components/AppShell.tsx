import React, { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import useGameInfo from '../hooks/useGameInfo';

import BottomNav from './BottomNav';
import Drawer from './Drawer';
import GameStateBar from './GameStateBar';
import NavRail from './NavRail';
import TopBar from './TopBar';

interface AppShellProps {
    children: ReactNode;
}

const useStyles = makeStyles()(() => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    body: {
        display: 'flex',
        flex: 1,
        minHeight: 0,
    },
    main: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
    },
}));

/**
 * Responsive application shell: top bar everywhere, nav rail on desktop, swipeable drawer +
 * bottom navigation on mobile, and the persistent game-state bar on game pages.
 */
function AppShell({ children }: AppShellProps) {
    const { classes } = useStyles();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [drawerOpen, setDrawerOpen] = useState(false);

    const { game, gameId } = useGameInfo();
    const { pathname } = useLocation();

    const inGame = Boolean(game && gameId && pathname.toLowerCase().startsWith(`/${gameId.toLowerCase()}`));

    return (
        <div className={classes.root}>
            <TopBar showMenuButton={!isDesktop} onMenuClick={() => setDrawerOpen(open => !open)} />
            {!isDesktop && (
                <Drawer open={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} />
            )}
            <div className={classes.body}>
                {isDesktop && <NavRail />}
                <main className={classes.main}>
                    {inGame && <GameStateBar />}
                    {children}
                </main>
            </div>
            {!isDesktop && inGame && <BottomNav />}
        </div>
    );
}

export default AppShell;
