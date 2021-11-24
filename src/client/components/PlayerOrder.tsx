import React, { ChangeEvent } from 'react';
import { MenuItem, Select, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { MessageType } from 'common/message';

const DEFAULT_PLAYER = 'PLAYER';

function PlayerOrder() {
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();
    if (!game) {
        return null;
    }

    const { status } = game;
    const { speaker, pickOrder } = status;

    const playerNames = Object.values(game.players).map(p => p.name);
    const orderArray = Array(playerNames.length).fill(null);

    const onOrderChange = (playerId: string, order: number) => {
        const newSpeaker = order === 0 ? playerId : speaker;
        const newPickOrder = [...pickOrder];
        newPickOrder[order] = playerId;

        sendData({ type: MessageType.GAME_STATUS_SET, data: { gameId, pickOrder: newPickOrder, speaker: newSpeaker } });
    };

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>ORDER</TableCell>
                    <TableCell>PLAYER</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {orderArray.map((o: undefined, i: number) => {
                    return (
                        <TableRow key={i}>
                            <TableCell>{i === 0 ? 'Speaker' : i + 1}</TableCell>
                            <TableCell>
                                <Select
                                    fullWidth
                                    variant="outlined"
                                    value={pickOrder[i] || DEFAULT_PLAYER}
                                    onChange={(e: ChangeEvent<{ value: unknown }>) =>
                                        onOrderChange(e.target.value as string, i)
                                    }
                                >
                                    <MenuItem key={DEFAULT_PLAYER} value={DEFAULT_PLAYER} button disabled divider>
                                        {DEFAULT_PLAYER}
                                    </MenuItem>
                                    {playerNames.map((name: string) => (
                                        <MenuItem key={name} value={name} button>
                                            {name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default PlayerOrder;
