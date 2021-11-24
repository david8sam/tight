import { GameChangeDataMap, GameMap, StrategyCardsType } from './Game';
import { PlanetMap } from 'common/Planet';
import { AccountMap } from 'common/Account';

export interface AllData {
    games: GameMap;
    accounts: AccountMap;
    planets: PlanetMap;
    strategyCards: StrategyCardsType;
    factionNames: readonly string[];
}

export interface ChangeData {
    games?: GameChangeDataMap;
    accounts?: AccountMap;
}

export interface Message {
    type: MessageType;
    data?: any;
}

export enum MessageType {
    // Messages from the server
    BROADCAST_INITIALIZE = '/broadcast/initialize',
    BROADCAST_CHANGE = '/broadcast/change',

    // Account actions
    // data: { accountId }
    LIST_ACCOUNTS = '/account/list',
    ACCOUNT_LOGIN = '/account/login',
    ACCOUNT_LOGOUT = '/account/logout',
    ACCOUNT_ADD = '/account/add',
    ACCOUNT_DELETE = '/account/delete',
    ACCOUNT_SET_SETTINGS = '/account/setSettings',

    // Manage games actions
    LIST_GAMES = '/game/list',

    // data: { gameId }
    CREATE_GAME = '/game/create',
    DELETE_GAME = '/game/delete',
    START_GAME = '/game/start',
    STOP_GAME = '/game/stop',
    END_GAME = '/game/end',

    GAME_SET_PUBLIC_OBJECTIVES = '/game/setPublicObjectives',
    GAME_STATUS_SET = '/game/setStatus',
    GAME_NEXT_ROUND = '/game/nextRound',
    GAME_SET_SPEAKER = '/game/setSpeaker',
    GAME_SET_CUSTODIANS_REMOVED = '/game/setCustoidansRemoved',
    GAME_SET_AGENDA_VOTED = '/game/setAgendaVoted',

    // Faction actions
    FACTION_LIST_NAMES = '/faction/listNames',
    // data: { factionName }
    FACTION_GET = '/faction/get',

    // Player actions
    // data: { gameId, playerId }
    PLAYER_JOIN_GAME = '/player/joinGame',
    PLAYER_LEAVE_GAME = '/player/leaveGame',

    PLAYER_SET_COLOR = '/player/setColor',
    PLAYER_SET_FACTION = '/player/setFaction',

    // Strategy Card actions
    // data: { gameId: string, round: number, playerId: string, strategyCard: number }
    PLAYER_TAKE_STRATEGY_CARD = '/player/takeStrategyCard',
    PLAYER_RETURN_STRATEGY_CARD = '/player/returnStrategyCard',
    PLAYER_FLIP_STRATEGY_CARD = '/player/filpStrategyCard',
    PLAYER_RESET_STRATEGY_CARDS = '/player/resetStrategyCards',

    // data: { passed: boolean }
    PLAYER_PASS_TURN = '/player/passTurn',

    // data: { publicObjectives: boolean[] }
    PLAYER_SET_PUBLIC_OBJECTIVES = '/player/setPublicObjective',

    // data: { secretObjective: { cleared: boolean; objective: Objective } }
    PLAYER_SET_SECRET_OBJECTIVE = './player/setSecretObjective',

    // Fluid victory points that can be gained/lost between game rounds. (i.e markers, agenda, etc...)
    // data: { victoryPoints }
    PLAYER_SET_VICTORY_POINTS = '/player/setVictoryPoints',

    // Planet actions
    // data: { gameId, playerId, planetId }
    PLAYER_TAKE_PLANET = '/player/takePlanet', // Player has taken new planet(s)
    PLAYER_LOST_PLANET = '/player/lostPlanet', // Player has lost planet(s)
    PLAYER_EXHAUST_PLANET = '/player/exhaustPlanet',
    PLAYER_REFRESH_PLANET = '/player/refreshPlanet',
    PLAYER_EXHAUST_PLANET_ABILITY = '/player/exhaustPlanetAbility',
    PLAYER_REFRESH_PLANET_ABILITY = '/player/refreshPlanetAbility',

    //
    LIST_PLANETS = '/planet/list',
}
