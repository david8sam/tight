import React from 'react';

import { Toolbar } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { GameFaction, getFactionOrder, isPlayerSpectator } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';

import FactionCard from './FactionCard';
import RefreshAllbutton from './RefreshAllButton';
import VictoryPoints from './VictoryPoints';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: theme.spacing(1.25),
        padding: theme.spacing(1.5),
    },
    refresh: {
        gridColumn: '1 / -1',
    },
    vpAccordion: {
        backgroundColor: 'rgba(0,0,0,0)',
        '&::before': {
            backgroundColor: 'rgba(0,0,0,0)',
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
    const isSpectator = isPlayerSpectator(game, playerId);

    return (
        <div className={classes.root}>
            {factionOrder.map((faction: GameFaction) => (
                <FactionCard key={faction.name} faction={faction}>
                    <VictoryPoints
                        factionName={faction.name}
                        disabled={isSpectator}
                        AccordionProps={{ className: classes.vpAccordion, elevation: 0 }}
                    />
                </FactionCard>
            ))}
            <Toolbar className={classes.refresh} disableGutters>
                <RefreshAllbutton />
            </Toolbar>
        </div>
    );
}

export default StatusPhase;
