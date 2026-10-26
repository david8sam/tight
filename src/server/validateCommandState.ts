import { Game, StrategyCardIndex } from 'common/Game.js';
import { MessageType } from 'common/message.js';
import { ClientCommand } from './commandSchemas.js';

// Rules that depend on the selected game live at the command boundary, after schema parsing.
export default function validateCommandState(command: ClientCommand, game: Game): string | null {
    const { type, data } = command;
    const names = game.factions.map(faction => faction.name);
    if ('factionName' in data && data.factionName !== undefined && !names.includes(data.factionName)) {
        return 'Faction is not in this game';
    }
    switch (type) {
        case MessageType.GAME_UPDATE_FACTION:
            if (data.order >= game.factions.length) return 'Faction index out of bounds';
            if (game.status.started && data.name !== undefined && data.name !== names[data.order])
                return 'Cannot replace an active faction';
            if (data.playerIds?.some(id => !Object.hasOwn(game.players, id))) return 'Unknown player';
            break;
        case MessageType.GAME_REORDER_FACTION:
            if (data.index >= game.factions.length || data.newIndex >= game.factions.length) {
                return 'Faction index out of bounds';
            }
            break;
        case MessageType.GAME_ADD_PLAYER:
            if (
                data.playerId &&
                !Object.hasOwn(game.players, data.playerId) &&
                Object.keys(game.players).length >= 32
            ) {
                return 'Game player limit reached';
            }
            break;
        case MessageType.GAME_STATUS_SET: {
            const order = data.pickOrder ?? game.status.pickOrder;
            if (
                data.turn !== undefined &&
                data.turn !== StrategyCardIndex.NONE &&
                data.turn !== StrategyCardIndex.END &&
                !game.factions.some(faction => faction.strategyCard === data.turn)
            ) {
                return 'Turn has no assigned faction';
            }
            if (
                data.pickOrder &&
                (order.length !== names.length ||
                    new Set(order).size !== names.length ||
                    order.some(name => !names.includes(name)))
            ) {
                return 'Invalid pick order';
            }
            if (data.pickTurn !== undefined && data.pickTurn >= order.length) return 'Pick index out of bounds';
            if (data.speaker !== undefined && (!data.pickOrder || data.speaker !== order[0])) return 'Invalid speaker';
            if (data.phase !== undefined && Math.abs(data.phase - game.status.phase) === 2)
                return 'Cannot skip a phase';
            break;
        }
        case MessageType.GAME_SET_SPEAKER:
            if (!game.status.pickOrder.includes(data.speaker)) return 'Speaker is not in pick order';
            break;
        case MessageType.START_GAME:
            if (new Set(names).size !== names.length || names.includes('None')) return 'Complete faction setup first';
            if (
                new Set(game.factions.map(faction => faction.color)).size !== names.length ||
                game.factions.some(faction => faction.color === 'None')
            )
                return 'Complete color setup first';
            if (!game.factions.some(faction => faction.playerIds.length > 0)) return 'Assign a player first';
            if (
                game.status.pickOrder.length !== names.length ||
                new Set(game.status.pickOrder).size !== names.length ||
                game.status.pickOrder.some(name => !names.includes(name))
            )
                return 'Complete pick order first';
            break;
        case MessageType.TAKE_STRATEGY_CARD:
            if (data.strategyCard === StrategyCardIndex.END) return 'Invalid strategy card';
            break;
        case MessageType.SET_PUBLIC_OBJECTIVES:
            if (
                data.publicObjectives.some(
                    (cleared, index) => cleared && !game.publicObjectives.some(objective => objective.id === index + 1),
                )
            ) {
                return 'Unknown scored objective';
            }
            break;
        default:
            break;
    }
    return null;
}
