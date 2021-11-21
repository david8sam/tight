import { colors } from '@material-ui/core';

export const PlayerColor = {
    RED: colors.red.A700,
    YELLOW: colors.yellow[500],
    GREEN: colors.green[500],
    BLUE: colors.blue.A700,
    PURPLE: colors.deepPurple[500],
    BLACK: '#000',
    // Prophecy of Kings
    ORANGE: colors.orange[500],
    MAGENTA: '#D80073',
};

export type PlayerColorKey = keyof typeof PlayerColor;
export type PlayerColorValue = typeof PlayerColor[PlayerColorKey];

export enum Version {
    TI3 = '3',
    TI4 = '4',
    TI4_1 = '4.1',
}

export const ExpansionVersionNames = {
    // Base game
    [Version.TI3]: '',
    [Version.TI4]: '',
    // Expansions
    [Version.TI4_1]: 'TI4: Prophecy of Kings',
};

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
    version: Version; // or just expansion?
    notes?: string[];
}

export type StrategyCardsType = readonly Readonly<StrategyCard>[];

export enum StrategyCardIndex {
    NONE = 0,
    LEADERSHIP,
    DIPLOMACY,
    DIPLOMACY_2 = 2.1,
    POLITICS = 3,
    CONSTRUCTION,
    CONSTRUCTION_2 = 4.1,
    TRADE = 5,
    WARFARE,
    TECHNOLOGY,
    IMPERIAL,
    END,
}

export const StrategyCardsWithVersions = Object.freeze({
    [StrategyCardIndex.DIPLOMACY]: [StrategyCardIndex.DIPLOMACY_2],
    [StrategyCardIndex.CONSTRUCTION]: [StrategyCardIndex.CONSTRUCTION_2],
});

export interface GameStatus {
    started: boolean;
    round: number;
    phase: Phase;
    turn: StrategyCardIndex;
    speaker: string;
    pickOrder: string[]; // starting with speaker, the order of players for picking strategy cards
    pickTurn: number;
    custodiansRemoved: boolean;
    agenda1Voted: boolean;
    agenda2Voted: boolean;
}

export interface GamePlanet {
    name: string;
    owner: string | null;
    refreshed: boolean;
}

export type GamePlanetMap = Record<string, GamePlanet>;

export interface GamePlayer {
    id: string;
    name: string;
    joined: boolean;

    color?: PlayerColorValue | null;
    faction?: string | null;

    strategyCard: StrategyCardIndex;
    strategyCardTaken: boolean;
    stragetyCardFlipped: boolean;

    passed: boolean;

    planets: string[];
    victoryPoints: number;
}

export type GamePlayerMap = Record<string, GamePlayer>;

export interface GameMetadata {
    readonly id: string;
    readonly date: number;
    readonly version: Version;
    readonly creator: string;
    readonly name: string;
}

export type GameMetadataMap = Record<string, GameMetadata>;

export interface Game {
    readonly id: string;
    readonly date: number;
    readonly version: Version;
    readonly creator: string;
    name: string;

    status: GameStatus;
    players: GamePlayerMap;
    planets: GamePlanetMap;
}

export type GameMap = Record<string, Game>;

export interface GameChangeData {
    id: string;
    created?: Game;
    deleted?: boolean;
    status?: GameStatus;
    planets?: GamePlanetMap;
    players?: GamePlayerMap;
}

export type GameChangeDataMap = Record<string, GameChangeData>;

export function getPlayerOrder(game: Game) {
    return Object.values(game.players).sort((p1: GamePlayer, p2: GamePlayer) => {
        return p1.strategyCard < p2.strategyCard ? -1 : 1;
    });
}

export function getNextPlayer(game: Game, currentPlayerId: string, playerOrder?: GamePlayer[]): GamePlayer | null {
    const players = playerOrder || getPlayerOrder(game);
    let nextIndex = players.findIndex(p => p.id === currentPlayerId) + 1;
    let nextPlayer = players[nextIndex];
    while (nextPlayer && nextPlayer.passed) {
        nextIndex += 1;
        nextPlayer = players[nextIndex];
    }

    return nextPlayer || null;
}

export function buildStrategyCardOwners(players: GamePlayerMap): string[] {
    const playersArray = Object.values(players);
    const stratCardOwners: string[] = [''];
    playersArray.forEach(p => (p.strategyCard ? (stratCardOwners[p.strategyCard] = p.name) : null));

    return stratCardOwners;
}

export function strategyCardHasOwner(stratCardOwners: string[], initiative: number): boolean {
    let hasOwner = false;

    // Check base version first
    const baseInitiative = Math.floor(initiative) as keyof typeof StrategyCardsWithVersions;
    if (baseInitiative !== initiative) {
        hasOwner = Boolean(stratCardOwners[baseInitiative]);
    }

    // Check all other versions
    if (!hasOwner) {
        const otherVersions = StrategyCardsWithVersions[baseInitiative];
        if (otherVersions) {
            hasOwner = otherVersions.some(v => stratCardOwners[v]);
        }
    }

    return hasOwner;
}
