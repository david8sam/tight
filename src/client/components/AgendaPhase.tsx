import React, { useState } from 'react';

import { Button, Checkbox, FormControlLabel, FormGroup, Switch, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { calculateVictoryPoints, isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

import GameSummary from './GameSummary';
import RefreshAllbutton from './RefreshAllButton';
import { Panel, SectionHeader } from './ui';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
        padding: theme.spacing(1.5),
    },
    panel: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.75),
    },
    summary: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    winners: {
        textAlign: 'center',
    },
}));

export default function AgendaPhase() {
    const { classes } = useStyles();
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
        <div className={classes.root}>
            <Panel className={classes.panel}>
                <SectionHeader>Agenda</SectionHeader>
                <FormControlLabel
                    disabled={isSpectator}
                    control={<Switch checked={custodiansRemoved} onChange={onCustodiansRemoved} color="primary" />}
                    label="Mecatol Rex Custodians Removed?"
                />
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
            </Panel>

            <RefreshAllbutton />

            <Panel className={classes.summary}>
                <SectionHeader>Summary</SectionHeader>
                <GameSummary />
            </Panel>

            {canEndEarly && (
                <Panel className={classes.panel}>
                    {winners ? (
                        <Typography className={classes.winners} variant="h6">
                            {`${winners} ${factionsAtVp.length === 1 ? 'has' : 'have'} at least ${
                                game.numVictoryPoints
                            } VPs`}
                        </Typography>
                    ) : (
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
                    )}
                    <Button
                        disabled={!endGameEarly && !winners}
                        color="primary"
                        variant="contained"
                        fullWidth
                        onClick={onEndGame}
                    >
                        End Game
                    </Button>
                </Panel>
            )}
        </div>
    );
}
