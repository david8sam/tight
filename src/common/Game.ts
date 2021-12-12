import { blue, deepPurple, green, orange, red, yellow } from '@material-ui/core/colors';

export const PlayerColor = {
    RED: red.A700,
    YELLOW: yellow[500],
    GREEN: green[500],
    BLUE: blue.A700,
    PURPLE: deepPurple[500],
    BLACK: '#000',
    // Prophecy of Kings
    ORANGE: orange[500],
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

// Base name to array of all other versions
export const StrategyCardsWithVersions = Object.freeze({
    [StrategyCardIndex.DIPLOMACY]: [StrategyCardIndex.DIPLOMACY_2],
    [StrategyCardIndex.CONSTRUCTION]: [StrategyCardIndex.CONSTRUCTION_2],
});

export enum GameSetupStep {
    ORDER = 0,
    FACTION,
}

export interface GameStatus {
    setupStep: GameSetupStep;
    started: boolean;
    ended: boolean;
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
    refreshedAbility?: boolean; // undefined if no ability
}

export type GamePlanetMap = Record<string, GamePlanet>;

export enum GameJoinStatus {
    PLAYER,
    ADMIN,
    SPECTATOR,
}

export interface GamePlayer {
    id: string;
    name: string;
    joined: boolean;
    joinStatus: GameJoinStatus;

    color?: PlayerColorValue | null;
    faction?: string | null;

    hasNaaluZeroToken: boolean;
    strategyCard: StrategyCardIndex;
    strategyCardTaken: boolean;
    stragetyCardFlipped: boolean;
    passed: boolean;

    planets: string[];
    secretObjectives: { cleared: boolean; objective: Objective }[];
    publicObjectives: boolean[]; // index === Objective.id - 1
    victoryPoints: number; // additional from other game mechanics, does not include objectives
}

export type GamePlayerMap = Record<string, GamePlayer>;

export interface Objective {
    id: number; // > 0 for public, < 0 for secret
    description: string;
    vp: number;
}

// Each player can have up to 3 secret objectives
export const SECRET_OBJECTIVE_IDS = [-1, -2, -3];

export interface Game {
    readonly id: string;
    readonly date: number;
    readonly version: Version;
    readonly creator: string;

    name: string;
    numPlayers: number;
    numRounds: number;
    numVictoryPoints: number;

    status: GameStatus;
    planets: GamePlanetMap;
    players: GamePlayerMap;
    publicObjectives: Objective[];
}

export type GameMap = Record<string, Game>;

export interface GameChangeData {
    id: string;
    created?: Game;
    deleted?: boolean;

    status?: GameStatus;
    planets?: GamePlanetMap;
    players?: GamePlayerMap;
    publicObjectives?: Objective[];
}

export type GameChangeDataMap = Record<string, GameChangeData>;

/**
 * Get all players in the game.
 */
export function getPlayersInGame(game: Game) {
    return Object.values(game.players).filter(p => p.joinStatus === GameJoinStatus.PLAYER);
}

/**
 * Find the Naalu player if any
 */
export function getNaaluPlayer(game: Game) {
    return getPlayersInGame(game).find(p => p.faction === 'The Naalu Collective');
}

/**
 * Get the current turn order of players.
 */
export function getPlayerOrder(game: Game, checkNaalu: boolean = true) {
    return getPlayersInGame(game).sort((p1: GamePlayer, p2: GamePlayer) => {
        if (checkNaalu) {
            if (p1.hasNaaluZeroToken) {
                return -1;
            } else if (p2.hasNaaluZeroToken) {
                return 1;
            }
        }

        // Players that have not picked a strategy card are last.
        if (p1.strategyCard === StrategyCardIndex.NONE) {
            return 1;
        } else if (p2.strategyCard === StrategyCardIndex.NONE) {
            return 1;
        }

        return p1.strategyCard < p2.strategyCard ? -1 : 1;
    });
}

/**
 * Get next player in the turn order.
 */
export function getNextPlayer(game: Game, currentPlayerId: string, playerOrder?: GamePlayer[]): GamePlayer | null {
    const players = playerOrder || getPlayerOrder(game);

    // Everyone passed, no next player
    if (players.every(p => p.passed)) {
        return null;
    }

    // Find next player that has not passed yet.
    let nextIndex = players.findIndex(p => p.id === currentPlayerId) + 1;
    let nextPlayer = players[nextIndex];
    while (nextPlayer && nextPlayer.passed) {
        nextIndex += 1;
        nextPlayer = players[nextIndex];
    }

    return nextPlayer || null;
}

/**
 * Map each strategy card to the player that currently owns it.
 */
export function buildStrategyCardOwners(game: Game): string[] {
    const playersArray = getPlayersInGame(game);
    const stratCardOwners: string[] = [''];
    playersArray.forEach(p => (p.strategyCard ? (stratCardOwners[p.strategyCard] = p.name) : null));

    return stratCardOwners;
}

/**
 * Check if a strategy card, or other versions of it, is currently owned by a player.
 */
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

/**
 * Calculates VPs from public and secret objectives, as well as any additional victory points held by the player.
 */
export function calculateVictoryPoints(game: Game, playerId: string) {
    const player = game.players[playerId];
    const { publicObjectives: gamePOs } = game;
    const { publicObjectives, secretObjectives, victoryPoints } = player;

    const povp = publicObjectives.reduce((total, po, i) => total + (po === true ? gamePOs[i].vp : 0), 0);
    const sovp = secretObjectives.reduce((total, so, i) => total + (so.cleared ? so.objective.vp : 0), 0);
    const totalvp = povp + sovp + victoryPoints;

    return totalvp;
}

/**
 * Generate a single blank objective
 */
export function generateBlankObjective(id: number): Objective {
    return { id, description: '', vp: 1 };
}

/**
 * Generates an array of blank public objectives
 */
export function generateBlankPublicObjectives(count: number = 10): Objective[] {
    return Array(count)
        .fill('')
        .map((_dummy, index) => generateBlankObjective(index + 1));
}
