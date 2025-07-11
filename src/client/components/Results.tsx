import React from 'react';

import { Card, CardContent, Divider, Grid, Toolbar, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { GameFaction, calculateVictoryPoints, isPlayerSpectator } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';
import FactionHeader from './FactionHeader';
import VictoryPoints from './VictoryPoints';

const EMOJI_PARTY_POPPER = String.fromCodePoint(0x1f389);

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
    const { game, playerId } = useGameInfo();
    if (!game) {
        return null;
    }

    const factionOrder = [...game.factions].sort((f1: GameFaction, f2: GameFaction) => {
        const vp1 = calculateVictoryPoints(game, f1.name);
        const vp2 = calculateVictoryPoints(game, f2.name);

        // Order by highest victory points
        const result = vp2 - vp1;

        // For ties, faction with lower initiative ranks higher.
        return result === 0 ? f1.strategyCard - f2.strategyCard : result;
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
                        <Typography align="center" variant="h6">
                            Our New Space Emperor is
                        </Typography>
                        <Typography align="center" variant="h4">
                            {factionOrder[0].name}
                        </Typography>
                        <Typography align="center" variant="h6">
                            {`(${factionOrder[0].playerIds.join(', ')})`}
                        </Typography>
                    </Grid>
                    <span className={classes.emoji + ' ' + classes.flipX}>{EMOJI_PARTY_POPPER}</span>
                </Grid>
            </Toolbar>
            <Divider orientation="horizontal" />
            <Toolbar />
            {factionOrder.map((faction: GameFaction) => (
                <Card key={faction.name} variant="outlined" classes={{ root: classes.card }}>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <FactionHeader faction={faction} />
                    </CardContent>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <VictoryPoints
                            factionName={faction.name}
                            allowShowSecret
                            disabled={isPlayerSpectator(game, playerId) || game.status.ended}
                        />
                    </CardContent>
                </Card>
            ))}
        </Grid>
    );
}

export default Results;
