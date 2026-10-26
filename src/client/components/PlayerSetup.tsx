import { Box, Button, CircularProgress, Grid, Toolbar, Typography } from '@mui/material';
import React from 'react';

import { GameClientData } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

import { COLOR_NONE } from './ColorSelect';
import { FACTION_NONE } from './FactionSelect';
import FactionsSetup from './FactionsSetup';
import GameInfoToolbar from './GameInfoToolbar';

function canStart(game: GameClientData): boolean {
    const { numPlayers } = game;

    // Make sure all factions are set and every faction and color is unique.
    const factions = game.factions;
    const factionsSet = new Set(factions.map(f => f.name));
    if (factionsSet.has(FACTION_NONE) || factionsSet.size !== numPlayers) {
        return false;
    }

    const colorSet = new Set(factions.map(f => f.color));
    if (colorSet.has(COLOR_NONE) || colorSet.size !== numPlayers) {
        return false;
    }

    return true;
}

function PlayerSetup() {
    const {
        sendData,
        state: { pendingCommands },
    } = useAppContext();
    const { gameId, game, playerId, isHost } = useGameInfo();

    const pending = pendingCommands > 0;

    if (!game) {
        return null;
    }

    const onStartClick = () => {
        if (pending) return;
        const speaker = game.factions[0].name;
        const pickOrder = game.factions.map(f => f.name);
        sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, pickOrder, speaker } });
        sendData({ type: MessageType.START_GAME, data: { gameId } });
    };

    const isSpectator = !isHost;
    const factionsHavePlayers = game.factions.some(f => f.playerIds.length > 0);

    return (
        <>
            <Box sx={{ display: { xs: 'block', md: 'flex' }, alignItems: 'center' }}>
                <GameInfoToolbar
                    game={game}
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        minHeight: { md: 40 },
                        '& .MuiIconButton-root': { minWidth: { md: 44 }, minHeight: { md: 44 }, p: { md: 0.5 } },
                        '& > .MuiButton-root': { whiteSpace: 'nowrap', flexShrink: 0 },
                    }}
                />
                <Toolbar
                    sx={{ minHeight: { md: 40 }, flexShrink: 0, '& .MuiGrid-container': { width: { md: 'auto' } } }}
                >
                    <Grid container flexDirection="row" alignItems="center" wrap="nowrap">
                        <Grid container justifyContent="flex-start" alignItems="center" spacing={1}>
                            {!factionsHavePlayers ? (
                                <Typography color="red">Must assign at least one player</Typography>
                            ) : null}
                        </Grid>
                        <Grid container justifyContent="flex-end" alignItems="center" spacing={1}>
                            {pending ? (
                                <Grid item>
                                    <CircularProgress aria-label="Saving changes" size={24} />
                                </Grid>
                            ) : null}
                            <Grid item>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    disabled={isSpectator || pending || !canStart(game)}
                                    onClick={onStartClick}
                                >
                                    Start
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Toolbar>
            </Box>
            <FactionsSetup />
        </>
    );
}

export default PlayerSetup;
