import React, { MouseEvent, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import isEqual from 'lodash/isEqual';

import {
    Button,
    CircularProgress,
    Divider,
    ExpansionPanel as MuiExpansionPanel,
    ExpansionPanelSummary,
    ExpansionPanelDetails,
    Grid,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Theme,
    Toolbar,
    Typography,
} from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/styles';

import { GameStatus, Phase } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import PlayerSetup from '../components/PlayerSetup';
import StrategyPhase from '../components/StrategyPhase';
import useAccountInfo from '../hooks/useAccountInfo';

const ExpansionPanel = withStyles({
    root: {
        '&$expanded': {
            margin: 0,
        },
    },
    expanded: {},
})(MuiExpansionPanel);

const PHASE_KEYS = Object.keys(Phase);
const STEPS = PHASE_KEYS.slice(PHASE_KEYS.length / 2);

const PHASE_COMPONENTS: React.ComponentType[] = [StrategyPhase];

function getPhaseContents(phase: number) {
    const Component = PHASE_COMPONENTS[phase];
    if (Component) {
        return <Component />;
    }

    return null;
}

const useStyles = makeStyles((theme: Theme) => ({
    stepper: {
        width: '100%',
        padding: theme.spacing(1),
    },
    stepLabelAlternativeLabel: {
        marginTop: theme.spacing(1),
    },
    divider: {
        marginBottom: theme.spacing(1),
        height: 2,
    },
}));

function Game(props: object) {
    const classes = useStyles(props);
    const { sendData } = useAppContext();
    const { gameId, game, playerId } = useAccountInfo();
    const history = useHistory();

    const [statusState, setStatusState] = useState<GameStatus>({
        started: true,
        round: 1,
        phase: Phase.STRATEGY,
        speaker: game ? game.creator : playerId || '',
        pickOrder: [game ? game.creator : playerId || ''],
        pickTurn: 0,
    });
    const [pending, setPending] = useState(false);

    useEffect(() => {
        const { status } = game || {};
        if (!status) {
            return;
        }

        if (!isEqual(status, statusState)) {
            setStatusState({ ...status });
            setPending(false);
        }
    });

    if (!playerId) {
        return null;
    }

    if (!game) {
        history.push(`/player/${playerId}/manage-games`);
        return null;
    }

    const { status, players } = game;
    const player = players[playerId];
    if (!status.started && player.joined) {
        return <PlayerSetup />;
    } else if (!status.started) {
        return null;
    }

    const { round, phase, turn, pickOrder, pickTurn } = statusState;
    const canBack = round > 1 || (round === 1 && phase > Phase.STRATEGY);
    const canNext = round < 10 || (round === 10 && phase < Phase.AGENDA);

    const prevPhase = phase === Phase.STRATEGY ? Phase.AGENDA : phase - 1;
    const nextPhase = phase === Phase.AGENDA ? Phase.STRATEGY : phase + 1;

    const onPhaseClick = (e: MouseEvent<HTMLButtonElement>, next: boolean) => {
        e.stopPropagation();

        if (pending) {
            return;
        }

        const newPhase = next ? nextPhase : prevPhase;

        let newRound = round;
        if (next && phase === Phase.AGENDA) {
            newRound += 1;
        } else if (!next && phase === Phase.STRATEGY) {
            newRound -= 1;
        }

        sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, round: newRound, phase: newPhase } });
        setPending(true);
    };

    const playerTurn = phase === Phase.STRATEGY ? pickOrder[pickTurn] : turn;

    return (
        <Grid container direction="column">
            <Toolbar component={Paper}>
                <Grid container justify="space-between" alignItems="center">
                    <Typography>{`Round: ${round}`}</Typography>
                    <Typography>{`Turn: ${playerTurn}`}</Typography>
                </Grid>
            </Toolbar>
            <ExpansionPanel>
                <ExpansionPanelSummary>
                    <Grid container justify="space-between" alignItems="center">
                        <Button
                            disabled={pending || !canBack}
                            color="primary"
                            variant="contained"
                            onClick={e => onPhaseClick(e, false)}
                        >
                            {pending ? <CircularProgress size="24" /> : `< ${Phase[prevPhase]}`}
                        </Button>
                        <Typography>{`${Phase[phase]}`}</Typography>
                        <Button
                            disabled={pending || !canNext}
                            color="primary"
                            variant="contained"
                            onClick={e => onPhaseClick(e, true)}
                        >
                            {pending ? <CircularProgress size="24" /> : `${Phase[nextPhase]} >`}
                        </Button>
                    </Grid>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Stepper classes={{ root: classes.stepper }} activeStep={phase} alternativeLabel>
                        {STEPS.map(label => (
                            <Step classes={{ alternativeLabel: classes.stepLabelAlternativeLabel }} key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <Divider classes={{ root: classes.divider }} />
            {getPhaseContents(phase)}
        </Grid>
    );
}

export default Game;
