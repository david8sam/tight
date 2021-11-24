import React from 'react';

import { Card, CardContent, Divider, Grid, Theme, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { calculateVictoryPoints, GamePlayer } from 'common/Game';

import useAccountInfo from '../hooks/useAccountInfo';
import PlayerHeader from './PlayerHeader';
import VictoryPoints from './VictoryPoints';

const EMOJI_PARTY_POPPER = String.fromCodePoint(0x1f389);

const useStyles = makeStyles((theme: Theme) => ({
    card: {
        border: `${theme.spacing(0.25)}px solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)}px ${theme.spacing(1)}px`,
        position: 'relative',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
    emoji: {
        fontSize: 24,
    },
    flipX: {
        transform: `scale(-1, 1)`,
    },
    winnerGrid: {
        width: 'calc(100% - 100px)', // Save space for emojis
        overflowWrap: 'anywhere',
    },
}));

function Results() {
    const classes = useStyles();
    const { game } = useAccountInfo();
    if (!game) {
        return null;
    }

    const playerOrder = Object.values(game.players).sort((p1: GamePlayer, p2: GamePlayer) => {
        const vp1 = calculateVictoryPoints(game, p1.id);
        const vp2 = calculateVictoryPoints(game, p2.id);

        // Order by highest victory points
        const result = vp2 - vp1;

        // For ties, player with lower initiative ranks higher.
        return result === 0 ? p1.strategyCard - p2.strategyCard : result;
    });

    return (
        <Grid container direction="column">
            <Toolbar>
                <Grid container direction="row" justifyContent="space-around" alignItems="center">
                    <span className={classes.emoji}>{EMOJI_PARTY_POPPER}</span>
                    <Grid
                        container
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        className={classes.winnerGrid}
                    >
                        <Typography variant="h6">The Winner is</Typography>
                        <Typography variant="h4">{playerOrder[0].id}</Typography>
                    </Grid>
                    <span className={classes.emoji + ' ' + classes.flipX}>{EMOJI_PARTY_POPPER}</span>
                </Grid>
            </Toolbar>
            <Divider orientation="horizontal" />
            <Toolbar />
            {playerOrder.map((player: GamePlayer) => (
                <Card key={player.id} variant="outlined" classes={{ root: classes.card }}>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <PlayerHeader player={player} />
                    </CardContent>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <Toolbar disableGutters>
                            <Grid container direction="row" justifyContent="center" alignItems="center">
                                <VictoryPoints playerId={player.id} allowShowSecret />
                            </Grid>
                        </Toolbar>
                    </CardContent>
                </Card>
            ))}
        </Grid>
    );
}

export default Results;
