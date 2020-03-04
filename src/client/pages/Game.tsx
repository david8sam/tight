import React, { MouseEvent, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import isEqual from 'lodash/isEqual';

import {
    Button,
    CircularProgress,
    Divider,
    ExpansionPanelDetails,
    Grid,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Theme,
    Toolbar,
    Typography,
    Tooltip,
} from '@material-ui/core';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { makeStyles } from '@material-ui/styles';

import { GameStatus, Phase, StrategyCardIndex } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { ExpansionPanel, ExpansionPanelSummary } from '../components/ExpansionPanel';
import PlayerSetup from '../components/PlayerSetup';

import StrategyPhase from '../components/StrategyPhase';
import ActionPhase from '../components/ActionPhase';

import useAccountInfo from '../hooks/useAccountInfo';

const PHASE_KEYS = Object.keys(Phase);
const STEPS = PHASE_KEYS.slice(PHASE_KEYS.length / 2);

const PHASE_COMPONENTS: React.ComponentType[] = [StrategyPhase, ActionPhase];

function getPhaseContents(phase: number) {
    const Component = PHASE_COMPONENTS[phase];
    if (Component) {
        return <Component />;
    }

    return null;
}

const useStyles = makeStyles((theme: Theme) => ({
    phaseActionDetails: {
        padding: 0,
    },
    phaseStepPanel: {
        width: '100%',
    },
    phaseActions: {
        width: 'auto',
    },
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
        turn: StrategyCardIndex.NONE,
        passed: [],
        speaker: game ? game.creator : playerId || '',
        pickOrder: [game ? game.creator : playerId || ''],
        pickTurn: 0,
    });
    const [pending, setPending] = useState(false);
    const [actionExpanded, setActionExpaned] = useState(false);

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

    let playerTurn = null;
    if (phase === Phase.STRATEGY) {
        playerTurn = pickOrder[pickTurn];
    } else {
        const player = Object.values(game.players).find(p => p.strategyCard === turn);
        playerTurn = player ? player.name : null;
    }

    return (
        <Grid container direction="column">
            <ExpansionPanel expanded={actionExpanded} onChange={() => setActionExpaned(expanded => !expanded)}>
                <ExpansionPanelSummary disableMargin>
                    <Grid container justify="space-between" alignItems="center">
                        <Typography>{`Turn: ${playerTurn || ''}`}</Typography>
                        <Grid container justify="center" alignItems="center" classes={{ root: classes.phaseActions }}>
                            <Tooltip title={Phase[prevPhase]}>
                                <span>
                                    <IconButton
                                        disabled={pending || !canBack || phase === Phase.STRATEGY}
                                        onClick={e => onPhaseClick(e, false)}
                                    >
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            {pending ? <CircularProgress size="24" /> : <Typography>{`${Phase[phase]}`}</Typography>}
                            <Tooltip title={Phase[nextPhase]}>
                                <span>
                                    <IconButton
                                        disabled={pending || !canNext || phase === Phase.AGENDA}
                                        onClick={e => onPhaseClick(e, true)}
                                    >
                                        <NavigateNextIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                        <Typography>{`Round: ${round}`}</Typography>
                    </Grid>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails classes={{ root: classes.phaseActionDetails }}>
                    <Grid container direction="column">
                        <Toolbar>
                            <Grid container justify="center" alignItems="center">
                                <Button
                                    disabled={pending || !canNext || phase !== Phase.AGENDA}
                                    color="primary"
                                    variant="contained"
                                    onClick={e => onPhaseClick(e, true)}
                                >
                                    {pending ? <CircularProgress size="24" /> : 'Start Next Round'}
                                </Button>
                            </Grid>
                        </Toolbar>
                        <Stepper classes={{ root: classes.stepper }} activeStep={phase} alternativeLabel>
                            {STEPS.map(label => (
                                <Step classes={{ alternativeLabel: classes.stepLabelAlternativeLabel }} key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Grid>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <Divider classes={{ root: classes.divider }} />
            {getPhaseContents(phase)}
        </Grid>
    );
}

export default Game;
