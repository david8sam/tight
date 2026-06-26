import React from 'react';

import { Card, CardContent, Grid, Toolbar } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { GameFaction, getFactionOrder, isPlayerSpectator } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';
import FactionHeader from './FactionHeader';
import RefreshAllbutton from './RefreshAllButton';
import VictoryPoints from './VictoryPoints';

const useStyles = makeStyles()((theme) => ({
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
    const { classes } = useStyles();
    const { game, playerId } = useGameInfo();
    if (!game) {
        return null;
    }

    const factionOrder = getFactionOrder(game);

    return (
        <Grid container direction="column">
            {factionOrder.map((faction: GameFaction) => (
                <Card key={faction.name} variant="outlined" classes={{ root: classes.card }}>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <FactionHeader faction={faction} />
                    </CardContent>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <VictoryPoints factionName={faction.name} disabled={isPlayerSpectator(game, playerId)} />
                    </CardContent>
                </Card>
            ))}
            <Toolbar />
            <RefreshAllbutton />
        </Grid>
    );
}

export default StatusPhase;
