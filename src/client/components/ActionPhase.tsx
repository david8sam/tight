import React from 'react';

import confetti from 'canvas-confetti';

import FlagIcon from '@mui/icons-material/Flag';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Button, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { GameFaction, StrategyCardIndex, getFactionOrder, getNextFaction, isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

import FactionCard from './FactionCard';
import FactionPlanets from './FactionPlanets';
import SpeakerSelect from './SpeakerSelect';
import { StatPill } from './ui';
import VictoryPoints from './VictoryPoints';
import VictoryPointsExtra from './VictoryPointsExtra';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: theme.spacing(1.25),
        padding: theme.spacing(1.5),
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(0.5),
        flexWrap: 'wrap',
        marginTop: 'auto',
    },
    actionButton: {
        padding: theme.spacing(0.5, 1),
    },
    extra: {
        marginTop: theme.spacing(1),
    },
    vpAccordion: {
        backgroundColor: 'rgba(0,0,0,0)',
        '&::before': {
            backgroundColor: 'rgba(0,0,0,0)',
        },
    },
}));

function ActionPhase() {
    const { classes } = useStyles();
    const theme = useTheme();
    const { sendData } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();
    if (!game) {
        return null;
    }

    const { status } = game;
    const { turn } = status;
    const factionOrder = getFactionOrder(game);

    const onFlipCardClick = (factionName: string, flipped: boolean) => {
        sendData({ type: MessageType.FLIP_STRATEGY_CARD, data: { gameId, factionName, flipped } });
    };

    const onPassClick = (factionName: string, passed: boolean) => {
        if (passed) {
            confetti({
                particleCount: 500,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
        sendData({ type: MessageType.PASS_TURN, data: { gameId, factionName, passed } });
    };

    const onNextTurn = (faction: GameFaction, done: boolean) => {
        if (done) {
            const nextFaction = getNextFaction(game, faction.name, factionOrder);
            sendData({
                type: MessageType.GAME_STATUS_SET,
                data: { gameId, turn: nextFaction ? nextFaction.strategyCard : StrategyCardIndex.END },
            });
        } else {
            sendData({
                type: MessageType.GAME_STATUS_SET,
                data: { gameId, turn: faction.strategyCard },
            });
        }
    };

    const isSpectator = isPlayerSpectator(game, playerId);
    const currentFactionIndex =
        turn === StrategyCardIndex.END ? factionOrder.length : factionOrder.findIndex(f => f.strategyCard === turn);

    return (
        <div className={classes.root}>
            {factionOrder.map((faction: GameFaction) => {
                const { name: factionName } = faction;
                const factionIndex = factionOrder.findIndex(f => f.name === factionName);
                const isTurn = factionIndex === currentFactionIndex;
                const factionDone = faction.passed || currentFactionIndex > factionIndex;
                const isPoliticsAndFlipped =
                    faction.strategyCard === StrategyCardIndex.POLITICS && faction.stragetyCardFlipped;
                const isImperialAndFlipped =
                    faction.strategyCard === StrategyCardIndex.IMPERIAL && faction.stragetyCardFlipped;

                let statusPill = <StatPill size="small">Waiting</StatPill>;
                if (faction.passed) {
                    statusPill = (
                        <StatPill size="small" icon={<FlagIcon sx={{ fontSize: 12 }} />}>
                            Passed
                        </StatPill>
                    );
                } else if (isTurn) {
                    statusPill = (
                        <StatPill
                            size="small"
                            color={theme.palette.primary.main}
                            icon={<PlayArrowIcon sx={{ fontSize: 13 }} />}
                        >
                            Active
                        </StatPill>
                    );
                } else if (factionDone) {
                    statusPill = <StatPill size="small">Done</StatPill>;
                }

                return (
                    <FactionCard
                        key={factionName}
                        faction={faction}
                        statusPill={statusPill}
                        active={isTurn && !faction.passed}
                        dimmed={factionDone && !isTurn}
                    >
                        <div className={classes.actions}>
                            <VictoryPointsExtra factionName={factionName} disabled={isSpectator} />
                            <Button
                                className={classes.actionButton}
                                size="small"
                                color="primary"
                                variant="outlined"
                                onClick={() => onFlipCardClick(factionName, !faction.stragetyCardFlipped)}
                                disabled={isSpectator}
                            >
                                {faction.stragetyCardFlipped ? 'Unflip' : 'Flip'}
                            </Button>
                            <Button
                                className={classes.actionButton}
                                size="small"
                                color="primary"
                                variant="outlined"
                                onClick={() => onPassClick(factionName, !faction.passed)}
                                disabled={isSpectator || !faction.stragetyCardFlipped}
                            >
                                {faction.passed ? 'Unpass' : 'Pass'}
                            </Button>
                            <Button
                                className={classes.actionButton}
                                size="small"
                                color="primary"
                                variant="contained"
                                disabled={isSpectator || faction.passed}
                                onClick={() => onNextTurn(faction, !factionDone)}
                            >
                                {factionDone ? 'Undone' : 'Done'}
                            </Button>
                        </div>
                        <FactionPlanets
                            faction={faction}
                            disabled={isSpectator}
                            AccordionProps={{ className: classes.vpAccordion, elevation: 0 }}
                        />
                        {isPoliticsAndFlipped && (
                            <SpeakerSelect className={classes.extra} fullWidth disabled={isSpectator} />
                        )}
                        {isImperialAndFlipped && (
                            <VictoryPoints
                                factionName={factionName}
                                AccordionProps={{
                                    className: classes.vpAccordion,
                                    elevation: 0,
                                }}
                                hideExtraVp
                            />
                        )}
                    </FactionCard>
                );
            })}
        </div>
    );
}

export default ActionPhase;
