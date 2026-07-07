import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import useGameInfo from '../hooks/useGameInfo';

import { BOTTOM_NAV_IDS, NAV_ITEMS, getActiveNavId, getNavPath } from './navItems';

const useStyles = makeStyles()(theme => ({
    root: {
        flexShrink: 0,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
    },
}));

function BottomNav() {
    const { classes } = useStyles();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { game, gameId } = useGameInfo();

    const activeId = getActiveNavId(pathname);
    const items = BOTTOM_NAV_IDS.map(id => NAV_ITEMS.find(item => item.id === id)!);

    return (
        <BottomNavigation
            className={classes.root}
            component="nav"
            showLabels
            value={activeId}
            onChange={(_e, id: string) => {
                const item = items.find(i => i.id === id);
                if (item) {
                    navigate(getNavPath(item, gameId));
                }
            }}
        >
            {items.map(item => (
                <BottomNavigationAction
                    key={item.id}
                    value={item.id}
                    label={item.label}
                    icon={<item.Icon />}
                    disabled={Boolean(item.requiresStarted && !game?.status.started)}
                />
            ))}
        </BottomNavigation>
    );
}

export default BottomNav;
