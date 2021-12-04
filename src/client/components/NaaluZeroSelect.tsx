import React from 'react';

import { MenuItem, Select, SelectProps, Typography } from '@material-ui/core';

import { getPlayersInGame } from 'common/Game';
import { MessageType } from 'common/message';
import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';

export interface NaaluZeroSelectProps extends Omit<SelectProps, 'value' | 'onChange'> {}

export default function NaaluZeroSelect(props: NaaluZeroSelectProps) {
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();

    const players = game && getPlayersInGame(game);
    const playerWithZeroToken = players && players.find(p => p.hasNaaluZeroToken);
    if (!playerWithZeroToken || !players) {
        return null;
    }

    const nameOptions = players.map(p => ({ label: p.name, value: p.id }));

    const onNaaluZeroChange = (playerId: string) => {
        sendData({ type: MessageType.PLAYER_TAKE_NAALU_ZERO_TOKEN, data: { gameId, playerId } });
    };

    return (
        <Select
            variant="outlined"
            {...props}
            value={playerWithZeroToken.id}
            onChange={e => onNaaluZeroChange(e.target.value as string)}
        >
            {nameOptions.map(({ label, value }) => (
                <MenuItem key={value} value={value}>
                    <Typography>{label}</Typography>
                </MenuItem>
            ))}
        </Select>
    );
}
