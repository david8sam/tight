import React, { MouseEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import isEqual from 'lodash/isEqual';

import {
    Button,
    CircularProgress,
    Divider,
    AccordionDetails,
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

import { Game, GameStatus, Phase, StrategyCardIndex } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { Accordion, AccordionSummary } from '../components/Accordion';
import PlayerSetup from '../components/PlayerSetup';
import SpeakerSelect from '../components/SpeakerSelect';

import StrategyPhase from '../components/StrategyPhase';
import ActionPhase from '../components/ActionPhase';
import StatusPhase from '../components/StatusPhase';
import AgendaPhase from '../components/AgendaPhase';

import useAccountInfo from '../hooks/useAccountInfo';

const PHASE_KEYS = Object.keys(Phase);
const STEPS = PHASE_KEYS.slice(PHASE_KEYS.length / 2);

const PHASE_COMPONENTS: React.ComponentType[] = [StrategyPhase, ActionPhase, StatusPhase, AgendaPhase];

function getPhaseContents(phase: number) {
    const Component = PHASE_COMPONENTS[phase];
    return Component ? <Component /> : null;
}

function canNextPhase(game: Game): { canNext: boolean; message: string } {
    const { status, players } = game;
    const { phase, custodiansRemoved, agenda1Voted, agenda2Voted } = status;
    const playerArray = Object.values(players);

    let canNext = phase < Phase.AGENDA;
    let message = '';
    if (phase === Phase.STRATEGY) {
        // Make sure everyone has picked a strategy card
        canNext = playerArray.every(
            p => p.strategyCard > StrategyCardIndex.NONE && p.strategyCard < StrategyCardIndex.END,
        );

        message = canNext ? '' : 'Waiting for player to pick...';
    }

    if (phase === Phase.ACTION) {
        // Everyone's turn must be done
        canNext = playerArray.every(p => p.passed);
        message = canNext ? '' : 'Waiting for all players to pass...';
    }

    if (phase === Phase.AGENDA) {
        if (custodiansRemoved) {
            canNext = agenda2Voted;
            message = agenda1Voted ? 'Waiting for second agenda...' : 'Waiting for first agenda...';
        } else {
            canNext = true;
        }
    }

    return { canNext, message };
}

const useStyles = makeStyles((theme: Theme) => ({
    speakerSelect: {
        width: '70%',
    },
    speakerSelectInput: {
        padding: theme.spacing(1),
    },
    statusSummary: {
        padding: `0px ${theme.spacing(1)}`,
    },
    phaseToolbar: {
        minHeight: 0,
    },
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
    const navigate = useNavigate();

    const [statusState, setStatusState] = useState<GameStatus>({
        started: true,
        round: 1,
        phase: Phase.STRATEGY,
        turn: StrategyCardIndex.NONE,
        speaker: game ? game.creator : playerId || '',
        pickOrder: [game ? game.creator : playerId || ''],
        pickTurn: 0,
        custodiansRemoved: false,
        agenda1Voted: false,
        agenda2Voted: false,
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
        navigate(`/player/${playerId}/manage-games`);
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
    const { canNext, message } = canNextPhase(game);

    const prevPhase = phase === Phase.STRATEGY ? Phase.AGENDA : phase - 1;
    const nextPhase = phase === Phase.AGENDA ? Phase.STRATEGY : phase + 1;

    const onPhaseClick = (e: MouseEvent<HTMLButtonElement>, next: boolean) => {
        e.stopPropagation();
        if (pending) {
            return;
        }

        const newPhase = next ? nextPhase : prevPhase;

        sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, phase: newPhase } });
        setPending(true);
    };

    const onStartNextRound = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (pending) {
            return;
        }

        sendData({ type: MessageType.GAME_NEXT_ROUND, data: { gameId } });
        setPending(true);
    };

    let playerTurn = null;
    if (phase === Phase.STRATEGY) {
        playerTurn = pickOrder[pickTurn];
    } else if (turn === StrategyCardIndex.END) {
        playerTurn = 'END';
    } else {
        const player = Object.values(game.players).find(p => p.strategyCard === turn);
        playerTurn = player ? player.name : null;
    }

    let phaseStatus = null;
    if (phase === Phase.AGENDA && round < 10 && canNext) {
        phaseStatus = (
            <Button
                disabled={pending || round === 10 || phase !== Phase.AGENDA}
                color="primary"
                variant="contained"
                onClick={e => onStartNextRound(e)}
            >
                {pending ? <CircularProgress size="24" /> : 'Start Next Round'}
            </Button>
        );
    } else if (message) {
        phaseStatus = <Typography>{message}</Typography>;
    }

    let stepperToolbar = null;
    if (phaseStatus) {
        stepperToolbar = (
            <Toolbar classes={{ root: classes.phaseToolbar }}>
                <Grid container justifyContent="center" alignItems="center">
                    {phaseStatus}
                </Grid>
            </Toolbar>
        );
    }

    return (
        <Grid container direction="column">
            <Accordion expanded={actionExpanded} onChange={() => setActionExpaned(expanded => !expanded)}>
                <AccordionSummary disableMargin classes={{ root: classes.statusSummary }}>
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Typography>{`Turn: ${playerTurn || ''}`}</Typography>
                        <Grid
                            container
                            justifyContent="center"
                            alignItems="center"
                            classes={{ root: classes.phaseActions }}
                        >
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
                </AccordionSummary>
                <AccordionDetails classes={{ root: classes.phaseActionDetails }}>
                    <Grid container direction="column">
                        {stepperToolbar}
                        <Stepper classes={{ root: classes.stepper }} activeStep={phase} alternativeLabel>
                            {STEPS.map(label => (
                                <Step classes={{ alternativeLabel: classes.stepLabelAlternativeLabel }} key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            <Divider classes={{ root: classes.divider }} />
            <Toolbar>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Typography>Speaker:</Typography>
                    <SpeakerSelect
                        className={classes.speakerSelect}
                        classes={{ outlined: classes.speakerSelectInput }}
                    />
                </Grid>
            </Toolbar>
            {getPhaseContents(phase)}
        </Grid>
    );
}

export default Game;
