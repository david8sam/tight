import React, { MouseEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import isEqual from 'lodash/isEqual';

import {
    Button,
    CircularProgress,
    Grid,
    IconButton,
    makeStyles,
    Stepper,
    Step,
    StepLabel,
    Toolbar,
    Typography,
    Tooltip,
    Paper,
    AppBar,
} from '@material-ui/core';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

import { Game, GameJoinStatus, GameStatus, getPlayersInGame, Phase, StrategyCardIndex } from 'common/Game';
import { MessageType } from 'common/message';

import { HEADER_HEIGHT } from '../constants';
import { useAppContext } from '../Context';
import { Accordion, AccordionDetails, AccordionSummary } from '../components/Accordion';
import GameInfoToolbar from '../components/GameInfoToolbar';
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
    const { status } = game;
    const { phase, custodiansRemoved, agenda1Voted, agenda2Voted } = status;
    const playerArray = getPlayersInGame(game);

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
            if (!agenda2Voted) {
                message = agenda1Voted ? 'Waiting for second agenda...' : 'Waiting for first agenda...';
            }
        } else {
            canNext = true;
        }
    }

    return { canNext, message };
}

const useStyles = makeStyles(theme => ({
    appBar: {
        top: HEADER_HEIGHT,
    },
    speakerToolbar: {
        margin: `${theme.spacing(2)}px 0px`,
    },
    statusAccordion: {
        width: '100%', // TODO: Why is this necessary? Pixel width doesn't actually change...
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
    stepper: {
        width: '100%',
        padding: theme.spacing(1),
    },
    stepLabelAlternativeLabel: {
        marginTop: theme.spacing(1),
    },
}));

function Game() {
    const classes = useStyles();
    const { sendData } = useAppContext();
    const { gameId, game, player, playerId } = useAccountInfo();
    const navigate = useNavigate();

    const [statusState, setStatusState] = useState<GameStatus>({
        setupStep: 0,
        started: true,
        ended: false,
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
        if (!game) {
            navigate(`/player/${playerId}/manage-games`);
        } else if (game.status.ended) {
            navigate(`/player/${playerId}/game-results`);
        }
    });

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

    if (!game || game.status.ended || !player || !playerId) {
        return null;
    }

    const { status } = game;
    if (!status.started) {
        return <PlayerSetup />;
    }

    const isSpectator = player.joinStatus === GameJoinStatus.SPECTATOR;

    const { round, phase } = statusState;
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

    const onEndGame = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (pending) {
            return;
        }

        sendData({ type: MessageType.END_GAME, data: { gameId } });
        setPending(true);
    };

    let phaseStatus = null;
    if (message) {
        phaseStatus = <Typography>{message}</Typography>;
    } else if (phase === Phase.AGENDA) {
        if (round === game.numRounds) {
            phaseStatus = (
                <Button disabled={isSpectator} color="primary" variant="contained" onClick={onEndGame}>
                    {pending ? <CircularProgress size="24" /> : 'End Game'}
                </Button>
            );
        } else if (canNext) {
            phaseStatus = (
                <Button
                    disabled={isSpectator || pending || phase !== Phase.AGENDA}
                    color="primary"
                    variant="contained"
                    onClick={e => onStartNextRound(e)}
                >
                    {pending ? <CircularProgress size="24" /> : 'Start Next Round'}
                </Button>
            );
        }
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
        <>
            <AppBar className={classes.appBar} color="inherit" position="sticky">
                <Paper>
                    <GameInfoToolbar game={game} />
                </Paper>
                <Accordion
                    className={classes.statusAccordion}
                    disableMargin
                    expanded={actionExpanded}
                    onChange={(_e, expanded) => setActionExpaned(expanded)}
                >
                    <AccordionSummary disableMargin classes={{ root: classes.statusSummary }}>
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Tooltip title={Phase[prevPhase]}>
                                <span>
                                    <IconButton
                                        disabled={isSpectator || pending || !canBack || phase === Phase.STRATEGY}
                                        onClick={e => onPhaseClick(e, false)}
                                    >
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            {pending ? (
                                <CircularProgress size="24" />
                            ) : (
                                <Typography align="center">{`${Phase[phase]}`}</Typography>
                            )}
                            <Tooltip title={Phase[nextPhase]}>
                                <span>
                                    <IconButton
                                        disabled={isSpectator || pending || !canNext || phase === Phase.AGENDA}
                                        onClick={e => onPhaseClick(e, true)}
                                    >
                                        <NavigateNextIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
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
            </AppBar>
            <Grid container direction="column">
                <Toolbar className={classes.speakerToolbar}>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item xs={3}>
                            <Typography>Speaker:</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <SpeakerSelect fullWidth disabled={isSpectator} />
                        </Grid>
                    </Grid>
                </Toolbar>
                {getPhaseContents(phase)}
            </Grid>
        </>
    );
}

export default Game;
