import React, { ReactElement } from 'react';

import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { calculateVictoryPoints, formatFactionName } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';

import { FactionColorChip, StatPill } from './ui';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.75),
        width: '100%',
        minWidth: 220,
    },
    header: {
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing(1),
        paddingBottom: theme.spacing(0.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    place: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 11,
        color: theme.palette.text.disabled,
        width: 16,
        textAlign: 'right',
        flexShrink: 0,
    },
    faction: {
        flex: 1,
        minWidth: 0,
        fontSize: 12.5,
    },
    vp: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
    },
    vpUnit: {
        fontSize: 10.5,
        color: theme.palette.text.disabled,
        fontWeight: 400,
    },
}));

export default function GameSummary(): ReactElement | null {
    const { classes } = useStyles();
    const theme = useTheme();
    const { game } = useGameInfo();
    if (!game) {
        return null;
    }

    const { factions, numRounds, numVictoryPoints } = game;

    const vpMap = factions.reduce(
        (r, f) => {
            r[f.name] = calculateVictoryPoints(game, f.name);
            return r;
        },
        {} as Record<string, number>,
    );

    // Sort by VP
    const leaderboard = game.status.started
        ? [...factions].sort((a, b) => {
              const result = vpMap[b.name] - vpMap[a.name];
              return result === 0 ? a.strategyCard - b.strategyCard : result;
          })
        : [];

    return (
        <div className={classes.root}>
            <div className={classes.header}>
                <StatPill size="small">{numRounds} rounds</StatPill>
                <StatPill size="small" color={theme.palette.primary.main}>
                    {numVictoryPoints} VP to win
                </StatPill>
            </div>
            {leaderboard.map((f, i) => (
                <div key={f.name} className={classes.row}>
                    <span className={classes.place}>{i + 1}</span>
                    <FactionColorChip className={classes.faction} faction={f} label={formatFactionName(game, f.name)} />
                    <span className={classes.vp}>
                        {vpMap[f.name]} <span className={classes.vpUnit}>VP</span>
                    </span>
                </div>
            ))}
        </div>
    );
}
