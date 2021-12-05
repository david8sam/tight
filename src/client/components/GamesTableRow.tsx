import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
    Button,
    ButtonProps,
    CircularProgress,
    Divider,
    IconButton,
    ListItemIcon,
    MenuItem,
    MenuList,
    Popover,
    TableCell,
    TableRow,
    Typography,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { makeStyles } from '@material-ui/styles';

import { GameJoinStatus, Game } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import TextWithTooltip from './TextWithTooltip';

const useStyle = makeStyles(() => ({
    root: {
        height: 70,
        '&:hover': {
            cursor: 'pointer',
        },
    },
    button: {
        width: 70,
    },
}));

export interface GamesTableRowProps {
    game: Game;
    onJoin: (params: { gameId: string; join: boolean; leave: boolean }) => void;
    isPending: boolean;
}

function GamesTableRow(props: GamesTableRowProps) {
    const classes = useStyle(props);
    const {
        state: { account },
        sendData,
    } = useAppContext();

    const playerId = account?.id;

    const rowOptionsRef = useRef<HTMLButtonElement>(null);
    const [rowOptionsOpen, setRowOptionsOpen] = useState(false);

    const [params] = useSearchParams();
    const allowAdmin = params.has('admin');

    const { game, onJoin, isPending } = props;
    const { id, status, name = '', creator = '', players = {} } = game;

    const onJoinLeaveClick = (gameId: string, join: boolean, joinOptions?: { joinStatus: GameJoinStatus }) => {
        if (isPending) {
            return;
        }

        setRowOptionsOpen(false);

        const options = join ? joinOptions : null;

        sendData({
            type: join ? MessageType.PLAYER_JOIN_GAME : MessageType.PLAYER_LEAVE_GAME,
            data: { gameId, playerId, ...options },
        });

        onJoin({ gameId, join, leave: !join });
    };

    const onDeleteGame = (gameId?: string | null, playerId?: string | null) => {
        if (!gameId || !playerId) {
            return;
        }

        setRowOptionsOpen(false);
        sendData({ type: MessageType.DELETE_GAME, data: { gameId, playerId } });
    };

    const joinedGameId = playerId && account?.joinedGame;
    const playerInAGame = Boolean(joinedGameId);

    let button = null;
    const buttonProps: ButtonProps = { color: 'primary', variant: 'contained', size: 'small' };
    const player = playerId ? players[playerId] : null;
    if (playerId) {
        // Join if player is not currently joined in the game
        const join = player ? !player.joined : true;

        // If rejoining, set to same status as before.
        let joinStatus = player ? player.joinStatus : GameJoinStatus.PLAYER;

        // Spectate if player never joined and game has either already started or is full.
        if (!player && (status.started || Object.keys(game.players).length === game.numPlayers)) {
            joinStatus = GameJoinStatus.SPECTATOR;
        }

        // Set label based on join status
        let label = 'Join';
        if (join) {
            switch (joinStatus) {
                case GameJoinStatus.ADMIN:
                    label = 'Admin';
                    break;
                case GameJoinStatus.SPECTATOR:
                    label = 'Spectate';
                    break;
                default:
                    break;
            }
        } else {
            label = 'Leave';
        }

        button = (
            <Button
                {...buttonProps}
                classes={{ root: classes.button }}
                disabled={isPending || (playerInAGame && joinedGameId !== id)}
                onClick={() => onJoinLeaveClick(id, join, { joinStatus })}
            >
                {isPending ? <CircularProgress size={24} /> : label}
            </Button>
        );
    }

    const canAdmin = !playerInAGame && allowAdmin && (!player || player.joinStatus !== GameJoinStatus.PLAYER);
    const canSpectate = !playerInAGame && (!player || player.joinStatus !== GameJoinStatus.PLAYER);

    return (
        <TableRow className={classes.root} key={id}>
            <TableCell align="left" width="30%">
                <TextWithTooltip text={name} />
            </TableCell>
            {/* maxWidth must be less than calculated width for percentage to be applied */}
            <TableCell align="left" width="40%" style={{ maxWidth: 1 }}>
                <TextWithTooltip text={creator} />
            </TableCell>
            <TableCell width="20%">{button}</TableCell>
            <TableCell width="10%">
                <IconButton ref={rowOptionsRef} onClick={() => setRowOptionsOpen(true)}>
                    <MoreVertIcon />
                </IconButton>
                <Popover
                    open={rowOptionsOpen}
                    onClose={() => setRowOptionsOpen(false)}
                    anchorEl={rowOptionsRef.current}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuList>
                        {canAdmin && (
                            <MenuItem onClick={() => onJoinLeaveClick(id, true, { joinStatus: GameJoinStatus.ADMIN })}>
                                <ListItemIcon>
                                    <SupervisorAccountIcon />
                                </ListItemIcon>
                                <Typography>Admin</Typography>
                            </MenuItem>
                        )}
                        <MenuItem
                            disabled={!canSpectate}
                            onClick={() => onJoinLeaveClick(id, true, { joinStatus: GameJoinStatus.SPECTATOR })}
                        >
                            <ListItemIcon>
                                <VisibilityIcon />
                            </ListItemIcon>
                            <Typography>Spectate</Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem
                            disabled={allowAdmin ? false : creator !== playerId}
                            onClick={() => onDeleteGame(id, allowAdmin ? creator : playerId)}
                        >
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <Typography>Delete</Typography>
                        </MenuItem>
                    </MenuList>
                </Popover>
            </TableCell>
        </TableRow>
    );
}

export default GamesTableRow;
