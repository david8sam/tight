import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
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
}

function FactionsSetup(props: FactionsSetupProps) {
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();
    const { factions, players } = game || {};
    const { disableFactionSelect, disableColorNone } = props;

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

    return (
        <Table>
            <TableBody>
                {factions.map(({ name, color, playerIds }, i) => (
                    <TableRow key={i}>
                        <TableCell sx={{ width: '40px' }}>{i + 1}</TableCell>
                        <TableCell sx={{ display: 'flex', flexDirection: 'column' }}>
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
