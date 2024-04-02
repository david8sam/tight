import React from 'react';

import { Button, Grid, Paper, Toolbar, Typography } from '@mui/material';

import { useAppContext } from './Context';
import Router from './Router';
import { ActionType } from './reducer';

function AppContent() {
    const {
        state: { connectError },
        dispatch,
    } = useAppContext();

    let content = null;
    if (connectError) {
        content = (
            <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
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
        content = <Router />;
    }

    // Paper around the content in order for theme to apply to all child components
    return (
        <Paper
            square
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowX: 'hidden',
            }}
        >
            {content}
        </Paper>
    );
}

export default AppContent;
