import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';

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
    const { players, status } = game;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>PLAYERS:</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {status.pickOrder.map(id => (
                    <TableRow key={id}>
                        <TableCell>
                            <PlayerFactionForm disabled={disabled} player={players[id]} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default PlayerFactions;
