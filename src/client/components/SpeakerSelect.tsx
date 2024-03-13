import React from 'react';

import { MenuItem, Select, SelectProps, Typography } from '@mui/material';

import { getPlayersInGame } from 'common/Game';
import { MessageType } from 'common/message';
import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';

export interface SpeakerSelectProps extends Omit<SelectProps, 'value' | 'onChange' | 'variant'> {}

export default function SpeakerSelect(props: SpeakerSelectProps) {
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();

    if (!game) {
        return null;
    }

    const { status } = game;
    const players = getPlayersInGame(game);
    const nameOptions = players.map(p => ({ label: p.name, value: p.id }));

    const onSpeakerChange = (playerId: string) => {
        sendData({ type: MessageType.GAME_SET_SPEAKER, data: { gameId, speaker: playerId } });
    };

    return (
        <Select
            variant="outlined"
            {...props}
            value={status.speaker}
            onChange={e => onSpeakerChange(e.target.value as string)}
        >
            {nameOptions.map(({ label, value }) => (
                <MenuItem key={value} value={value}>
                    <Typography>{label}</Typography>
                </MenuItem>
            ))}
        </Select>
    );
}
