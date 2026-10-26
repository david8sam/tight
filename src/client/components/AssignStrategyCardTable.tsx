import { MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React from 'react';

import {
    GameClientData,
    GameFaction,
    StrategyCard,
    StrategyCardIndex,
    buildStrategyCardOwners,
    formatFactionName,
    strategyCardHasOwner,
} from 'common/Game';
import { MessageType } from 'common/message';

import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';

function canSelectStrategyCard(strategyCard: StrategyCard, game: GameClientData, faction: GameFaction) {
    // Can always select NONE
    if (strategyCard.initiative === StrategyCardIndex.NONE) {
        return true;
    }

    // Can always select the faction's currently selected card
    if (faction.strategyCard === strategyCard.initiative) {
        return true;
    }

    // Only allow selecting unselected cards
    const stratCardOwners = buildStrategyCardOwners(game);
    return !strategyCardHasOwner(stratCardOwners, strategyCard.initiative);
}

export default function AssignStrategyCardTable() {
    const { sendData } = useAppContext();
    const { game, gameId, playerId, strategyCards, canEditPublicFaction } = useGameInfo();

    if (!game || strategyCards.length === 0) {
        return null;
    }

    const onTakeCardClick = (factionName: string, strategyCard: number) => {
        sendData({ type: MessageType.TAKE_STRATEGY_CARD, data: { gameId, factionName, strategyCard } });
    };

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>FACTION</TableCell>
                    <TableCell>STRATEGY CARD</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {game.factions.map((faction: GameFaction) => {
                    return (
                        <TableRow key={faction.name}>
                            <TableCell>{formatFactionName(game, faction.name)}</TableCell>
                            <TableCell>
                                <Select
                                    inputProps={{ 'aria-label': `Strategy card for ${faction.name}` }}
                                    fullWidth
                                    value={faction.strategyCard}
                                    variant="outlined"
                                    onChange={e => onTakeCardClick(faction.name, Number(e.target.value))}
                                    disabled={!canEditPublicFaction(faction.name)}
                                >
                                    <MenuItem key={0} value={0}>
                                        None
                                    </MenuItem>
                                    {faction.strategyCard !== StrategyCardIndex.NONE &&
                                        !strategyCards.some(card => card.initiative === faction.strategyCard) && (
                                            <MenuItem value={faction.strategyCard}>
                                                {StrategyCardIndex[faction.strategyCard]
                                                    .split('_')
                                                    .map(word => word[0] + word.slice(1).toLowerCase())
                                                    .join(' ')}
                                            </MenuItem>
                                        )}
                                    {strategyCards
                                        .filter(s => canSelectStrategyCard(s, game, faction))
                                        .map(s => (
                                            <MenuItem key={s.initiative} value={s.initiative}>
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
