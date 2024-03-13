import React from 'react';

import { Button, CircularProgress, Grid, Toolbar, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useAppContext } from './Context';
import Router from './Router';
import { ActionType } from './reducer';

const useStyle = makeStyles(() => ({
    fullHeight: {
        height: '100%',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden',
    },
}));

function AppContent() {
    const classes = useStyle();
    const {
        state: { initialized, connectError },
        dispatch,
    } = useAppContext();

    let content = null;
    if (!initialized) {
        if (connectError) {
            content = (
                <Grid
                    className={classes.fullHeight}
                    container
                    justifyContent="center"
                    alignItems="center"
                    direction="column"
                >
                    <Typography align="center" variant="h4" color="primary">
                        Failed to connect to server, try again later.
                    </Typography>
                    <Toolbar />
                    <Toolbar>
                        <Button
                            fullWidth
                            color="primary"
                            variant="contained"
                            onClick={() => dispatch({ type: ActionType.setConnecting, payload: { reconnect: true } })}
                        >
                            <Typography>Reconnect</Typography>
                        </Button>
                    </Toolbar>
                </Grid>
            );
        } else {
            content = (
                <Grid
                    className={classes.fullHeight}
                    container
                    justifyContent="center"
                    alignItems="center"
                    direction="column"
                >
                    <CircularProgress size={'50vw'} />
                    <Toolbar />
                    <Typography variant="h4" color="primary">
                        Initializing...
                    </Typography>
                </Grid>
            );
        }
    } else {
        content = <Router />;
    }

    return <div className={classes.content}>{content}</div>;
}

export default AppContent;
