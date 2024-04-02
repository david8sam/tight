import React from 'react';

import { MenuItem, TextField, TextFieldProps, Typography } from '@mui/material';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

export interface SpeakerSelectProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'variant'> {}

export default function SpeakerSelect(props: SpeakerSelectProps) {
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();

    if (!game) {
        return null;
    }

    const { factions, status } = game;
    const nameOptions = factions.map(f => ({ label: f.name, value: f.name }));

    const onSpeakerChange = (factionName: string) => {
        sendData({ type: MessageType.GAME_SET_SPEAKER, data: { gameId, speaker: factionName } });
    };

    return (
        <TextField
            select
            label="Speaker"
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
        </TextField>
    );
}
