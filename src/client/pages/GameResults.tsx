import { Button, Divider, Grid, Toolbar, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { MessageType } from 'common/message';

import GameInfoToolbar from '../components/GameInfoToolbar';
import Results from '../components/Results';
import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';
import { isPlayerSpectator } from 'common/Game';

function GameResults() {
    const navigate = useNavigate();
    const { game, gameId, playerId } = useGameInfo();
    const { sendData } = useAppContext();

    useEffect(() => {
        if (!game || !gameId) {
            navigate('/');
        } else if (!game.status.ended) {
            navigate(`/${gameId}/status`);
        }
    });

    const onResumeGame = () => sendData({ type: MessageType.END_GAME, data: { gameId, ended: false } });

    if (!game || !game.status.ended) {
        return null;
    }

    const isSpectator = isPlayerSpectator(game, playerId);

    return (
        <Grid container direction="column" justifyContent="center">
            <GameInfoToolbar game={game} />
            <Divider orientation="horizontal" />
            <Results />
            <Toolbar />
            <Divider orientation="horizontal" />
            <Toolbar />
            {!isSpectator && (
                <Toolbar>
                    <Button fullWidth color="primary" variant="contained" onClick={onResumeGame}>
                        <Typography>Resume Game</Typography>
                    </Button>
                </Toolbar>
            )}
        </Grid>
    );
}

export default GameResults;
