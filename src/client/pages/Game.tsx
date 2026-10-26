import React, { MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
    AppBar,
    Box,
    Button,
    CircularProgress,
    Collapse,
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

import { Game, GameClientData, getFactionTurn, Phase, StrategyCardIndex } from 'common/Game';
import { MessageType } from 'common/message';

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
import FactionHeader from '../components/FactionHeader';
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
    const {
        sendData,
        state: { pendingCommands },
    } = useAppContext();
    const { gameId, game, playerId, isHost, canEditTable } = useGameInfo();
    const navigate = useNavigate();

    const pending = pendingCommands > 0;
    const [actionExpanded, setActionExpaned] = useState(false);

    if (!playerId && game && isHost) {
        const onClose = (canceled: boolean) => {
            if (canceled) {
                navigate(`/`);
            }
        };

        return <PlayerNameDialog open onClose={onClose} />;
    }

    if (!game || (!playerId && isHost)) {
        return null;
    }

    const { status } = game;
    if (!status.started) {
        return <PlayerSetup />;
    }

    const isSpectator = !canEditTable;

    const { round, phase } = status;
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
    };

    const onStartNextRound = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (pending) {
            return;
        }

        sendData({ type: MessageType.GAME_NEXT_ROUND, data: { gameId } });
    };

    const onEndGame = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (pending) {
            return;
        }

        sendData({ type: MessageType.END_GAME, data: { gameId } });
    };

    let phaseStatus = null;
    if (message) {
        phaseStatus = <Typography>{message}</Typography>;
    } else if (phase === Phase.AGENDA) {
        if (round === game.numRounds) {
            phaseStatus = !isHost ? <Typography>Ask the host to end this game.</Typography> : (
                <Button disabled={pending} color="primary" variant="contained" onClick={onEndGame}>
                    {pending ? <CircularProgress aria-label="Saving game" size="24" /> : 'End Game'}
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
                    {pending ? <CircularProgress aria-label="Saving game" size="24" /> : 'Start Next Round'}
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
                <Box className={classes.statusAccordion}>
                    <Toolbar classes={{ root: classes.statusSummary }}>
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Tooltip title={Phase[prevPhase]}>
                                <span>
                                    <IconButton
                                        aria-label={`Previous phase: ${Phase[prevPhase]}`}
                                        disabled={isSpectator || pending || !canBack || phase === Phase.STRATEGY}
                                        onClick={e => onPhaseClick(e, false)}
                                        size="large"
                                    >
                                        <NavigateBeforeIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            {pending ? (
                                <CircularProgress aria-label="Saving game" size="24" />
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    aria-label={`${Phase[phase]} phase details`}
                                    aria-expanded={actionExpanded}
                                    onClick={() => setActionExpaned(expanded => !expanded)}
                                >
                                    <Typography align="center">{`${Phase[phase]}`}</Typography>
                                </Button>
                            )}
                            <Tooltip title={Phase[nextPhase]}>
                                <span>
                                    <IconButton
                                        aria-label={`Next phase: ${Phase[nextPhase]}`}
                                        disabled={isSpectator || pending || !canNext || phase === Phase.AGENDA}
                                        onClick={e => onPhaseClick(e, true)}
                                        size="large"
                                    >
                                        <NavigateNextIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                    </Toolbar>
                    {stepperToolbar}
                    <Collapse in={actionExpanded}>
                        <Box className={classes.phaseActionDetails}>
                            <Grid container direction="column">
                                <Stepper classes={{ root: classes.stepper }} activeStep={phase} alternativeLabel>
                                    {STEPS.map(label => (
                                        <Step
                                            classes={{ alternativeLabel: classes.stepLabelAlternativeLabel }}
                                            key={label}
                                        >
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </Grid>
                        </Box>
                    </Collapse>
                </Box>
                <Toolbar sx={{ display: 'flex', width: '100%', height: '100%', padding: 1 }}>
                    {currentFactionTurn && currentFactionTurn.strategyCard ? (
                        <FactionHeader
                            faction={currentFactionTurn}
                            sx={{ justifyContent: 'center', padding: '4px' }}
                            prefixText={'Turn: '}
                            hideInitiativeNumber
                        />
                    ) : (
                        <TextWithTooltip
                            text={`Turn: ${factionTurn}`}
                            className={classes.factionTurnText}
                            style={currentFactionTurnStyle}
                        />
                    )}
                </Toolbar>
            </AppBar>
            <Grid container direction="column">
                <Box sx={{ marginBottom: 1 }} />
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
