import React from 'react';

import { Button, Card, CardContent, Grid, Theme, Toolbar, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { GamePlayer, getPlayerOrder } from 'common/Game';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import PlayerHeader from './PlayerHeader';
import VictoryPoints from './VictoryPoints';
import { MessageType } from 'common/message';

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
    toolbarGutters: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
}));

function StatusPhase(props: object) {
    const classes = useStyles(props);
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();
    if (!game) {
        return null;
    }

    const playerOrder = getPlayerOrder(game);

    const onRefreshAll = () => {
        const players = Object.values(game.players);
        players.forEach(p => {
            const { id: playerId, planets } = p;
            sendData({ type: MessageType.PLAYER_REFRESH_PLANET, data: { gameId, playerId, planets } });
        });
    };

    return (
        <Grid container direction="column">
            {playerOrder.map((player: GamePlayer) => (
                <Card key={player.id} variant="outlined" classes={{ root: classes.card }}>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <PlayerHeader player={player} />
                    </CardContent>
                    <CardContent classes={{ root: classes.cardContent }}>
                        <Toolbar classes={{ gutters: classes.toolbarGutters }}>
                            <Grid container direction="row" justify="center" alignItems="center">
                                <VictoryPoints playerId={player.id} />
                            </Grid>
                        </Toolbar>
                    </CardContent>
                </Card>
            ))}
            <Toolbar />
            <Toolbar>
                <Button color="primary" variant="contained" fullWidth onClick={() => onRefreshAll()}>
                    Refresh Everyone's Planets
                </Button>
            </Toolbar>
        </Grid>
    );
}

export default StatusPhase;
