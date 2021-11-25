import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Divider, Grid, Toolbar, Typography } from '@material-ui/core';

import { GameJoinStatus } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
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

    const onContinueGame = () => sendData({ type: MessageType.END_GAME, data: { gameId, ended: false } });

    if (!game || !player || !game.status.ended) {
        return null;
    }

    return (
        <Grid container direction="column" justifyContent="center">
            <Results />
            <Toolbar />
            <Divider orientation="horizontal" />
            <Toolbar />
            <Toolbar>
                <Button
                    fullWidth
                    color="primary"
                    variant="contained"
                    onClick={onContinueGame}
                    disabled={player.joinStatus === GameJoinStatus.SPECTATOR}
                >
                    <Typography>Continue Game</Typography>
                </Button>
            </Toolbar>
        </Grid>
    );
}

export default GameResults;
