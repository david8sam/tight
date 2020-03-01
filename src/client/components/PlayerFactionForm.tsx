import React, { ChangeEvent, useEffect, useState } from 'react';

import { Grid, MenuItem, Select, Theme } from '@material-ui/core';
import { useTheme } from '@material-ui/styles';

import { PlayerColor, PlayerColorValue, GamePlayer } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import FactionSelect, { DEFAULT_FACTION_VALUE } from './FactionSelect';

export interface OnColorChange {
    ({ gameId, playerId, color }: { gameId: string; playerId: string; color: PlayerColorValue }): void;
}

export interface OnFactionChange {
    ({ gameId, playerId, factionName }: { gameId: string; playerId: string; factionName: string }): void;
}

export interface PlayerSetupFormProps {
    player: GamePlayer;
    disabled?: boolean;
}

const DEFAULT_COLOR = 'COLOR';
const NoIcon = () => null;

function PlayerFactionForm(props: PlayerSetupFormProps) {
    const theme: Theme = useTheme();
    const { playerId: accountId, game, gameId } = useAccountInfo();
    const { state, sendData } = useAppContext();

    const [pendingColor, setPendingColor] = useState<PlayerColorValue | null>(null);
    const [pendingFaction, setPendingFaction] = useState<string | null>(null);

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

    const { factionNames } = state;
    const { player, disabled: disabledProp } = props;

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

    const disabled = accountId !== game.creator && (disabledProp || accountId !== id);

    const onColorChange: OnColorChange = ({ gameId, playerId, color }) => {
        if (color === DEFAULT_COLOR) {
            return;
        }

        setPendingColor(color);
        sendData({ type: MessageType.PLAYER_SET_COLOR, data: { gameId, playerId, color } });
    };

    const onFactionChange: OnFactionChange = ({ gameId, playerId, factionName }) => {
        if (factionName === DEFAULT_FACTION_VALUE) {
            return;
        }

        setPendingFaction(factionName);
        sendData({ type: MessageType.PLAYER_SET_FACTION, data: { gameId, playerId, factionName } });
    };

    return (
        <Grid container direction="column">
            <Grid container>{name}</Grid>
            <Grid container direction="row" justify="flex-start" spacing={1}>
                <Grid item xs={4}>
                    <Select
                        disabled={disabled}
                        IconComponent={disabled ? NoIcon : undefined}
                        fullWidth
                        variant="outlined"
                        style={selectStyle}
                        value={color || DEFAULT_COLOR}
                        onChange={(e: ChangeEvent<{ value: unknown }>) =>
                            onColorChange({ gameId, playerId: id, color: e.target.value as PlayerColorValue })
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
                        onChange={(e: ChangeEvent<{ value: unknown }>) =>
                            onFactionChange({ gameId, playerId: id, factionName: e.target.value as string })
                        }
                    />
                </Grid>
            </Grid>
        </Grid>
    );
}

export default PlayerFactionForm;
