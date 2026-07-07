import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ButtonBase, Divider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import useGameInfo from '../hooks/useGameInfo';

import { NAV_ITEMS, getActiveNavId, getNavPath } from './navItems';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.5),
        width: 92,
        flexShrink: 0,
        padding: theme.spacing(1, 0.75),
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        overflowY: 'auto',
    },
    item: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(0.375),
        padding: theme.spacing(1, 0.5),
        borderRadius: theme.game.radius.control,
        color: theme.palette.text.secondary,
        '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.06),
        },
    },
    active: {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
        '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
        },
    },
    disabled: {
        color: theme.palette.text.disabled,
    },
    label: {
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: '0.02em',
        lineHeight: 1,
    },
    divider: {
        margin: theme.spacing(0.75, 1),
    },
}));

function NavRail() {
    const { classes, cx } = useStyles();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { game, gameId } = useGameInfo();

    const activeId = getActiveNavId(pathname);

    const mainItems = NAV_ITEMS.filter(item => item.section === 'main');
    const referenceItems = NAV_ITEMS.filter(item => item.section === 'reference');

    const renderItem = (item: (typeof NAV_ITEMS)[number]) => {
        const disabled = (item.gamePage && !game) || (item.requiresStarted && !game?.status.started);
        const active = activeId === item.id && !disabled;
        const { Icon } = item;

        return (
            <ButtonBase
                key={item.id || 'home'}
                className={cx(classes.item, active && classes.active, disabled && classes.disabled)}
                disabled={Boolean(disabled)}
                onClick={() => navigate(getNavPath(item, gameId))}
            >
                <Icon fontSize="small" />
                <Typography className={classes.label} component="span">
                    {item.label}
                </Typography>
            </ButtonBase>
        );
    };

    return (
        <nav className={classes.root}>
            {mainItems.map(renderItem)}
            <Divider className={classes.divider} />
            {referenceItems.map(renderItem)}
        </nav>
    );
}

export default NavRail;
