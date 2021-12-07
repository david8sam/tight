import React from 'react';

import { makeStyles } from '@material-ui/styles';
import { CircularProgress, Grid, Toolbar, Typography } from '@material-ui/core';

import Router from './Router';

const useStyle = makeStyles(() => ({
    loading: {
        height: '100%',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden',
    },
}));

export interface AppContentProps {
    loading: boolean;
}

function AppContent(props: AppContentProps) {
    const classes = useStyle(props);
    const { loading } = props;

    return (
        <div className={classes.content}>
            {loading ? (
                <Grid
                    className={classes.loading}
                    container
                    justifyContent="center"
                    alignItems="center"
                    direction="column"
                >
                    <CircularProgress size={'50vw'} />
                    <Toolbar />
                    <Typography variant="h4" color="primary">
                        Connecting
                    </Typography>
                </Grid>
            ) : (
                <Router />
            )}
        </div>
    );
}

export default AppContent;
