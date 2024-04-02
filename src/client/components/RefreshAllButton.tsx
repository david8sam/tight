import React from 'react';

import { Button, Toolbar, Typography } from '@mui/material';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

export default function RefreshAllbutton() {
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();

    if (!game) {
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
        <Toolbar>
            <Button color="primary" variant="contained" fullWidth onClick={() => onRefreshAll()}>
                <Typography>Refresh Everyone's Planets</Typography>
            </Button>
        </Toolbar>
    );
}
