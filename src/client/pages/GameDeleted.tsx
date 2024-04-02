import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Toolbar, Typography } from '@mui/material';

function GameDeleted() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    return (
        <Container sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <Typography variant="h4" align="center">
                {`Game ${gameId} has been deleted due to inactivity`}
            </Typography>
            <Toolbar />
            <Button sx={{ margin: 1 }} color="primary" variant="contained" size="large" onClick={() => navigate('/')}>
                Go to Home page
            </Button>
        </Container>
    );
}

export default GameDeleted;
