import { Traits } from './Planet.js';

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
    color: string;
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

export interface GameStatus {
    started: boolean;
    ended: boolean;
    round: number;
    phase: Phase;
    turn: StrategyCardIndex;
    speaker: string;
    pickOrder: string[]; // starting with speaker, the order of factions for picking strategy cards
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
    modifiers?: {
        // Modifiers to base values
        resources?: number;
        influence?: number;

        // Tech bonuses
        biotic?: number; // green
        warfare?: number; //red
        propulsion?: number; // blue
        cybernetic?: number; // yellow

        trait?: Traits[];
        DMZ?: boolean;
    };
}

export type GamePlanetMap = Record<string, GamePlanet>;

export const NO_FACTION = 'no faction';

export interface GamePlayer {
    id: string;
}

export type GamePlayerMap = Record<string, GamePlayer>;

export interface GameFaction {
    name: string;
    color: string;
    playerIds: string[];

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

export type GameFactionMap = Record<string, GameFaction>;

export interface Objective {
    id: number; // > 0 for public, < 0 for secret
    description: string;
    vp: number;
}

// Each faction can have up to 3 secret objectives
export const SECRET_OBJECTIVE_IDS = [-1, -2, -3];

export interface Game {
    readonly id: string;
    readonly date: number;
    readonly version: Version;

    players: GamePlayerMap;

    numPlayers: number;
    numRounds: number;
    numVictoryPoints: number;

    status: GameStatus;
    planets: GamePlanetMap;
    factions: GameFaction[];
    publicObjectives: Objective[];

    started: boolean;
}

export type GameClientData = Omit<Game, 'players'> & {
    players: string[];
};

export type GameMap = Record<string, Game>;

export interface GameChangeData {
    id: string;
    created?: GameClientData;
    deleted?: boolean;

    status?: GameStatus;
    planets?: GamePlanetMap;
    players?: string[];
    factions?: GameFaction[];
    publicObjectives?: Objective[];
}

export type GameChangeDataMap = Record<string, GameChangeData>;

export function formatFactionName(game: Game | GameClientData, factionName: string): string {
    const faction = game.factions.find(f => f.name === factionName);
    if (!faction) {
        return '';
    }

    const playersList = faction.playerIds.length ? ` (${faction.playerIds.join(', ')})` : '';
    return `${faction.name}${playersList}`;
}

/**
 * Find Naalu in game if any
 */
export function getNaalu(game: Game | GameClientData) {
    return game.factions.find(f => f.name === 'The Naalu Collective');
}

export function getFactionTurn(game: Game | GameClientData) {
    const { phase, turn, pickOrder } = game.status;

    let factionTurn = null;
    if (phase === Phase.STRATEGY) {
        factionTurn =
            pickOrder.find(name => game.factions.find(f => f.name === name)?.strategyCard === StrategyCardIndex.NONE) ??
            'END';
    } else if (turn === StrategyCardIndex.END) {
        factionTurn = 'END';
    } else {
        const faction = game.factions.find(p => p.strategyCard === turn);
        factionTurn = faction ? faction.name : null;
    }

    return factionTurn;
}

/**
 * Get the current turn order of factions.
 */
export function getFactionOrder(game: Game | GameClientData, checkNaalu: boolean = true) {
    return [...game.factions].sort((f1: GameFaction, f2: GameFaction) => {
        if (checkNaalu) {
            if (f1.hasNaaluZeroToken) {
                return -1;
            } else if (f2.hasNaaluZeroToken) {
                return 1;
            }
        }

        // Players that have not picked a strategy card are last.
        if (f1.strategyCard === StrategyCardIndex.NONE) {
            return 1;
        } else if (f2.strategyCard === StrategyCardIndex.NONE) {
            return 1;
        }

        return f1.strategyCard < f2.strategyCard ? -1 : 1;
    });
}

/**
 * Get next faction in the turn order.
 */
export function getNextFaction(
    game: Game | GameClientData,
    currentFactionName: string,
    order?: GameFaction[],
): GameFaction | null {
    const factions = order || getFactionOrder(game);

    // Everyone passed, no next faction
    if (factions.every(f => f.passed)) {
        return null;
    }

    // Find next faction that has not passed yet.
    let nextIndex = factions.findIndex(f => f.name === currentFactionName) + 1;
    let nextFaction = factions[nextIndex];
    while (nextFaction && nextFaction.passed) {
        nextIndex += 1;
        nextFaction = factions[nextIndex];
    }

    return nextFaction || null;
}

/**
 * Map each strategy card to the faction that currently owns it.
 */
export function buildStrategyCardOwners(game: Game | GameClientData): string[] {
    const stratCardOwners: string[] = [''];
    game.factions.forEach(f => (f.strategyCard ? (stratCardOwners[f.strategyCard] = f.name) : null));

    return stratCardOwners;
}

/**
 * Check if a strategy card, or other versions of it, is currently owned by a faction.
 */
export function strategyCardHasOwner(stratCardOwners: string[], initiative: number): boolean {
    let hasOwner = false;

    // Check base version first
    const baseInitiative = Math.floor(initiative) as keyof typeof StrategyCardsWithVersions;
    if (baseInitiative === initiative) {
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
 * Calculates VPs from public and secret objectives, as well as any additional victory points held by the faction.
 */
export function calculateVictoryPoints(game: Game | GameClientData, factionName: string) {
    const faction = game.factions.find(f => f.name === factionName)!;
    const { publicObjectives: gamePOs } = game;
    const { publicObjectives, secretObjectives, victoryPoints } = faction;

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

export function isPlayerSpectator(game: Game | GameClientData, playerId: string | null) {
    if (!playerId) {
        return true;
    }

    return !game.factions.some(f => f.playerIds.includes(playerId));
}
