import { MenuItem, Select, SelectProps, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';

import useGameInfo from '../hooks/useGameInfo';
import api from '../utils/api';

import ColorSelect from './ColorSelect';
import FactionSelect from './FactionSelect';
import PlayerSelect from './PlayerSelect';

interface FactionsSetupProps {
    disableFactionSelect?: boolean;
    disableColorNone?: boolean;
    disableReordering?: boolean;
}

function FactionsSetup(props: FactionsSetupProps) {
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();
    const { factions, players } = game || {};
    const { disableFactionSelect, disableColorNone, disableReordering } = props;

    const [factionNames, setFactionNames] = useState<string[]>([]);
    useEffect(() => {
        api.factionListNames().then(names => setFactionNames(names));
    }, []);

    if (!game || !factions || factionNames.length === 0) {
        return null;
    }

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
        <Table>
            <TableBody>
                {factions.map(({ name, color, playerIds }, i) => (
                    <TableRow key={i}>
                        <TableCell
                            sx={{
                                padding: '16px 8px 0px 8px',
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
                                inputProps={{ sx: { paddingLeft: '4px' } }}
                                disabled={disableReordering}
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
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                padding: '16px 8px 16px 0px',
                            }}
                        >
                            <FactionSelect
                                disabled={disableFactionSelect}
                                sx={{ marginBottom: 1 }}
                                order={i}
                                factionNames={factionNames}
                                value={name}
                                onChange={name => onFactionChange(i, name)}
                            />
                            <ColorSelect
                                sx={{ marginBottom: 1 }}
                                order={i}
                                value={color}
                                onChange={color => onColorChange(i, color)}
                                disableNone={disableColorNone}
                            />
                            <PlayerSelect
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
