import React from 'react';
import { Button, Container, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <Container sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <Typography variant="h4" align="center">
                Page not found
            </Typography>
            <Toolbar />
            <Button variant="contained" size="large" onClick={() => navigate('/')}>
                Go to Home page
            </Button>
        </Container>
    );
}
