import confetti from 'canvas-confetti';
import React from 'react';

import { Button, Card, CardContent, Grid, Toolbar } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import classNames from 'classnames';

import { GameFaction, StrategyCardIndex, getFactionOrder, getNextFaction, isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import FactionHeader from './FactionHeader';
import SpeakerSelect from './SpeakerSelect';
import VictoryPoints from './VictoryPoints';
import VictoryPointsExtra from './VictoryPointsExtra';

const useStyles = makeStyles()((theme) => ({
    card: {
        border: `${theme.spacing(0.25)} solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        position: 'relative',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
    doneBackground: {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.5)',
    },
    toolbarGutters: {
        padding: theme.spacing(1),
    },
    toolbarRegular: {
        minHeight: 'auto',
    },
    button: {
        padding: theme.spacing(0.5),
    },
    speakerSelect: {
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
        <Grid container direction="column">
            {factionOrder.map((faction: GameFaction) => {
                const { name: factionName } = faction;
                const factionIndex = factionOrder.findIndex(f => f.name === factionName);
                const factionDone = faction.passed || currentFactionIndex > factionIndex;
                const isPoliticsAndFlipped =
                    faction.strategyCard === StrategyCardIndex.POLITICS && faction.stragetyCardFlipped;
                const isImperialAndFlipped =
                    faction.strategyCard === StrategyCardIndex.IMPERIAL && faction.stragetyCardFlipped;

                return (
                    <Card key={factionName} variant="outlined" classes={{ root: classes.card }}>
                        <CardContent classes={{ root: classes.cardContent }}>
                            <FactionHeader faction={faction} />
                        </CardContent>
                        <CardContent classes={{ root: classes.cardContent }}>
                            <Toolbar
                                classes={{
                                    root: classNames({ [classes.doneBackground]: factionDone }),
                                    gutters: classes.toolbarGutters,
                                    regular: classes.toolbarRegular,
                                }}
                            >
                                <Grid container direction="column">
                                    <Grid container direction="row" justifyContent="space-between" alignItems="center">
                                        <VictoryPointsExtra factionName={factionName} disabled={isSpectator} />
                                        <Button
                                            classes={{ root: classes.button }}
                                            color="primary"
                                            variant="contained"
                                            onClick={() => onPassClick(factionName, !faction.passed)}
                                            disabled={isSpectator || !faction.stragetyCardFlipped}
                                        >
                                            {faction.passed ? 'UNPASS' : 'PASS'}
                                        </Button>
                                        <Button
                                            classes={{ root: classes.button }}
                                            color="primary"
                                            variant="contained"
                                            onClick={() => onFlipCardClick(factionName, !faction.stragetyCardFlipped)}
                                            disabled={isSpectator}
                                        >
                                            {faction.stragetyCardFlipped ? 'UNFLIP' : 'FLIP'}
                                        </Button>
                                        <Button
                                            classes={{ root: classes.button }}
                                            color="primary"
                                            variant="contained"
                                            disabled={isSpectator || faction.passed}
                                            onClick={() => onNextTurn(faction, !factionDone)}
                                        >
                                            {factionDone ? 'UNDONE' : 'DONE'}
                                        </Button>
                                    </Grid>
                                    {isPoliticsAndFlipped && (
                                        <SpeakerSelect
                                            className={classes.speakerSelect}
                                            fullWidth
                                            disabled={isSpectator}
                                        />
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
                                </Grid>
                            </Toolbar>
                        </CardContent>
                    </Card>
                );
            })}
            <Toolbar />
            {!isSpectator && (
                <Toolbar>
                    <Button
                        disabled={factionOrder.every(p => p.passed) || turn !== StrategyCardIndex.END}
                        color="primary"
                        variant="contained"
                        fullWidth
                        // Will always be a faction, otherwise the button is disabled and not clickable.
                        onClick={() => onNextTurn(factionOrder.find(p => !p.passed) as GameFaction, false)}
                    >
                        Next Turn
                    </Button>
                </Toolbar>
            )}
        </Grid>
    );
}

export default ActionPhase;
