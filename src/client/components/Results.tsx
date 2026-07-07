import React from 'react';

import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { GameFaction, calculateVictoryPoints, isPlayerSpectator } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';
import { getFactionColors } from '../utils/faction';

import FactionCard from './FactionCard';
import FactionSigil from './FactionSigil';
import { Panel, SectionHeader, StatPill } from './ui';
import VictoryPoints from './VictoryPoints';

const EMOJI_PARTY_POPPER = String.fromCodePoint(0x1f389);

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
    },
    winner: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: theme.spacing(1),
        padding: theme.spacing(3, 2),
    },
    winnerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
    },
    emoji: {
        fontSize: 22,
    },
    flipX: {
        transform: 'scale(-1, 1)',
    },
    winnerName: {
        overflowWrap: 'anywhere',
    },
    winnerPlayers: {
        color: theme.palette.text.secondary,
    },
    vpAccordion: {
        backgroundColor: 'rgba(0,0,0,0)',
        '&::before': {
            backgroundColor: 'rgba(0,0,0,0)',
        },
    },
}));

function Results() {
    const { classes } = useStyles();
    const theme = useTheme();
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

    const winner = factionOrder[0];
    const winnerColors = getFactionColors(theme, winner);
    const disabled = isPlayerSpectator(game, playerId) || game.status.ended;

    return (
        <div className={classes.root}>
            <Panel className={classes.winner} accent={winnerColors.readable} glow>
                <SectionHeader>Our new Space Emperor is</SectionHeader>
                <div className={classes.winnerTitle}>
                    <span className={classes.emoji}>{EMOJI_PARTY_POPPER}</span>
                    <FactionSigil name={winner.name} size={40} tint={winnerColors.tint} />
                    <span className={`${classes.emoji} ${classes.flipX}`}>{EMOJI_PARTY_POPPER}</span>
                </div>
                <Typography className={classes.winnerName} variant="h4" style={{ color: winnerColors.readable }}>
                    {winner.name}
                </Typography>
                {winner.playerIds.length > 0 && (
                    <Typography className={classes.winnerPlayers} variant="h6">
                        {`(${winner.playerIds.join(', ')})`}
                    </Typography>
                )}
            </Panel>

            {factionOrder.map((faction: GameFaction, i) => (
                <FactionCard
                    key={faction.name}
                    faction={faction}
                    statusPill={
                        <StatPill size="small" color={i === 0 ? theme.game.speaker : undefined}>
                            {i + 1}
                            {['st', 'nd', 'rd'][i] ?? 'th'} place
                        </StatPill>
                    }
                >
                    <VictoryPoints
                        factionName={faction.name}
                        allowShowSecret
                        disabled={disabled}
                        AccordionProps={{ className: classes.vpAccordion, elevation: 0 }}
                    />
                </FactionCard>
            ))}
        </div>
    );
}

export default Results;
