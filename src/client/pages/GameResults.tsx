import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Grid, Toolbar, Typography } from '@material-ui/core';

import { GameJoinStatus } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import GameInfoToolbar from '../components/GameInfoToolbar';
import Results from '../components/Results';
import useAccountInfo from '../hooks/useAccountInfo';

function GameResults() {
    const navigate = useNavigate();
    const { game, gameId, player, playerId } = useAccountInfo();
    const { sendData } = useAppContext();

    useEffect(() => {
        if (!player || !playerId) {
            navigate('/');
        } else if (!game) {
            navigate(`/player/${playerId}/manage-games`);
        } else if (!game.status.ended) {
            navigate(`/player/${playerId}/game`);
        }
    });

    const onResumeGame = () => sendData({ type: MessageType.END_GAME, data: { gameId, ended: false } });

    if (!game || !player || !game.status.ended) {
        return null;
    }

    const isSpectator = player.joinStatus === GameJoinStatus.SPECTATOR;

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
