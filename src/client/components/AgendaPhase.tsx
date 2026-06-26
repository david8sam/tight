import React, { useState } from 'react';

import {
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    FormGroup,
    Grid,
    Switch,
    Toolbar,
    Typography,
} from '@mui/material';

import { calculateVictoryPoints, isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import RefreshAllbutton from './RefreshAllButton';
import GameSummary from './GameSummary';

export default function AgendaPhase() {
    const { sendData } = useAppContext();
    const [endGameEarly, setEndGameEarly] = useState(false);
    const { game, gameId, playerId } = useGameInfo();

    if (!game) {
        return null;
    }

    const onCustodiansRemoved = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const data: Record<string, unknown> = { gameId, custodiansRemoved: e.target.checked };
        if (!e.target.checked) {
            data.agenda1Voted = false;
            data.agenda2Voted = false;
        }

        sendData({ type: MessageType.GAME_SET_CUSTODIANS_REMOVED, data });
    };

    const onAgendaVoted = (e: React.ChangeEvent<HTMLInputElement>, first: boolean): void => {
        const data: Record<string, unknown> = { gameId };
        if (first) {
            data.agenda1Voted = e.target.checked;
            if (!e.target.checked) {
                data.agenda2Voted = false;
            }
        } else {
            data.agenda2Voted = e.target.checked;
        }
        sendData({ type: MessageType.GAME_SET_AGENDA_VOTED, data });
    };

    const onEndGame = () => {
        sendData({ type: MessageType.END_GAME, data: { gameId } });
    };

    const {
        factions,
        status: { custodiansRemoved, agenda1Voted, agenda2Voted, round },
        numRounds,
    } = game;

    const isSpectator = isPlayerSpectator(game, playerId);
    const canEndEarly = round < numRounds && !isSpectator;

    const factionsAtVp = factions.filter(f => calculateVictoryPoints(game, f.name) >= game.numVictoryPoints);
    const winners = factionsAtVp.length ? factionsAtVp.map(f => f.name).join(', ') : '';

    return (
        <Grid container direction="column">
            <Toolbar>
                <FormControlLabel
                    disabled={isSpectator}
                    control={<Switch checked={custodiansRemoved} onChange={onCustodiansRemoved} color="primary" />}
                    label="Mecatol Rex Custodians Removed?"
                />
            </Toolbar>
            <Toolbar>
                <FormGroup>
                    <FormControlLabel
                        disabled={isSpectator || !custodiansRemoved}
                        control={
                            <Checkbox checked={agenda1Voted} onChange={e => onAgendaVoted(e, true)} color="primary" />
                        }
                        label="First Agenda"
                    />
                    <FormControlLabel
                        disabled={isSpectator || !agenda1Voted}
                        control={
                            <Checkbox checked={agenda2Voted} onChange={e => onAgendaVoted(e, false)} color="primary" />
                        }
                        label="Second Agenda"
                    />
                </FormGroup>
            </Toolbar>
            <Toolbar />
            <RefreshAllbutton />
            <Divider orientation="horizontal" />
            <Toolbar sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography display="flex" justifyContent="center" width="100%" variant="h5">
                    Summary
                </Typography>
                <GameSummary />
            </Toolbar>
            {canEndEarly && (
                <>
                    <Toolbar />
                    <Divider orientation="horizontal" sx={{ marginTop: 1 }} />
                    <Toolbar />
                    <Toolbar>
                        <Grid container direction="column" spacing={2}>
                            {winners && (
                                <Grid>
                                    <Typography variant="h5">{`${winners} ${
                                        factionsAtVp.length === 1 ? 'has' : 'have'
                                    } at least ${game.numVictoryPoints} VPs`}</Typography>
                                </Grid>
                            )}
                            {!winners && (
                                <Grid>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={endGameEarly}
                                                onChange={e => setEndGameEarly(e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label="End Game Early?"
                                    />
                                </Grid>
                            )}
                            <Grid>
                                <Button
                                    disabled={!endGameEarly && !winners}
                                    color="primary"
                                    variant="contained"
                                    fullWidth
                                    onClick={onEndGame}
                                >
                                    <Typography>End Game</Typography>
                                </Button>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </>
            )}
        </Grid>
    );
}
