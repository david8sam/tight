import React from 'react';

import { Button, Toolbar, Typography } from '@mui/material';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

export default function RefreshAllbutton() {
    const {
        sendData,
        state: { pendingCommands },
    } = useAppContext();
    const { game, gameId, playerId, canEditTable } = useGameInfo();

    if (!game || !canEditTable) {
        return null;
    }

    const onRefreshAll = () => {
        game.factions.forEach(f => {
            const { name: factionName, planets } = f;
            if (!planets.length) return;
            sendData({
                type: MessageType.REFRESH_PLANET,
                data: { gameId, factionName, planetId: planets, ability: true },
            });
        });
    };

    return (
        <Toolbar>
            <Button
                disabled={pendingCommands > 0}
                color="primary"
                variant="contained"
                fullWidth
                onClick={() => onRefreshAll()}
            >
                <Typography>Refresh Everyone's Planets</Typography>
            </Button>
        </Toolbar>
    );
}
