import React, { MouseEvent, useState } from 'react';

import { Button, Card, CardContent, Grid, Typography, Theme, Toolbar } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';

import classNames from 'classnames';

import { StrategyCard as StrategyCardType, StrategyCardIndex } from 'common/Game';
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

    const { game, gameId, player, playerId } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const { status } = game;
    const { turn, passed } = status;

    const playersArray = Object.values(game.players);
    const stratCardOwners: string[] = [''];
    playersArray.forEach(p => (p.strategyCard ? (stratCardOwners[p.strategyCard] = p.name) : null));

    const onFlipCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        // TODO: sendData to flip/unflip card
    };

    const onNextTurn = (i: StrategyCardIndex, done: boolean) => {
        let newTurn: StrategyCardIndex = i;
        if (done) {
            newTurn += 1;
            let name = stratCardOwners[newTurn];
            while (!name && newTurn < StrategyCardIndex.END) {
                newTurn += 1;
                name = stratCardOwners[newTurn];
            }

            sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, turn: newTurn } });
        } else {
            newTurn = i;
        }

        sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, turn: newTurn } });
    };

    const onPassClick = (playerId: string, passed: boolean) => {
        sendData({ type: MessageType.PLAYER_PASS_TURN, data: { gameId, playerId, unpass: !passed } });
    };

    return (
        <Grid container direction="column">
            {stratCardOwners.map((owner: string, i: StrategyCardIndex) => {
                if (!owner) {
                    return null;
                }

                const card = strategyCards[i];
                const { initiative, name } = card;
                const currentPlayer = game.players[owner];

                const buttonLabel = 'Flip';
                const ButtonProps = {
                    disabled: false,
                    onClick: (e: MouseEvent<HTMLButtonElement>) => onFlipCardClick(e, initiative),
                };

                const playerColor = currentPlayer.color || '#fff';
                const playerPassed = passed.includes(owner);
                const playerDone = playerPassed || turn > i;

                return (
                    <Card key={name} variant="outlined" classes={{ root: classes.card }}>
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
                                <Typography>{owner}</Typography>
                            </Grid>
                            <Toolbar classes={{ root: classNames({ [classes.doneBackground]: playerDone }) }}>
                                <Grid container direction="row" justify="space-between" alignItems="center">
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={() => onPassClick(owner, !playerPassed)}
                                    >
                                        {playerPassed ? 'UNPASS' : 'PASS'}
                                    </Button>
                                    <VictoryPoints playerId={owner} />
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        disabled={playerPassed}
                                        onClick={() => onNextTurn(i, !playerDone)}
                                    >
                                        {playerDone ? 'UNDONE' : 'DONE'}
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
