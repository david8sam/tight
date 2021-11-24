import React, { useState, useEffect } from 'react';
import uniq from 'lodash/uniq';
import { Button, CircularProgress, Grid, Toolbar, Typography } from '@material-ui/core';

import { Game } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import PlayerFactions from './PlayerFactions';
import PlayerOrder from './PlayerOrder';

type SetupStepType = 0 | 1;

const SETUP_STEPS: React.ComponentType<any>[] = [PlayerFactions, PlayerOrder];

function canNext(game: Game): boolean {
    if (!game) {
        return false;
    }

    // Make sure every player has unique selected a color and faction.
    const players = Object.values(game.players);
    const colors = uniq(players.filter(p => Boolean(p.color)).map(p => p.color));
    const factions = uniq(players.filter(p => Boolean(p.faction)).map(p => p.faction));

    return players.length === colors.length && players.length === factions.length;
}

function canStart(game: Game): boolean {
    if (!game) {
        return false;
    }

    const { players, status } = game;
    const { speaker, pickOrder } = status;
    const po = uniq(pickOrder);

    return Boolean(speaker) && po.length === Object.keys(players).length && po.every(p => Boolean(p));
}

function PlayerSetup() {
    const { sendData } = useAppContext();
    const { gameId, game, playerId, player } = useAccountInfo();

    const [starting, setStarting] = useState(false);
    const [step, setStep] = useState<SetupStepType>(0);

    useEffect(() => {
        if (starting && game && game.status.started) {
            setStarting(false);
        }
    });

    if (!game || !player || !playerId) {
        return null;
    }

    const onStartClick = () => {
        const start = !starting;
        setStarting(start);
        sendData({ type: start ? MessageType.START_GAME : MessageType.STOP_GAME, data: { gameId } });
    };

    const SetupComponent = SETUP_STEPS[step];
    let nextLabel = step === 0 ? 'Next >' : 'Start';
    if (starting) {
        nextLabel = 'Cancel';
    }

    const disableNext = step === 0 ? !canNext(game) : starting || !canStart(game);

    return (
        <>
            <Toolbar>
                <Grid container justifyContent="center">
                    <Typography align="center" variant="h6">{`${game.name} (${game.creator})`}</Typography>
                </Grid>
            </Toolbar>
            <Toolbar>
                <Grid container justifyContent="space-between" alignItems="center" wrap="nowrap">
                    <Grid container wrap="nowrap">
                        <Button disabled={step === 0} color="primary" variant="contained" onClick={() => setStep(0)}>
                            {`< Back`}
                        </Button>
                    </Grid>
                    <Grid container justifyContent="flex-end" alignItems="center" spacing={1}>
                        {starting ? (
                            <Grid item>
                                <CircularProgress size={24} />
                            </Grid>
                        ) : null}
                        <Grid item>
                            <Button
                                color="primary"
                                variant="contained"
                                disabled={disableNext}
                                onClick={step === 1 ? onStartClick : () => setStep(1)}
                            >
                                {nextLabel}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Toolbar>
            {SetupComponent ? <SetupComponent disabled={starting} /> : null}
        </>
    );
}

export default PlayerSetup;
