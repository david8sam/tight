import React from 'react';

import { Button, Card, CardContent, Grid, Theme, Toolbar } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import classNames from 'classnames';

import { GamePlayer, StrategyCardIndex, getPlayerOrder, getNextPlayer, GameJoinStatus } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import PlayerHeader from './PlayerHeader';
import VictoryPointsExtra from './VictoryPointsExtra';

const useStyles = makeStyles((theme: Theme) => ({
    card: {
        border: `${theme.spacing(0.25)}px solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)}px ${theme.spacing(1)}px`,
        position: 'relative',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
    doneBackground: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    toolbarGutters: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
    button: {
        padding: theme.spacing(0.5),
    },
}));

function ActionPhase() {
    const classes = useStyles();
    const { sendData } = useAppContext();

    const { game, gameId, player: currentPlayer } = useAccountInfo();
    if (!game || !currentPlayer) {
        return null;
    }

    const { status } = game;
    const { turn } = status;
    const playerOrder = getPlayerOrder(game);

    const onFlipCardClick = (playerId: string, flipped: boolean) => {
        sendData({ type: MessageType.PLAYER_FLIP_STRATEGY_CARD, data: { gameId, playerId, flipped } });
    };

    const onPassClick = (playerId: string, passed: boolean) => {
        sendData({ type: MessageType.PLAYER_PASS_TURN, data: { gameId, playerId, passed } });
    };

    const onNextTurn = (player: GamePlayer, done: boolean) => {
        if (done) {
            const nextPlayer = getNextPlayer(game, player.id, playerOrder);
            sendData({
                type: MessageType.GAME_STATUS_SET,
                data: { gameId, turn: nextPlayer ? nextPlayer.strategyCard : StrategyCardIndex.END },
            });
        } else {
            sendData({
                type: MessageType.GAME_STATUS_SET,
                data: { gameId, turn: player.strategyCard },
            });
        }
    };

    const isSpectator = currentPlayer.joinStatus === GameJoinStatus.SPECTATOR;
    const currentPlayerIndex =
        turn === StrategyCardIndex.END ? playerOrder.length : playerOrder.findIndex(p => p.strategyCard === turn);

    return (
        <Grid container direction="column">
            {playerOrder.map((player: GamePlayer) => {
                const { id: playerId } = player;
                const playerIndex = playerOrder.findIndex(p => p.id === playerId);
                const playerDone = player.passed || currentPlayerIndex > playerIndex;

                return (
                    <Card key={playerId} variant="outlined" classes={{ root: classes.card }}>
                        <CardContent classes={{ root: classes.cardContent }}>
                            <PlayerHeader player={player} />
                        </CardContent>
                        <CardContent classes={{ root: classes.cardContent }}>
                            <Toolbar
                                classes={{
                                    root: classNames({ [classes.doneBackground]: playerDone }),
                                    gutters: classes.toolbarGutters,
                                }}
                            >
                                <Grid container direction="row" justifyContent="space-between" alignItems="center">
                                    <VictoryPointsExtra playerId={playerId} disabled={isSpectator} />
                                    <Button
                                        classes={{ root: classes.button }}
                                        color="primary"
                                        variant="contained"
                                        onClick={() => onPassClick(playerId, !player.passed)}
                                        disabled={isSpectator || !player.stragetyCardFlipped}
                                    >
                                        {player.passed ? 'PASSED' : 'PASS'}
                                    </Button>
                                    <Button
                                        classes={{ root: classes.button }}
                                        color="primary"
                                        variant="contained"
                                        onClick={() => onFlipCardClick(playerId, !player.stragetyCardFlipped)}
                                        disabled={isSpectator}
                                    >
                                        {player.stragetyCardFlipped ? 'FLIPPED' : 'FLIP'}
                                    </Button>
                                    <Button
                                        classes={{ root: classes.button }}
                                        color="primary"
                                        variant="contained"
                                        disabled={isSpectator || player.passed}
                                        onClick={() => onNextTurn(player, !playerDone)}
                                    >
                                        {playerDone ? 'DONE-D' : 'DONE'}
                                    </Button>
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
                        disabled={playerOrder.every(p => p.passed) || turn !== StrategyCardIndex.END}
                        color="primary"
                        variant="contained"
                        fullWidth
                        // Will always be a player, otherwise the button is disabled and not clickable.
                        onClick={() => onNextTurn(playerOrder.find(p => !p.passed) as GamePlayer, false)}
                    >
                        Next Turn
                    </Button>
                </Toolbar>
            )}
        </Grid>
    );
}

export default ActionPhase;
