import React, { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isEqual } from 'lodash-es';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
    AppBar,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Step,
    StepLabel,
    Stepper,
    Toolbar,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    Game,
    GameClientData,
    GameStatus,
    getFactionTurn,
    isPlayerSpectator,
    Phase,
    StrategyCardIndex,
} from 'common/Game';
import { MessageType } from 'common/message';

import { Accordion, AccordionDetails, AccordionSummary } from '../components/Accordion';
import GameInfoToolbar from '../components/GameInfoToolbar';
import PlayerNameDialog from '../components/PlayerNameDialog';
import PlayerSetup from '../components/PlayerSetup';
import SpeakerSelect from '../components/SpeakerSelect';
import TextWithTooltip from '../components/TextWithTooltip';
import { HEADER_HEIGHT } from '../constants';
import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import { getFactionColors } from '../utils/faction';

import ActionPhase from '../components/ActionPhase';
import AgendaPhase from '../components/AgendaPhase';
import StatusPhase from '../components/StatusPhase';
import StrategyPhase from '../components/StrategyPhase';

const PHASE_KEYS = Object.keys(Phase);
const STEPS = PHASE_KEYS.slice(PHASE_KEYS.length / 2);

const PHASE_COMPONENTS: React.ComponentType[] = [StrategyPhase, ActionPhase, StatusPhase, AgendaPhase];

function getPhaseContents(phase: number) {
    const Component = PHASE_COMPONENTS[phase];
    return Component ? <Component /> : null;
}

function canNextPhase(game: GameClientData): { canNext: boolean; message: string } {
    const { status } = game;
    const { phase, custodiansRemoved, agenda1Voted, agenda2Voted } = status;
    const factions = game.factions;

    let canNext = phase < Phase.AGENDA;
    let message = '';
    if (phase === Phase.STRATEGY) {
        // Make sure everyone has picked a strategy card
        canNext = factions.every(
            f => f.strategyCard > StrategyCardIndex.NONE && f.strategyCard < StrategyCardIndex.END,
        );

        message = canNext ? '' : 'Waiting for player to pick...';
    }

    if (phase === Phase.ACTION) {
        // Everyone's turn must be done
        canNext = factions.every(f => f.passed);
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
    factionTurnText: {
        padding: theme.spacing(),
        width: '100%',
        textAlign: 'center',
    },
    speakerToolbar: {
        margin: `${theme.spacing(2)} 0px`,
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
    const theme = useTheme();
    const classes = useStyles();
    const { sendData } = useAppContext();
    const { gameId, game, playerId } = useGameInfo();
    const navigate = useNavigate();

    const [statusState, setStatusState] = useState<GameStatus>({
        started: true,
        ended: false,
        round: 1,
        phase: Phase.STRATEGY,
        turn: StrategyCardIndex.NONE,
        speaker: '',
        pickOrder: [],
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

    if (!playerId && game) {
        const onClose = (canceled: boolean) => {
            if (canceled) {
                navigate(`/`);
            }
        };

        return <PlayerNameDialog open onClose={onClose} />;
    }

    if (!game || !playerId) {
        return null;
    }

    const { status } = game;
    if (!status.started) {
        return <PlayerSetup />;
    }

    const isSpectator = isPlayerSpectator(game, playerId);

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

    const factionTurn = getFactionTurn(game);
    const currentFactionTurn =
        factionTurn && factionTurn !== 'END' ? game.factions.find(f => f.name === factionTurn) : null;
    const currentFactionTurnStyle = currentFactionTurn
        ? getFactionColors(theme, currentFactionTurn)
        : {
              backgroundColor: theme.palette.text.primary,
              color: theme.palette.getContrastText(theme.palette.text.primary),
          };

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
                                        size="large"
                                    >
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            {pending ? (
                                <CircularProgress size="24" />
                            ) : (
                                <Button variant="contained" color="primary">
                                    <Typography align="center">{`${Phase[phase]}`}</Typography>
                                </Button>
                            )}
                            <Tooltip title={Phase[nextPhase]}>
                                <span>
                                    <IconButton
                                        disabled={isSpectator || pending || !canNext || phase === Phase.AGENDA}
                                        onClick={e => onPhaseClick(e, true)}
                                        size="large"
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
                <Toolbar>
                    <TextWithTooltip
                        text={`Turn: ${factionTurn}`}
                        className={classes.factionTurnText}
                        style={currentFactionTurnStyle}
                    />
                </Toolbar>
            </AppBar>
            <Grid container direction="column">
                {getPhaseContents(phase)}
                <Toolbar />
                <Toolbar className={classes.speakerToolbar}>
                    <SpeakerSelect fullWidth disabled={isSpectator} />
                </Toolbar>
                <Toolbar />
            </Grid>
        </>
    );
}

export default Game;
