import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem } from '@material-ui/core';

import { GamePlayer, StrategyCardIndex } from 'common/Game';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { MessageType } from 'common/message';

export default function AssignStrategyCardTable(props: object) {
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();
    if (!game) {
        return null;
    }

    const playersArray = Object.values(game.players);
    const allValues = Object.values(StrategyCardIndex);
    const strategyCards = allValues.slice(0, allValues.length / 2 - 1) as StrategyCardIndex[];

    const onTakeCardClick = (playerId: string, cardName: StrategyCardIndex) => {
        const strategyCard = StrategyCardIndex[cardName as StrategyCardIndex];
        sendData({ type: MessageType.PLAYER_TAKE_STRATEGY_CARD, data: { gameId, playerId, strategyCard } });
    };

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>PLAYER</TableCell>
                    <TableCell>STRATEGY CARD</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {playersArray.map((player: GamePlayer) => {
                    return (
                        <TableRow key={player.id}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell>
                                <Select
                                    fullWidth
                                    value={StrategyCardIndex[player.strategyCard]}
                                    variant="outlined"
                                    onChange={e => onTakeCardClick(player.id, e.target.value as StrategyCardIndex)}
                                >
                                    {strategyCards.map((s: StrategyCardIndex) => (
                                        <MenuItem button key={s} value={s}>
                                            {s}
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
