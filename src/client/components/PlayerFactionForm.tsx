import React, { ChangeEvent, useEffect, useState } from 'react';
import { Grid, MenuItem, Select, useTheme } from '@mui/material';

import { GamePlayer, GameJoinStatus } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { PlayerColor, PlayerColorValue } from '../utils/player';
import FactionSelect, { DEFAULT_FACTION_VALUE } from './FactionSelect';

type ColorChangeOptions = { gameId: string; playerId: string; color: PlayerColorValue | 'COLOR' };
type FactionChangeOptions = { gameId: string; playerId: string; factionName: string };

export interface PlayerSetupFormProps {
    player: GamePlayer;
    disabled?: boolean;
}

const DEFAULT_COLOR = 'COLOR';
const NoIcon = () => null;

function PlayerFactionForm(props: PlayerSetupFormProps) {
    const theme = useTheme();
    const { state, sendData } = useAppContext();
    const { playerId: accountId, game, gameId, player: accountPlayer } = useAccountInfo();
    const isAdmin = accountPlayer?.joinStatus === GameJoinStatus.ADMIN;

    const [pendingColor, setPendingColor] = useState<PlayerColorValue | null>(null);
    const [pendingFaction, setPendingFaction] = useState<string | null>(null);

    const { factionNames } = state;
    const { player, disabled: disabledProp } = props;

    useEffect(() => {
        if (!player || !pendingFaction || !pendingColor) {
            return;
        }

        if (pendingColor === player.color) {
            setPendingColor(null);
        }

        if (pendingFaction === player.faction) {
            setPendingFaction(null);
        }
    });

    if (!game || !gameId || !accountId) {
        return null;
    }

    const colorOptions = Object.entries(PlayerColor).map(([label, value]: [string, PlayerColorValue]) => ({
        label,
        value,
    }));

    const { id, name, color, faction } = player;

    let selectStyle = {};
    if (color) {
        selectStyle = {
            color: theme.palette.getContrastText(color),
            backgroundColor: color,
        };
    }

    // Always allow admins and the game creator to make changes.
    // Otherwise disable for everyone except the current player or if parent component says so.
    const disabled = isAdmin || accountId === game.creator ? false : accountId !== id || disabledProp;

    const onColorChange = ({ gameId, playerId, color }: ColorChangeOptions) => {
        if (color === DEFAULT_COLOR) {
            return;
        }

        setPendingColor(color);
        sendData({ type: MessageType.PLAYER_SET_COLOR, data: { gameId, playerId, color } });
    };

    const onFactionChange = ({ gameId, playerId, factionName }: FactionChangeOptions) => {
        if (factionName === DEFAULT_FACTION_VALUE) {
            return;
        }

        setPendingFaction(factionName);
        sendData({ type: MessageType.PLAYER_SET_FACTION, data: { gameId, playerId, factionName } });
    };

    return (
        <Grid container direction="column">
            <Grid container>{name}</Grid>
            <Grid container direction="row" justifyContent="flex-start" spacing={1}>
                <Grid item xs={4}>
                    <Select
                        disabled={disabled}
                        IconComponent={disabled ? NoIcon : undefined}
                        fullWidth
                        variant="outlined"
                        style={selectStyle}
                        value={color || DEFAULT_COLOR}
                        onChange={e =>
                            onColorChange({ gameId, playerId: id, color: e.target.value as PlayerColorValue | 'COLOR' })
                        }
                    >
                        <MenuItem divider disabled key={DEFAULT_COLOR} value={DEFAULT_COLOR}>
                            {DEFAULT_COLOR}
                        </MenuItem>
                        {colorOptions.map(({ label, value }: { label: string; value: PlayerColorValue }) => (
                            <MenuItem
                                key={label}
                                style={{ color: theme.palette.getContrastText(value), backgroundColor: value }}
                                value={value}
                            >
                                {label}
                            </MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={8}>
                    <FactionSelect
                        factionNames={factionNames}
                        disabled={disabled}
                        IconComponent={disabled ? NoIcon : undefined}
                        fullWidth
                        value={faction || DEFAULT_FACTION_VALUE}
                        onChange={e => onFactionChange({ gameId, playerId: id, factionName: e.target.value as string })}
                    />
                </Grid>
            </Grid>
        </Grid>
    );
}

export default PlayerFactionForm;
