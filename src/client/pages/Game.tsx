import React, { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isEqual } from 'lodash-es';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Button, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import { keyframes, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import {
    GameClientData,
    GameStatus,
    Phase,
    StrategyCardIndex,
    formatFactionName,
    getFactionOrder,
    getFactionTurn,
    isPlayerSpectator,
} from 'common/Game';
import { MessageType } from 'common/message';

import ActionPhase from '../components/ActionPhase';
import AgendaPhase from '../components/AgendaPhase';
import PlayerNameDialog from '../components/PlayerNameDialog';
import PlayerSetup from '../components/PlayerSetup';
import StatusPhase from '../components/StatusPhase';
import StrategyPhase from '../components/StrategyPhase';
import { PhaseBadge } from '../components/ui';
import { PHASE_LABELS } from '../constants';
import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import { getFactionColors } from '../utils/faction';

const PHASES = [Phase.STRATEGY, Phase.ACTION, Phase.STATUS, Phase.AGENDA];

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

// Quick attention flash when a new turn starts — restarted via the banner's key, not turn-long.
const turnFlash = keyframes`
    0% { filter: brightness(1); }
    50% { filter: brightness(1.9); }
    100% { filter: brightness(1); }
`;

const useStyles = makeStyles()(theme => ({
    phaseBar: {
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    phaseNav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(0.5),
        padding: theme.spacing(1, 1.5, 0.5),
    },
    phaseBadges: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        flexWrap: 'wrap',
        justifyContent: 'center',
        flex: 1,
    },
    phaseStatus: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing(0, 1.5, 1),
    },
    turnBanner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing(1.5),
        flexWrap: 'wrap',
        textAlign: 'center',
        padding: theme.spacing(0.75, 1.5),
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.02em',
    },
    turnFlash: {
        animation: `${turnFlash} 0.4s ease-in-out 3`,
    },
    content: {
        paddingBottom: theme.spacing(2),
    },
}));

function Game() {
    const theme = useTheme();
    const { classes } = useStyles();
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

    const prevPhase: Phase = phase === Phase.STRATEGY ? Phase.AGENDA : phase - 1;
    const nextPhase: Phase = phase === Phase.AGENDA ? Phase.STRATEGY : phase + 1;

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
        phaseStatus = <Typography variant="body2">{message}</Typography>;
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

    const factionTurn = getFactionTurn(game);
    const currentFactionTurn =
        factionTurn && factionTurn !== 'END' ? game.factions.find(f => f.name === factionTurn) : null;
    const turnColors = currentFactionTurn ? getFactionColors(theme, currentFactionTurn) : null;

    let turnBanner = null;
    if (currentFactionTurn && turnColors) {
        turnBanner = (
            <div
                // Remount per faction so the flash replays at the start of each turn
                key={currentFactionTurn.name}
                className={`${classes.turnBanner} ${classes.turnFlash}`}
                style={{ backgroundColor: turnColors.base, color: turnColors.on }}
            >{`Turn: ${formatFactionName(game, currentFactionTurn.name)}`}</div>
        );
    } else if (factionTurn === 'END') {
        // Prominent primary action right next to the end-of-round message
        let endAction = null;
        if (phase === Phase.AGENDA) {
            if (round === game.numRounds) {
                endAction = (
                    <Button size="small" variant="contained" disabled={isSpectator || pending} onClick={onEndGame}>
                        End Game
                    </Button>
                );
            } else if (canNext) {
                endAction = (
                    <Button
                        size="small"
                        variant="contained"
                        disabled={isSpectator || pending}
                        onClick={onStartNextRound}
                    >
                        Start Next Round
                    </Button>
                );
            }
        } else {
            // In the Action phase the turn cycle repeats until everyone has passed —
            // offer Next Turn until then, and only then the move to Status.
            const nextUnpassed = phase === Phase.ACTION ? getFactionOrder(game).find(f => !f.passed) : undefined;
            if (nextUnpassed) {
                endAction = (
                    <Button
                        size="small"
                        variant="contained"
                        disabled={isSpectator || pending}
                        onClick={() =>
                            sendData({
                                type: MessageType.GAME_STATUS_SET,
                                data: { gameId, turn: nextUnpassed.strategyCard },
                            })
                        }
                    >
                        Next Turn
                    </Button>
                );
            } else {
                endAction = (
                    <Button
                        size="small"
                        variant="contained"
                        disabled={isSpectator || pending || !canNext}
                        onClick={e => onPhaseClick(e, true)}
                    >
                        {`Next: ${PHASE_LABELS[nextPhase]}`}
                    </Button>
                );
            }
        }

        turnBanner = (
            <div
                className={classes.turnBanner}
                style={{ backgroundColor: theme.game.surface.strip, color: theme.palette.text.secondary }}
            >
                End of round
                {endAction}
            </div>
        );
    }

    return (
        <>
            <div className={classes.phaseBar}>
                <div className={classes.phaseNav}>
                    <Tooltip title={PHASE_LABELS[prevPhase]}>
                        <span>
                            <IconButton
                                disabled={isSpectator || pending || !canBack || phase === Phase.STRATEGY}
                                onClick={e => onPhaseClick(e, false)}
                                size="small"
                            >
                                <NavigateBeforeIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <div className={classes.phaseBadges}>
                        {pending ? (
                            <CircularProgress size={24} />
                        ) : (
                            PHASES.map(p => (
                                <PhaseBadge
                                    key={p}
                                    label={PHASE_LABELS[p]}
                                    state={p < phase ? 'complete' : p === phase ? 'active' : 'pending'}
                                />
                            ))
                        )}
                    </div>
                    <Tooltip title={PHASE_LABELS[nextPhase]}>
                        <span>
                            <IconButton
                                disabled={isSpectator || pending || !canNext || phase === Phase.AGENDA}
                                onClick={e => onPhaseClick(e, true)}
                                size="small"
                            >
                                <NavigateNextIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </div>
                {phaseStatus && <div className={classes.phaseStatus}>{phaseStatus}</div>}
                {turnBanner}
            </div>
            <div className={classes.content}>{getPhaseContents(phase)}</div>
        </>
    );
}

export default Game;
