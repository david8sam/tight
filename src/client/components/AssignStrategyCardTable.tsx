import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem } from '@material-ui/core';

import { GameJoinStatus, GamePlayer, getPlayersInGame, StrategyCard } from 'common/Game';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { MessageType } from 'common/message';

export default function AssignStrategyCardTable() {
    const { state, sendData } = useAppContext();
    const { strategyCards } = state;
    const { game, gameId, player: currentPlayer } = useAccountInfo();
    if (!game || !currentPlayer) {
        return null;
    }

    const playersArray = getPlayersInGame(game);

    const onTakeCardClick = (playerId: string, strategyCard: number) => {
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
                                    value={player.strategyCard}
                                    variant="outlined"
                                    onChange={e => onTakeCardClick(player.id, Number(e.target.value))}
                                    disabled={currentPlayer.joinStatus === GameJoinStatus.SPECTATOR}
                                >
                                    <MenuItem button key={0} value={0}>
                                        {'NONE'}
                                    </MenuItem>
                                    {strategyCards.map((s: StrategyCard) => (
                                        <MenuItem button key={s.initiative} value={s.initiative}>
                                            {s.name}
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
