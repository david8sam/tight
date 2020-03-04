import { colors } from '@material-ui/core';

export const PlayerColor = {
    RED: colors.red.A700,
    YELLOW: colors.yellow[500],
    GREEN: colors.green[500],
    BLUE: colors.blue.A700,
    PURPLE: colors.deepPurple[500],
    BLACK: '#000',
};

export type PlayerColorKey = keyof typeof PlayerColor;
export type PlayerColorValue = typeof PlayerColor[PlayerColorKey];

export enum Version {
    TI3 = '3',
    TI4 = '4',
}

export enum Phase {
    STRATEGY,
    ACTION,
    STATUS,
    AGENDA,
}

export interface StrategyCard {
    name: string;
    initiative: number;
    primary: string[];
    secondary: string[];
}

export type StrategyCardsType = readonly [
    undefined,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
    Readonly<StrategyCard>,
];

export enum StrategyCardIndex {
    NONE = 0,
    LEADERSHIP,
    DIPLOMACY,
    POLITICS,
    CONSTRUCTION,
    TRADE,
    WARFARE,
    TECHNOLOGY,
    IMPERIAL,
    END,
}

export interface GameStatus {
    started: boolean;
    round: number;
    phase: Phase;
    turn: StrategyCardIndex;
    speaker: string;
    pickOrder: string[]; // starting with speaker, the order of players for picking strategy cards
    pickTurn: number;
    passed: string[]; // list of players that pased on the current round
}

export interface GamePlanet {
    name: string;
    owner: string | null;
    refreshed: boolean;
}

export interface GamePlanetMap {
    [name: string]: GamePlanet;
}

export interface GamePlayer {
    id: string;
    name: string;
    joined: boolean;

    color?: PlayerColorValue | null;
    faction?: string | null;

    strategyCard: StrategyCardIndex;
    strategyCardTaken: boolean;
    stragetyCardUsed: boolean;

    planets: string[];
    victoryPoints: number;
}

export interface GamePlayerMap {
    [id: string]: GamePlayer;
}

export interface Game {
    readonly id: string;
    readonly date: number;
    readonly version: Version;
    name: string;
    creator: string;
    players: GamePlayerMap;
    planets: GamePlanetMap;
    status: GameStatus;
    lastSaved?: number;
}

export interface GameMap {
    [id: string]: Game;
}

export interface GameChangeData {
    id: string;
    created?: Game;
    deleted?: boolean;
    status?: GameStatus;
    planets?: GamePlanetMap;
    players?: GamePlayerMap;
}

export interface GameChangeDataMap {
    [id: string]: GameChangeData;
}
