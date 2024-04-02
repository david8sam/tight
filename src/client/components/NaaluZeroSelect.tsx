import React from 'react';

import { MenuItem, Select, SelectProps, Typography } from '@mui/material';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';

export interface NaaluZeroSelectProps extends Omit<SelectProps, 'value' | 'onChange' | 'variant'> {}

export default function NaaluZeroSelect(props: NaaluZeroSelectProps) {
    const {
        state: { game },
        sendData,
    } = useAppContext();

    const gameId = game?.id;
    const factions = game?.factions;
    const factionWithZeroToken = factions?.find(f => f.hasNaaluZeroToken);
    if (!factionWithZeroToken || !factions) {
        return null;
    }

    const nameOptions = factions.map(f => ({ label: f.name, value: f.name }));

    const onNaaluZeroChange = (factionName: string) => {
        sendData({ type: MessageType.TAKE_NAALU_ZERO_TOKEN, data: { gameId, factionName } });
    };

    return (
        <Select
            variant="outlined"
            {...props}
            value={factionWithZeroToken.name}
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
