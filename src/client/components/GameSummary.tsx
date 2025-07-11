import { Box, Divider, Typography, useTheme } from '@mui/material';
import React, { ReactElement } from 'react';

import { calculateVictoryPoints } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';
import { getFactionColors } from '../utils/faction';
import TextWithTooltip from './TextWithTooltip';

export default function GameSummary(): ReactElement | null {
    const theme = useTheme();
    const { game } = useGameInfo();
    if (!game) {
        return null;
    }

    const { factions, numRounds, numVictoryPoints } = game;

    const vpMap = factions.reduce((r, f) => {
        r[f.name] = calculateVictoryPoints(game, f.name);
        return r;
    }, {} as Record<string, number>);

    // Sort by VP
    const leaderboard = [...factions].sort((a, b) => {
        const result = vpMap[b.name] - vpMap[a.name];
        return result === 0 ? a.strategyCard - b.strategyCard : result;
    });

    return (
        <Box display="flex" flexDirection="column" width="100%">
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>{`Rounds: ${numRounds}`}</Typography>
                <Typography>{`VP to win: ${numVictoryPoints}`}</Typography>
            </Box>
            {game.status.started && (
                <>
                    <Divider sx={{ margin: `${theme.spacing()} 0px` }} />
                    {leaderboard.map(f => (
                        <TextWithTooltip
                            key={f.name}
                            text={`${f.name}: ${vpMap[f.name]} VP `}
                            title={f.name}
                            style={getFactionColors(theme, f)}
                            sx={{ padding: 1 }}
                        />
                    ))}
                </>
            )}
        </Box>
    );
}
