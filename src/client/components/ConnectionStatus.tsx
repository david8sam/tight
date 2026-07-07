import React from 'react';

import { Button, Tooltip, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

const pulse = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.35; }
    100% { opacity: 1; }
`;

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.875),
        minWidth: 0,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
    },
    connected: {
        backgroundColor: theme.palette.success.main,
    },
    connecting: {
        backgroundColor: theme.palette.warning.main,
        animation: `${pulse} 1.2s ease-in-out infinite`,
    },
    error: {
        backgroundColor: theme.palette.error.main,
    },
    label: {
        color: theme.palette.text.secondary,
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
}));

function ConnectionStatus() {
    const { classes, cx } = useStyles();

    const {
        dispatch,
        state: { connecting, connectError },
    } = useAppContext();

    if (connectError) {
        return (
            <span className={classes.root}>
                <span className={cx(classes.dot, classes.error)} />
                <Button
                    color="error"
                    size="small"
                    onClick={() => dispatch({ type: ActionType.setConnecting, payload: { reconnect: true } })}
                >
                    Reconnect
                </Button>
            </span>
        );
    }

    const label = connecting ? 'Connecting…' : 'Connected';

    return (
        <Tooltip title={label}>
            <span className={classes.root}>
                <span className={cx(classes.dot, connecting ? classes.connecting : classes.connected)} />
                <Typography className={classes.label} variant="caption">
                    {label}
                </Typography>
            </span>
        </Tooltip>
    );
}

export default ConnectionStatus;
