import React from 'react';
import { Select, MenuItem, SelectProps } from '@mui/material';

export const DEFAULT_FACTION_VALUE = 'FACTION';

export type FactionSelectProps = Omit<SelectProps, 'variant'> & {
    factionNames: string[];
};

function FactionSelect(props: FactionSelectProps) {
    const { factionNames, ...SelectProps } = props;

    return (
        <Select variant="outlined" {...SelectProps}>
            <MenuItem divider disabled key={DEFAULT_FACTION_VALUE} value={DEFAULT_FACTION_VALUE}>
                {DEFAULT_FACTION_VALUE}
            </MenuItem>
            {factionNames.map(f => (
                <MenuItem key={f} value={f}>
                    {f}
                </MenuItem>
            ))}
        </Select>
    );
}

export default FactionSelect;
