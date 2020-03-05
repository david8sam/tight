import React, { MouseEvent } from 'react';

import { Button, Card, CardContent, Grid, Typography, Theme, Toolbar } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';

import classNames from 'classnames';

import { GamePlayer, StrategyCardIndex, getPlayerOrder, getNextPlayer } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import StrategyCard from '../components/StrategyCard';
import VictoryPoints from '../components/VictoryPoints';
import useAccountInfo from '../hooks/useAccountInfo';

const useStyles = makeStyles((theme: Theme) => ({
    card: {
        border: `${theme.spacing(0.25)}px solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)}px ${theme.spacing(1)}px`,
        position: 'relative',
    },
    doneBackground: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
    panel: {
        boxShadow: 'none',
        padding: `0px ${theme.spacing(2)}px`,
        '&:before': {
            height: 0,
            top: 0,
        },
    },
    summary: {
        padding: 0,
    },
    details: {
        padding: 0,
        paddingBottom: theme.spacing(1),
    },
}));

function ActionPhase(props: object) {
    const theme: Theme = useTheme();
    const classes = useStyles(props);
    const { state, sendData } = useAppContext();
    const { strategyCards } = state;

    const { game, gameId, player } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const { status } = game;
    const { turn } = status;
    const playerOrder = getPlayerOrder(game);

    const onFlipCardClick = (e: MouseEvent<HTMLButtonElement>, playerId: string, flipped: boolean) => {
        e.stopPropagation();
        sendData({ type: MessageType.PLAYER_FLIP_STRATEGY_CARD, data: { gameId, playerId, flipped } });
    };

    const onPassClick = (playerId: string, passed: boolean) => {
        sendData({ type: MessageType.PLAYER_PASS_TURN, data: { gameId, playerId, passed } });
    };

    const onNextTurn = (currentPlayer: GamePlayer, done: boolean) => {
        if (done) {
            const nextPlayer = getNextPlayer(game, currentPlayer.id, playerOrder);
            sendData({
                type: MessageType.GAME_STATUS_SET,
                data: { gameId, turn: nextPlayer ? nextPlayer.strategyCard : StrategyCardIndex.END },
            });
        } else {
            sendData({
                type: MessageType.GAME_STATUS_SET,
                data: { gameId, turn: currentPlayer.strategyCard },
            });
        }
    };

    return (
        <Grid container direction="column">
            {playerOrder.map((currentPlayer: GamePlayer, index: number) => {
                const { id: playerId, strategyCard } = currentPlayer;
                const card = strategyCards[strategyCard];

                const buttonLabel = currentPlayer.stragetyCardFlipped ? 'FLIPPED' : 'FLIP';
                const ButtonProps = {
                    disabled: false,
                    onClick: (e: MouseEvent<HTMLButtonElement>) =>
                        onFlipCardClick(e, playerId, !currentPlayer.stragetyCardFlipped),
                };

                const playerColor = currentPlayer.color || '#fff';
                const playerDone = currentPlayer.passed || turn > currentPlayer.strategyCard;

                return (
                    <Card key={playerId} variant="outlined" classes={{ root: classes.card }}>
                        <CardContent classes={{ root: classes.cardContent }}>
                            <Grid
                                container
                                justify="center"
                                alignItems="center"
                                style={{
                                    color: theme.palette.getContrastText(playerColor),
                                    backgroundColor: playerColor,
                                }}
                            >
                                <Typography>{playerId}</Typography>
                            </Grid>
                            <Toolbar classes={{ root: classNames({ [classes.doneBackground]: playerDone }) }}>
                                <Grid container direction="row" justify="space-between" alignItems="center">
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={() => onPassClick(playerId, !currentPlayer.passed)}
                                        disabled={!currentPlayer.stragetyCardFlipped}
                                    >
                                        {currentPlayer.passed ? 'PASSED' : 'PASS'}
                                    </Button>
                                    <VictoryPoints playerId={playerId} />
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        disabled={currentPlayer.passed}
                                        onClick={() => onNextTurn(currentPlayer, !playerDone)}
                                    >
                                        {playerDone ? 'DONE-D' : 'DONE'}
                                    </Button>
                                </Grid>
                            </Toolbar>
                            <StrategyCard
                                card={card}
                                ButtonProps={ButtonProps}
                                buttonLabel={buttonLabel}
                                PanelProps={{
                                    disableMargin: true,
                                    classes: {
                                        root: classNames(classes.panel, { [classes.doneBackground]: playerDone }),
                                    },
                                }}
                                SummaryProps={{ disableMargin: true, classes: { root: classes.summary } }}
                                DetailsProps={{ classes: { root: classes.details } }}
                            />
                        </CardContent>
                    </Card>
                );
            })}
        </Grid>
    );
}

export default ActionPhase;
