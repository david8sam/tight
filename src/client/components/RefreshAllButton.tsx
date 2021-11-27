import React from 'react';

import { Button, Toolbar, Typography } from '@material-ui/core';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { GameJoinStatus, getPlayersInGame } from 'common/Game';
import { MessageType } from 'common/message';

export default function RefreshAllbutton() {
    const { sendData } = useAppContext();
    const { game, gameId, player, playerId } = useAccountInfo();

    if (!game || !player || !playerId) {
        return null;
    }

    const onRefreshAll = () => {
        const players = getPlayersInGame(game);
        players.forEach(p => {
            const { id: playerId, planets } = p;
            sendData({
                type: MessageType.PLAYER_REFRESH_PLANET,
                data: { gameId, playerId, planetId: planets, ability: true },
            });
        });
    };

    if (player.joinStatus === GameJoinStatus.SPECTATOR) {
        return null;
    }

    return (
        <Toolbar>
            <Button color="primary" variant="contained" fullWidth onClick={() => onRefreshAll()}>
                <Typography>Refresh Everyone's Planets</Typography>
            </Button>
        </Toolbar>
    );
}
