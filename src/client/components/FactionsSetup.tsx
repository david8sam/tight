import { MenuItem, Select, SelectProps, Table, TableBody, TableCell, TableRow } from '@mui/material';
import React, { useCallback } from 'react';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';

import useGameInfo from '../hooks/useGameInfo';
import api from '../utils/api';
import useRemoteData from '../hooks/useRemoteData';
import LoadFailure from './LoadFailure';

import ColorSelect from './ColorSelect';
import FactionSelect from './FactionSelect';
import PlayerSelect from './PlayerSelect';

interface FactionsSetupProps {
    disableFactionSelect?: boolean;
    disableColorNone?: boolean;
    disableReordering?: boolean;
}

function FactionsSetup(props: FactionsSetupProps) {
    const {
        sendData,
        state: { pendingCommands },
    } = useAppContext();
    const { game, gameId, isHost } = useGameInfo();
    const { factions, players } = game || {};
    const { disableFactionSelect, disableColorNone, disableReordering } = props;

    const load = useCallback((signal: AbortSignal) => api.factionListNames(undefined, { signal }), []);
    const { resource, retry } = useRemoteData(load);
    if (resource.kind === 'error') return <LoadFailure retry={retry} />;
    const factionNames = resource.kind === 'loaded' ? resource.data : [];

    if (!game || !factions || factionNames.length === 0) {
        return null;
    }

    if (!isHost)
        return (
            <Table aria-label="Faction assignments">
                <TableBody>
                    {factions.map(faction => (
                        <TableRow key={faction.name}>
                            <TableCell>{faction.name}</TableCell>
                            <TableCell>{faction.playerIds.join(', ') || 'No players assigned'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );

    const onFactionChange = (i: number, factionName: string) => {
        sendData({ type: MessageType.GAME_UPDATE_FACTION, data: { gameId, order: i, name: factionName } });
    };

    const onColorChange = (i: number, color: string) => {
        sendData({ type: MessageType.GAME_UPDATE_FACTION, data: { gameId, order: i, color } });
    };

    const onPlayerChange = (i: number, playerIds: string[]) => {
        sendData({ type: MessageType.GAME_UPDATE_FACTION, data: { gameId, order: i, playerIds } });
    };

    const onFactionReorder: NonNullable<SelectProps['onChange']> = e => {
        const index = Number(e.target.name);
        const newIndex = e.target.value;
        if (index !== newIndex) {
            sendData({ type: MessageType.GAME_REORDER_FACTION, data: { gameId, index, newIndex } });
        }
    };

    const playerOrderOptions = Array.from({ length: factions.length }).map((_, i) => ({
        value: i,
        label: `${i + 1}`,
    }));

    return (
        <Table
            aria-label="Faction setup"
            sx={{
                '& .MuiOutlinedInput-root': { height: { md: 44 } },
                '& .MuiSelect-select': { py: { md: '10.5px' } },
                '& .MuiFormHelperText-root': { lineHeight: { md: '15px' }, mt: { md: '1px' } },
                '& .MuiIconButton-root': { p: { md: 0.5 }, mr: { md: 3 }, minWidth: { md: 44 }, minHeight: { md: 44 } },
            }}
        >
            <TableBody>
                {factions.map(({ name, color, playerIds }, i) => (
                    <TableRow key={i}>
                        <TableCell
                            sx={{
                                padding: { xs: '16px 8px 0px 8px', md: '6px 8px 0px 8px' },
                                width: '60px',
                                textAlign: 'center',
                                verticalAlign: 'top',
                            }}
                        >
                            <Select
                                sx={{ padding: 0 }}
                                name={`${i}`}
                                value={i}
                                onChange={onFactionReorder}
                                inputProps={{
                                    'aria-label': `Position for player slot ${i + 1}`,
                                    sx: { paddingLeft: '4px' },
                                }}
                                disabled={disableReordering || pendingCommands > 0}
                            >
                                {playerOrderOptions.map(o => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </TableCell>
                        <TableCell
                            sx={{
                                display: { xs: 'flex', md: 'grid' },
                                flexDirection: 'column',
                                gridTemplateColumns: { md: 'minmax(0, 1.5fr) minmax(0, 0.7fr) minmax(0, 1.2fr)' },
                                gap: { md: 1.5 },
                                width: '100%',
                                padding: { xs: '16px 8px 16px 0px', md: '6px 8px 1px 0px' },
                            }}
                        >
                            <FactionSelect
                                disabled={disableFactionSelect || pendingCommands > 0}
                                sx={{ marginBottom: { xs: 1, md: 0 }, minWidth: 0 }}
                                order={i}
                                factionNames={factionNames}
                                value={name}
                                onChange={name => onFactionChange(i, name)}
                            />
                            <ColorSelect
                                disabled={pendingCommands > 0}
                                sx={{ marginBottom: { xs: 1, md: 0 }, minWidth: 0 }}
                                order={i}
                                value={color}
                                onChange={color => onColorChange(i, color)}
                                disableNone={disableColorNone}
                            />
                            <PlayerSelect
                                sx={{ minWidth: 0 }}
                                disabled={pendingCommands > 0}
                                playerNames={players || []}
                                value={playerIds}
                                onChange={player => onPlayerChange(i, player)}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default FactionsSetup;
