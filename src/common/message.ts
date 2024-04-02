import { GameChangeData, GameClientData, GamePlayer, StrategyCard } from './Game.js';

export interface AllData {
    socketId: string;
    game: GameClientData | null;
    playerId: string | null;
    strategyCards: StrategyCard[];
}

export interface PartialData extends Partial<AllData> {}

export interface ChangeData {
    game: GameChangeData;
    playerId?: string;
}

// TODO: Type per message type.
export interface Message {
    type: MessageType;
    data?: any;
}

// TODO: Convert/simplify to numerical squential enum
export enum MessageType {
    // Messages from the server
    BROADCAST_INITIALIZE = 0,
    BROADCAST_CHANGE,

    // data: { gameId }
    CREATE_GAME,
    DELETE_GAME,
    START_GAME,
    STOP_GAME,
    END_GAME,

    GAME_SET_PUBLIC_OBJECTIVES,
    GAME_STATUS_SET,
    GAME_NEXT_ROUND,
    GAME_SET_SPEAKER,
    GAME_SET_CUSTODIANS_REMOVED,
    GAME_SET_AGENDA_VOTED,

    // data: { gameId, playerId }
    GAME_LOAD,
    GAME_ADD_PLAYER,

    // data: { gameId, factionName }
    GAME_UPDATE_FACTION,

    // Player actions
    // data: { gameId, playerId }

    // Strategy Card actions
    // data: { gameId: string, round: number, playerId: string, strategyCard: number }
    TAKE_STRATEGY_CARD,
    RETURN_STRATEGY_CARD,
    FLIP_STRATEGY_CARD,
    RESET_STRATEGY_CARDS,
    TAKE_NAALU_ZERO_TOKEN,

    // data: { passed: boolean }
    PASS_TURN,

    // data: { publicObjectives: boolean[] }
    SET_PUBLIC_OBJECTIVES,

    // data: { secretObjectives: { cleared: boolean; objective: Objective }[] }
    SET_SECRET_OBJECTIVE,

    // Fluid victory points that can be gained/lost between game rounds. (i.e markers, agenda, etc...)
    // data: { victoryPoints }
    SET_VICTORY_POINTS,

    // Planet actions
    // data: { gameId, playerId, planetId }
    TAKE_PLANET, // Player has taken new planet(s)
    LOST_PLANET, // Player has lost planet(s)
    EXHAUST_PLANET,
    REFRESH_PLANET,
    EXHAUST_PLANET_ABILITY,
    REFRESH_PLANET_ABILITY,

    UPDATE_PLANET,
}
