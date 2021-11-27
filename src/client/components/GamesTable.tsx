import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { GameMap } from 'common/Game';

import { useAppContext } from '../Context';
import GamesTableRow from './GamesTableRow';

interface PendingState {
    gameId?: string;
    join?: boolean;
    leave?: boolean;
}

export interface GamesTableProps {
    games: GameMap;
}

function GamesTable(props: GamesTableProps) {
    const {
        state: { accountId: playerId, accounts },
    } = useAppContext();

    const [pending, setPending] = useState<null | PendingState>(null);

    const navigate = useNavigate();

    const { games } = props;

    const ids = games ? Object.keys(games) : [];
    ids.sort((id1: string, id2: string) => {
        const g1 = games[id1];
        const g2 = games[id2];
        if (g1.date === g2.date) {
            return 0;
        }

        // Sort by reverse creation date. (Newest on top)
        return g1.date > g2.date ? -1 : 1;
    });

    useEffect(() => {
        if (!pending || !playerId) {
            return;
        }

        const { gameId, join, leave }: PendingState = pending || {};
        const game = gameId ? games[gameId] : null;
        const player = game && game.players[playerId];
        const playerInGame = player?.joined;

        if (join && playerInGame) {
            // Joined game, redirect to game status page
            setPending(null);
            navigate(`/player/${playerId}/game`);
        } else if (leave && !playerInGame) {
            setPending(null);
        }
    });

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell key="name" width="30%">
                        <Typography>NAME</Typography>
                    </TableCell>
                    <TableCell key="creator" width="40%">
                        <Typography>CREATOR</Typography>
                    </TableCell>
                    <TableCell key="join" width="20%" />
                    <TableCell key="options" width="10%" />
                </TableRow>
            </TableHead>
            <TableBody>
                {games &&
                    ids.map(id => (
                        <GamesTableRow key={id} game={games[id]} onJoin={setPending} isPending={Boolean(pending)} />
                    ))}
            </TableBody>
        </Table>
    );
}

export default GamesTable;
