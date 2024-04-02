import { MenuItem, TextField, TextFieldProps as TextFieldPropsType, useTheme } from '@mui/material';
import React from 'react';

import useGameInfo from '../hooks/useGameInfo';
import { FactionColor, FactionColorValue } from '../utils/faction';

export const COLOR_NONE = 'None';

const COLOR_OPTIONS = Object.entries(FactionColor).map(([label, value]: [string, FactionColorValue]) => ({
    label,
    value,
}));

interface ColorSelectProps extends Omit<TextFieldPropsType<'outlined'>, 'variant' | 'onChange'> {
    value: string;
    onChange: (color: string) => void;
    order?: number;
    disableNone?: boolean;
}

export default function ColorSelect(props: ColorSelectProps) {
    const { value: color = COLOR_NONE, onChange, order = -1, disableNone = false, ...TextFieldProps } = props;
    const theme = useTheme();

    const { game } = useGameInfo();

    if (!game) {
        return null;
    }

    const onSelectChange: TextFieldPropsType['onChange'] = e => {
        onChange(e.target.value);
    };

    let selectStyle = {};
    if (color !== COLOR_NONE) {
        selectStyle = {
            color: theme.palette.getContrastText(color),
            backgroundColor: color,
        };
    }

    let errorMessage = '';
    if (order > -1) {
        const currentFaction = game.factions[order];
        if (currentFaction.color === COLOR_NONE) {
            errorMessage = 'Select a color';
        } else {
            const factionsWithSameColor = game.factions.filter(
                (f, i) => i !== order && f.color === currentFaction.color,
            );
            if (factionsWithSameColor.length) {
                errorMessage = 'Duplicate color selected';
            }
        }
    }

    return (
        <TextField
            defaultValue={COLOR_NONE}
            error={Boolean(errorMessage)}
            fullWidth
            helperText={errorMessage}
            label="Color"
            onChange={onSelectChange}
            select
            InputProps={{ sx: selectStyle }}
            value={color}
            variant="outlined"
            {...TextFieldProps}
        >
            <MenuItem disabled={disableNone} key={COLOR_NONE} value={COLOR_NONE}>
                {COLOR_NONE}
            </MenuItem>
            {COLOR_OPTIONS.map(({ label, value }: { label: string; value: FactionColorValue }) => (
                <MenuItem
                    key={label}
                    style={{ color: theme.palette.getContrastText(value), backgroundColor: value }}
                    value={value}
                >
                    {label}
                </MenuItem>
            ))}
        </TextField>
    );
}
