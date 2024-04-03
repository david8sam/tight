import React from 'react';
import { TextField, MenuItem, TextFieldProps as TextFieldPropsType, IconButton, Tooltip } from '@mui/material';
import DiceIcon from '@mui/icons-material/Casino';

import useGameInfo from '../hooks/useGameInfo';

export const FACTION_NONE = 'None';

export interface FactionSelectProps extends Omit<TextFieldPropsType<'outlined'>, 'variant' | 'onChange'> {
    value: string;
    factionNames: string[];
    onChange: (factionName: string) => void;
    order?: number;
    hideNone?: boolean;
}

function FactionSelect(props: FactionSelectProps) {
    const { factionNames, onChange, order = -1, hideNone = false, disabled = false, ...TextFieldProps } = props;
    const { game } = useGameInfo();

    const onSelectChange: TextFieldPropsType['onChange'] = e => {
        onChange(e.target.value);
    };

    const onRandomizeClick = () => {
        const randomize = () => {
            const index = Math.round(Math.random() * (factionNames.length - 1));
            const factionName = factionNames[index];
            return factionName;
        };

        let factionName = randomize();
        while (game?.factions.find(f => f.name === factionName)) {
            factionName = randomize();
        }

        onChange(factionName);
    };

    let errorMessage = '';
    if (game && order > -1) {
        const currentFaction = game.factions[order];
        if (currentFaction.name === FACTION_NONE) {
            errorMessage = 'Select a faction';
        } else {
            const factionsWithSameName = game.factions.filter((f, i) => i !== order && f.name === currentFaction.name);
            if (factionsWithSameName.length) {
                errorMessage = 'Duplicate faction selected';
            }
        }
    }

    return (
        <TextField
            defaultValue={FACTION_NONE}
            error={Boolean(errorMessage)}
            fullWidth
            helperText={errorMessage}
            label="Faction"
            onChange={onSelectChange}
            select
            variant="outlined"
            InputProps={{
                endAdornment: disabled ? null : (
                    <Tooltip title="Randomize">
                        <IconButton onClick={onRandomizeClick}>
                            <DiceIcon fontSize="large" />
                        </IconButton>
                    </Tooltip>
                ),
            }}
            disabled={disabled}
            {...TextFieldProps}
        >
            {!hideNone && (
                <MenuItem key={FACTION_NONE} value={FACTION_NONE}>
                    {FACTION_NONE}
                </MenuItem>
            )}
            {factionNames.map(f => (
                <MenuItem key={f} value={f}>
                    {f}
                </MenuItem>
            ))}
        </TextField>
    );
}

export default FactionSelect;
