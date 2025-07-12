import { Button, Divider, Grid, Toolbar, Typography } from '@mui/material';
import confetti from 'canvas-confetti';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import GameInfoToolbar from '../components/GameInfoToolbar';
import Results from '../components/Results';
import useGameInfo from '../hooks/useGameInfo';

function GameResults() {
    // Only calling for the rerender. There is a bug where the returned location is stale.
    useLocation();

    const navigate = useNavigate();
    const { game, gameId, playerId } = useGameInfo();
    const { sendData } = useAppContext();
    const animationIdRef = useRef(0);

    const url = window.location.pathname;
    useEffect(() => {
        if (url !== `/${gameId}/results`) {
            if (animationIdRef.current) {
                window.clearInterval(animationIdRef.current);
            }
            return;
        }

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
            });
        };

        animationIdRef.current = window.setInterval(frame, 100);
        return () => window.clearInterval(animationIdRef.current);
    }, [url]);

    useEffect(() => {
        if (!game || !gameId) {
            navigate('/');
        } else if (!game.status.ended) {
            navigate(`/${gameId}/status`);
        }
    }, [game, gameId, game?.status.ended]);

    const onResumeGame = () => {
        window.clearInterval(animationIdRef.current);
        sendData({ type: MessageType.END_GAME, data: { gameId, ended: false } });
    };

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
