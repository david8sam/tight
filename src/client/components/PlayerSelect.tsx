import { MenuItem, TextField, TextFieldProps as TextFieldPropsType } from '@mui/material';
import React from 'react';

export const PLAYER_NONE = 'None';

export interface PlayerSelectProps extends Omit<TextFieldPropsType<'outlined'>, 'variant' | 'onChange'> {
    value: string[];
    playerNames: string[];
    onChange: (playerNames: string[]) => void;
}

export default function PlayerSelect(props: PlayerSelectProps) {
    const { value: player = [], playerNames = [], onChange, SelectProps, ...TextFieldProps } = props;

    const onSelectChange: TextFieldPropsType['onChange'] = e => {
        onChange(e.target.value as unknown as string[]);
    };

    const renderValue = (value: unknown) => {
        const valueArray = value as string[];
        return valueArray?.length ? valueArray.join(', ') : PLAYER_NONE;
    };

    return (
        <TextField
            fullWidth
            label="Players (none, one, or multiple)"
            InputLabelProps={{ shrink: true }}
            onChange={onSelectChange}
            select
            value={player}
            variant="outlined"
            SelectProps={{ ...SelectProps, multiple: true, displayEmpty: true, renderValue }}
            {...TextFieldProps}
        >
            {playerNames.map((n: string) => (
                <MenuItem key={n} value={n}>
                    {n}
                </MenuItem>
            ))}
        </TextField>
    );
}
