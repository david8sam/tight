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
    planets?: PlanetMap;
    accounts?: AccountMap;
}

export interface Message {
    type: MessageType;
    data?: any;
}

export enum MessageType {
    // Account actions
    // data: { accountId }
    LIST_ACCOUNTS = '/account/list',
    ACCOUNT_LOGIN = '/account/login',
    ACCOUNT_LOGOUT = '/account/logout',
    ACCOUNT_ADD = '/account/add',
    ACCOUNT_DELETE = '/account/delete',

    //
    STATE_ALL = '/state/all',
    STATE_CHANGE = '/state/change',

    // Manage games actions
    LIST_GAMES = '/game/list',
    // data: { gameId }
    CREATE_GAME = '/game/create',
    DELETE_GAME = '/game/delete',
    START_GAME = '/game/start',
    STOP_GAME = '/game/stop',

    GAME_STATUS_SET = '/game/setStatus',

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

    PLAYER_PASS_TURN = '/player/passTurn',
    PLAYER_SET_VICTORY_POINTS = '/player/setVictoryPoints',

    // Planet actions
    // data: { gameId, playerId, planetId }
    PLAYER_TAKE_PLANET = '/player/takePlanet', // Player has taken new planet(s)
    PLAYER_LOST_PLANET = '/player/lostPlanet', // Player has lost planet(s)
    PLAYER_EXHAUST_PLANET = '/player/exhaustPlanet',
    PLAYER_REFRESH_PLANET = '/player/refreshPlanet',

    //
    LIST_PLANETS = '/planet/list',
}
