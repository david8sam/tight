import React from 'react';

import { Card, CardContent, Grid, Toolbar } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { GameJoinStatus, GamePlayer, getPlayerOrder } from 'common/Game';

import useAccountInfo from '../hooks/useAccountInfo';
import PlayerHeader from './PlayerHeader';
import RefreshAllbutton from './RefreshAllButton';
import VictoryPoints from './VictoryPoints';

const useStyles = makeStyles(theme => ({
    card: {
        border: `${theme.spacing(0.25)} solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        position: 'relative',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
}));

function StatusPhase() {
    const classes = useStyles();
    const { game, player: currentPlayer } = useAccountInfo();
    if (!game || !currentPlayer) {
        return null;
    }

    const playerOrder = getPlayerOrder(game);

    return (
        <Grid container direction="column">
            {playerOrder.map((player: GamePlayer) => (
                <Card key={player.id} variant="outlined" classes={{ root: classes.card }}>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <PlayerHeader player={player} />
                    </CardContent>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <VictoryPoints
                            playerId={player.id}
                            disabled={currentPlayer.joinStatus === GameJoinStatus.SPECTATOR}
                        />
                    </CardContent>
                </Card>
            ))}
            <Toolbar />
            <RefreshAllbutton />
        </Grid>
    );
}

export default StatusPhase;
