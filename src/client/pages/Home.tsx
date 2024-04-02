import React, { useState } from 'react';

import { Button, Container, Typography } from '@mui/material';

import JoinGameDialog from '../components/JoinGameDialog';
import NewGameDialog from '../components/NewGameDialog';

function Home() {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openJoinDialog, setOpenJoinDialog] = useState(false);

    return (
        <Container sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <Typography variant="h4" align="center">
                Twilight Imperium Game Helper / Tracker
            </Typography>
            <Typography variant="h4" align="center" gutterBottom>
                (TIGHT)
            </Typography>
            <Button
                sx={{ margin: 1 }}
                color="primary"
                variant="contained"
                size="large"
                onClick={() => setOpenCreateDialog(true)}
            >
                Create Game
            </Button>
            <Button
                sx={{ margin: 1 }}
                color="primary"
                variant="contained"
                size="large"
                onClick={() => setOpenJoinDialog(true)}
            >
                Join Game
            </Button>
            {openCreateDialog && <NewGameDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} />}
            {openJoinDialog && <JoinGameDialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} />}
        </Container>
    );
}

export default Home;
