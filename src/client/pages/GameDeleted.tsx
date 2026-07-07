import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { PageContainer, Panel } from '../components/ui';

const useStyles = makeStyles()(theme => ({
    panel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(2.5),
        padding: theme.spacing(4, 3),
        marginTop: theme.spacing(6),
        textAlign: 'center',
    },
}));

function GameDeleted() {
    const { classes } = useStyles();
    const { gameId } = useParams();
    const navigate = useNavigate();

    return (
        <PageContainer maxWidth={560}>
            <Panel className={classes.panel}>
                <Typography variant="h5">{`Game ${gameId} has been deleted due to inactivity`}</Typography>
                <Button fullWidth color="primary" variant="contained" size="large" onClick={() => navigate('/')}>
                    Go to Home page
                </Button>
            </Panel>
        </PageContainer>
    );
}

export default GameDeleted;
