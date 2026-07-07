import React from 'react';
import { useNavigate } from 'react-router-dom';

import Brightness6 from '@mui/icons-material/Brightness6';
import Brightness6Outlined from '@mui/icons-material/Brightness6Outlined';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Avatar, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import { getFactionColors } from '../utils/faction';

import ConnectionStatus from './ConnectionStatus';

interface TopBarProps {
    /** Show the menu button (mobile — opens the swipeable drawer) */
    showMenuButton: boolean;
    onMenuClick: () => void;
}

const useStyles = makeStyles()(theme => ({
    appBar: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    wordmark: {
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: theme.palette.primary.main,
        cursor: 'pointer',
        userSelect: 'none',
    },
    spacer: {
        flex: 1,
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
    },
    avatar: {
        width: 30,
        height: 30,
        fontSize: 12,
        fontWeight: 600,
    },
}));

function TopBar({ showMenuButton, onMenuClick }: TopBarProps) {
    const { classes } = useStyles();
    const theme = useTheme();
    const navigate = useNavigate();

    const {
        dispatch,
        state: { playerId, game, theme: appTheme },
    } = useAppContext();

    const onThemeToggle = () => {
        dispatch({ type: ActionType.setTheme, payload: appTheme === 'dark' ? 'light' : 'dark' });
    };

    const playerFaction = playerId ? game?.factions.find(f => f.playerIds.includes(playerId)) : undefined;
    const factionColors = playerFaction && getFactionColors(theme, playerFaction);

    return (
        <AppBar className={classes.appBar} position="static" elevation={0}>
            <Toolbar variant="dense">
                {showMenuButton && (
                    <Tooltip title="Menu">
                        <IconButton edge="start" onClick={onMenuClick} size="large">
                            <MenuIcon />
                        </IconButton>
                    </Tooltip>
                )}
                <Typography className={classes.wordmark} variant="h6" onClick={() => navigate('/')}>
                    TIGHT
                </Typography>
                <span className={classes.spacer} />
                <div className={classes.actions}>
                    <ConnectionStatus />
                    <Tooltip title={appTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
                        <IconButton onClick={onThemeToggle} size="large">
                            {appTheme === 'dark' ? <Brightness6Outlined /> : <Brightness6 />}
                        </IconButton>
                    </Tooltip>
                    {playerId && (
                        <Tooltip title={playerId}>
                            <Avatar
                                className={classes.avatar}
                                sx={{
                                    bgcolor: factionColors?.base ?? theme.palette.primary.main,
                                    color: factionColors?.on ?? theme.palette.primary.contrastText,
                                }}
                            >
                                {playerId.slice(0, 2)}
                            </Avatar>
                        </Tooltip>
                    )}
                </div>
            </Toolbar>
        </AppBar>
    );
}

export default TopBar;
