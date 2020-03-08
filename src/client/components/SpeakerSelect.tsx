import React from 'react';

import { MenuItem, Select, SelectProps } from '@material-ui/core';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { MessageType } from 'common/message';

export interface SpeakerSelectProps extends SelectProps {}

export default function SpeakerSelect(props: SpeakerSelectProps) {
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();

    if (!game) {
        return null;
    }

    const { players, status } = game;
    const nameArray = Object.values(players).map(p => p.name);

    const onSpeakerChange = (name: string) => {
        sendData({ type: MessageType.GAME_SET_SPEAKER, data: { gameId, speaker: name } });
    };

    return (
        <Select
            variant="outlined"
            {...props}
            value={status.speaker}
            onChange={e => onSpeakerChange(e.target.value as string)}
        >
            {nameArray.map(n => (
                <MenuItem key={n} value={n}>
                    {n}
                </MenuItem>
            ))}
        </Select>
    );
}
