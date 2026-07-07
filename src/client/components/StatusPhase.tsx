import React from 'react';

import { makeStyles } from 'tss-react/mui';

import { GameFaction, getFactionOrder, isPlayerSpectator } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';

import FactionCard from './FactionCard';
import RefreshAllbutton from './RefreshAllButton';
import SpeakerSelect from './SpeakerSelect';
import { Panel } from './ui';
import VictoryPoints from './VictoryPoints';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
        padding: theme.spacing(1.5),
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        flexWrap: 'wrap',
    },
    speaker: {
        flex: 1,
        minWidth: 220,
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
            <Panel className={classes.controls}>
                <SpeakerSelect className={classes.speaker} size="small" disabled={isSpectator} />
                <RefreshAllbutton />
            </Panel>
            {factionOrder.map((faction: GameFaction) => (
                <FactionCard key={faction.name} faction={faction}>
                    <VictoryPoints
                        factionName={faction.name}
                        disabled={isSpectator}
                        AccordionProps={{ className: classes.vpAccordion, elevation: 0 }}
                    />
                </FactionCard>
            ))}
        </div>
    );
}

export default StatusPhase;
