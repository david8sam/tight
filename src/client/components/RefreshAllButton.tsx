import React from 'react';

import { Button, ButtonProps } from '@mui/material';

import { isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

export default function RefreshAllbutton(props: ButtonProps) {
    const { sendData } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();

    if (!game || isPlayerSpectator(game, playerId)) {
        return null;
    }

    const onRefreshAll = () => {
        game.factions.forEach(f => {
            const { name: factionName, planets } = f;
            sendData({
                type: MessageType.REFRESH_PLANET,
                data: { gameId, factionName, planetId: planets, ability: true },
            });
        });
    };

    return (
        <Button color="primary" variant="contained" onClick={() => onRefreshAll()} {...props}>
            Refresh Everyone's Planets
        </Button>
    );
}
