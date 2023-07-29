import React, { useState, useEffect } from 'react';
import uniq from 'lodash/uniq';
import { Button, CircularProgress, Grid, Toolbar } from '@material-ui/core';

import { Game, GameJoinStatus, GameSetupStep, getPlayersInGame } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import PlayerFactions from './PlayerFactions';
import PlayerOrder from './PlayerOrder';
import GameInfoToolbar from './GameInfoToolbar';

const SETUP_STEPS: React.ComponentType<any>[] = [PlayerOrder, PlayerFactions];

function canNext(game: Game): boolean {
    if (!game) {
        return false;
    }

    const { status } = game;
    const { speaker, pickOrder } = status;
    const po = uniq(pickOrder);
    const players = getPlayersInGame(game);

    return Boolean(speaker) && po.length === Object.keys(players).length && po.every(p => Boolean(p));
}

function canStart(game: Game): boolean {
    if (!game || !canNext(game)) {
        return false;
    }

    // Make sure every player has unique selected a color and faction.
    const players = getPlayersInGame(game);
    const colors = uniq(players.filter(p => Boolean(p.color)).map(p => p.color));
    const factions = uniq(players.filter(p => Boolean(p.faction)).map(p => p.faction));

    return players.length === colors.length && players.length === factions.length;
}

function PlayerSetup() {
    const { sendData } = useAppContext();
    const { gameId, game, player, playerId } = useAccountInfo();

    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (!pending || !game) {
            return;
        }

        if (!game.status.started && game.status.setupStep === GameSetupStep.FACTION) {
            // Moved to next step
            setPending(false);
        } else if (game.status.started) {
            // Game has stared
            setPending(false);
        }
    });

    if (!game || !player || !playerId) {
        return null;
    }

    const step = game.status.setupStep;

    const onSetupStepChange = (setupStep: GameSetupStep) => {
        setPending(!pending);
        sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, setupStep } });
    };

    const onStartClick = () => {
        const start = !pending;
        setPending(!pending);
        sendData({ type: start ? MessageType.START_GAME : MessageType.STOP_GAME, data: { gameId } });
    };

    const SetupComponent = SETUP_STEPS[step];
    let nextLabel = step === 0 ? 'Next' : 'Start';
    if (pending && step === 1) {
        nextLabel = 'Cancel';
    }

    const disableNext = step === 0 ? !canNext(game) : pending || !canStart(game);
    const isSpectator = player.joinStatus === GameJoinStatus.SPECTATOR;

    return (
        <>
            <GameInfoToolbar game={game} />
            <Toolbar>
                <Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
                    {step > 0 && (
                        <Grid container wrap="nowrap">
                            <Button color="primary" variant="contained" onClick={() => onSetupStepChange(0)}>
                                {`Back`}
                            </Button>
                        </Grid>
                    )}
                    <Grid container justifyContent="flex-end" alignItems="center" spacing={1}>
                        {pending ? (
                            <Grid item>
                                <CircularProgress size={24} />
                            </Grid>
                        ) : null}
                        <Grid item>
                            <Button
                                color="primary"
                                variant="contained"
                                disabled={disableNext || isSpectator || (pending && step === 0)}
                                onClick={step === 1 ? onStartClick : () => onSetupStepChange(1)}
                            >
                                {nextLabel}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Toolbar>
            {SetupComponent ? <SetupComponent disabled={pending} /> : null}
        </>
    );
}

export default PlayerSetup;
