import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
    Button,
    ButtonProps,
    CircularProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import DeleteIcon from '@material-ui/icons/Delete';

import { GameMap } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';

interface PendingState {
    gameId?: string;
    join?: boolean;
    leave?: boolean;
}

const useStyle = makeStyles(theme => ({
    button: {
        width: 70,
    },
    tableRow: {
        height: 70,
        '&:hover': {
            cursor: 'pointer',
        },
    },
}));

export interface GamesTableProps {
    games: GameMap;
}

function GamesTable(props: GamesTableProps) {
    const classes = useStyle(props);
    const {
        state: { accountId: playerId, accounts },
        sendData,
    } = useAppContext();

    const [pending, setPending] = useState<null | PendingState>(null);

    const history = useHistory();

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
        const playerInGame = player && player.joined;

        if (join && playerInGame) {
            // Joined game, redirect to game status page
            setPending(null);
            history.push(`/player/${playerId}/game`);
        } else if (leave && !playerInGame) {
            setPending(null);
        }
    });

    const onJoinLeaveClick = (gameId: string, join: boolean) => {
        if (pending) {
            return;
        }

        sendData({
            type: join ? MessageType.PLAYER_JOIN_GAME : MessageType.PLAYER_LEAVE_GAME,
            data: { gameId, playerId },
        });

        setPending({ gameId, join, leave: !join });
    };

    const onDeleteGame = (gameId?: string | null, playerId?: string | null) => {
        if (!gameId || !playerId) {
            return;
        }

        sendData({ type: MessageType.DELETE_GAME, data: { gameId, playerId } });
    };

    const joinedGameId = playerId && accounts[playerId] && accounts[playerId].joinedGame;
    const isPending = Boolean(pending);

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell key="name">
                        <Typography>NAME</Typography>
                    </TableCell>
                    <TableCell key="creator">
                        <Typography>CREATOR</Typography>
                    </TableCell>
                    <TableCell key="start" />
                    <TableCell key="delete" />
                </TableRow>
            </TableHead>
            <TableBody>
                {ids.map(id => {
                    const game = games && games[id];
                    const { status, name = '', creator = '', players = {} } = game || {};

                    let button = null;
                    let deleteButton = null;
                    const buttonProps: ButtonProps = { color: 'primary', variant: 'contained', size: 'small' };
                    if (playerId) {
                        const player = players[playerId];
                        const join = !player || !player.joined;
                        const startedCannotJoin = join && status.started && !Boolean(game.players[playerId]);
                        const label = join ? 'Join' : 'Leave';

                        button = (
                            <Button
                                {...buttonProps}
                                classes={{ root: classes.button }}
                                disabled={
                                    isPending || startedCannotJoin || (Boolean(joinedGameId) && joinedGameId !== id)
                                }
                                onClick={() => onJoinLeaveClick(id, join)}
                            >
                                {isPending ? <CircularProgress size={24} /> : label}
                            </Button>
                        );
                    }

                    if (creator === playerId) {
                        deleteButton = (
                            <Tooltip title="Delete Game">
                                <span>
                                    <IconButton onClick={e => onDeleteGame(id, playerId)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        );
                    }

                    return (
                        <TableRow classes={{ root: classes.tableRow }} key={id}>
                            <TableCell align="left">{name}</TableCell>
                            <TableCell align="left">{creator}</TableCell>
                            <TableCell>{button}</TableCell>
                            <TableCell>{deleteButton}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default GamesTable;
