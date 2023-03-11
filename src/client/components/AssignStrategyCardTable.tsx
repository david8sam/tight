import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem } from '@material-ui/core';

import {
    buildStrategyCardOwners,
    Game,
    GameJoinStatus,
    GamePlayer,
    getPlayersInGame,
    StrategyCard,
    strategyCardHasOwner,
    StrategyCardIndex,
} from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';

function canSelectStrategyCard(strategyCard: StrategyCard, game: Game, player: GamePlayer) {
    // Can always select NONE
    if (strategyCard.initiative === StrategyCardIndex.NONE) {
        return true;
    }

    // Can always select the player's currently selected card
    if (player.strategyCard === strategyCard.initiative) {
        return true;
    }

    // Only allow selecting unselected cards
    const stratCardOwners = buildStrategyCardOwners(game);
    return !strategyCardHasOwner(stratCardOwners, strategyCard.initiative);
}

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
                                    {strategyCards
                                        .filter(s => canSelectStrategyCard(s, game, player))
                                        .map(s => (
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
