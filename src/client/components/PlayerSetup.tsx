import { Button, CircularProgress, Grid, Toolbar } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { GameClientData, isPlayerSpectator } from 'common/Game';
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
    const { sendData } = useAppContext();
    const { gameId, game, playerId } = useGameInfo();

    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (!pending || !game) {
            return;
        }

        if (game.status.started) {
            // Reset pending when game has started
            setPending(false);
        }
    });

    if (!game) {
        return null;
    }

    const onStartClick = () => {
        const start = !pending;
        setPending(!pending);

        if (start) {
            const speaker = game.factions[0].name;
            const pickOrder = game.factions.map(f => f.name);
            sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, pickOrder, speaker } });
        }

        sendData({ type: start ? MessageType.START_GAME : MessageType.STOP_GAME, data: { gameId } });
    };

    const isSpectator = isPlayerSpectator(game, playerId);

    return (
        <>
            <GameInfoToolbar game={game} />
            <Toolbar>
                <Grid container flexDirection="column" alignItems="center">
                    <Grid container justifyContent="flex-end" alignItems="center" spacing={1}>
                        {pending ? (
                            <Grid>
                                <CircularProgress size={24} />
                            </Grid>
                        ) : null}
                        <Grid>
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
            {!pending ? <FactionsSetup /> : null}
        </>
    );
}

export default PlayerSetup;
