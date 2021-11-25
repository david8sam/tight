import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';

import { GamePlayer, getPlayersInGame } from 'common/Game';

import useAccountInfo from '../hooks/useAccountInfo';
import PlayerFactionForm from './PlayerFactionForm';

interface PlayerFactionsProps {
    disabled?: boolean;
}

function PlayerFactions(props: PlayerFactionsProps) {
    const { game, player } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const { disabled = false } = props;
    const joinedPlayers = getPlayersInGame(game);

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>PLAYERS:</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {joinedPlayers.map((p: GamePlayer) => (
                    <TableRow key={p.id}>
                        <TableCell>
                            <PlayerFactionForm disabled={disabled} player={p} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default PlayerFactions;
