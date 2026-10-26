import { cloneDeep } from 'lodash-es';

import {
    Game,
    GameClientData,
    GameFaction,
    GameMap,
    GamePlanet,
    GamePlanetMap,
    GamePlayerMap,
    generateBlankObjective,
    Phase,
    SECRET_OBJECTIVE_IDS,
    StrategyCardIndex,
    Version,
} from 'common/Game.js';
import { Planet } from 'common/Planet.js';

import { Planets } from './planet/index.js';
import { GameCreateParams, GameRestartParams } from 'common/api.js';
import { generateGameCode } from '../utils/game.js';

import { GameStore, CommandIdentity, CommandCommit } from './GameStore.js';
import { GameVersion } from 'common/gameVersion.js';
import { GuestSession } from 'common/session.js';

let store: GameStore | null = null;
let _games: GameMap = {};

export function initializeGameStorage(directory: string, onWriteError?: (error: unknown) => void): void {
    if (store) throw new Error('Game storage is already initialized');
    const next = new GameStore(directory, onWriteError);
    try {
        _games = next.load();
        store = next;
    } catch (error) {
        next.close();
        throw error;
    }
}
export function closeGameStorage(): void {
    store?.close();
    store = null;
    _games = {};
}
function storage(): GameStore {
    if (!store) throw new Error('Game storage is not initialized');
    return store;
}

export function revokeAccessSessions(gameId: string): void {
    storage().revokeAccessSessions(gameId);
}
export function findAccessSession(hash: string): GuestSession | null {
    return storage().findAccessSession(hash);
}
export function saveAccessSession(hash: string, session: GuestSession): void {
    storage().saveAccessSession(hash, session);
}

export function getGameVersion(id: string): GameVersion | null {
    return storage().version(id);
}

export function commitGameCommand(id: string, identity: CommandIdentity, change: () => void): CommandCommit {
    const game = _games[id];
    if (!game) return { status: 'missing' };
    const previous = structuredClone(game);
    try {
        const result = storage().commitCommand(id, identity, () => {
            change();
            return _games[id];
        });
        if (result.status === 'saved') _games[id] = result.game;
        return result;
    } catch (error) {
        _games[id] = previous;
        throw error;
    }
}

export function mutateGame(id: string, change: () => void): void {
    const previous = structuredClone(_games[id]);
    const before = JSON.stringify(previous);
    try {
        change();
        if (JSON.stringify(_games[id]) !== before) _games[id] = storage().save(_games[id]);
    } catch (error) {
        _games[id] = previous;
        throw error;
    }
}

// Default setting for all planets in a new game
const DEFAULT_GAME_PLANETS: Readonly<GamePlanetMap> = Planets.reduce((result: GamePlanetMap, planet: Planet) => {
    const { name, legendary } = planet;
    result[name] = { name, owner: null, refreshed: false };
    if (legendary) {
        result[name].refreshedAbility = true;
    }
    return result;
}, {});

export function initializeGame(options: Required<GameCreateParams> & { id: string; players?: GamePlayerMap }) {
    const { id, players, numPlayers, numRounds, numVictoryPoints, version, publicObjectives } = options;

    let factions: GameFaction[] = [];
    for (let i = 0; i < numPlayers; ++i) {
        factions.push(createEmptyFaction());
    }

    const game: Game = {
        id,
        date: Date.now(),
        players: players ?? {},
        numPlayers,
        numRounds,
        numVictoryPoints,
        version,
        factions,
        planets: cloneDeep(DEFAULT_GAME_PLANETS) as GamePlanetMap,
        publicObjectives,
        status: {
            started: false,
            ended: false,
            round: 1,
            phase: Phase.STRATEGY,
            turn: StrategyCardIndex.NONE,
            speaker: '',
            pickOrder: [],
            pickTurn: 0,
            custodiansRemoved: false,
            agenda1Voted: false,
            agenda2Voted: false,
        },
        started: false,
    };

    return game;
}

export function createGame({
    version = Version.TI4_1,
    numPlayers = 8,
    numRounds = 10,
    numVictoryPoints = 10,
    publicObjectives = [],
}: GameCreateParams): Game {
    let id = generateGameCode();
    while (_games[id]) {
        id = generateGameCode();
    }

    const game = initializeGame({ id, version, numPlayers, numRounds, numVictoryPoints, publicObjectives });

    _games[game.id] = storage().save(game);

    return game;
}

export function importGame(game: Game): void {
    _games[game.id] = storage().save(game);
}

export function restartGame(options: GameRestartParams): Game | null {
    const { id, ...otherGameOptions } = options;
    const game = _games[id];
    if (!game) {
        return null;
    }

    const { version, players, numPlayers, numRounds, numVictoryPoints, publicObjectives } = game;
    const combinedOptions = {
        id,
        players,
        version,
        numPlayers,
        numRounds,
        numVictoryPoints,
        publicObjectives,
        ...otherGameOptions,
    };
    const newGame = initializeGame(combinedOptions);
    _games[id] = storage().save(newGame);

    return newGame;
}

export function deleteGame(id: string): boolean {
    if (_games && _games[id]) {
        storage().delete(id);
        delete _games[id];
        return true;
    }

    return false;
}

export function listSavedGames() {
    return storage().savedGames();
}
export function organizeSavedGame(id: string, change: { name: string | null } | { archived: boolean }): boolean {
    return storage().organize(id, change);
}

export function listGames(): Readonly<GameMap> {
    return _games as Readonly<GameMap>;
}

export function getGame(id: string): Game | null {
    return id ? _games[id] : null;
}

export function getGameForClient(id: string): GameClientData | null {
    const game = id ? _games[id] : null;
    return game && { ...game, players: Object.keys(game.players) };
}

export function createEmptyFaction(): GameFaction {
    return {
        name: 'None',
        color: 'None',
        playerIds: [],
        hasNaaluZeroToken: false,
        strategyCard: StrategyCardIndex.NONE,
        strategyCardTaken: false,
        stragetyCardFlipped: false,
        passed: false,
        planets: [],
        publicObjectives: [],
        secretObjectives: SECRET_OBJECTIVE_IDS.map(id => ({
            cleared: false,
            objective: generateBlankObjective(id),
        })),
        victoryPoints: 0,
    };
}

export function updateFaction(options: {
    gameId: string;
    order: number;
    name?: string;
    color?: string;
    playerIds?: string[];
}): boolean {
    const { gameId, order, ...factionData } = options;

    const game = getGame(gameId);
    if (!game) {
        return false;
    }

    if (game.factions[order]) {
        game.factions[order] = { ...game.factions[order], ...factionData };

        const faction = game.factions[order];
        if (faction.name === 'The Naalu Collective') {
            faction.hasNaaluZeroToken = true;
        }
    }

    return true;
}

export function reorderFaction(options: { gameId: string; index: number; newIndex: number }): boolean {
    const { gameId, index, newIndex } = options;
    const game = getGame(gameId);
    if (!game) {
        return false;
    }

    const factionToReorder = game.factions[index];
    game.factions.splice(index, 1);
    game.factions.splice(newIndex, 0, factionToReorder);

    game.status.pickOrder.splice(index, 1);
    game.status.pickOrder.splice(newIndex, 0, factionToReorder.name);

    return true;
}

export function getPlanetsArray(gameId: string, name?: string | string[]): GamePlanet[] {
    const game = getGame(gameId);
    if (!game) {
        return [];
    }

    let nameArray = null;
    if (name) {
        nameArray = Array.isArray(name) ? name : [name];
    }

    const planetMap = game.planets;
    if (!planetMap) {
        return [];
    }

    const result = nameArray ? nameArray.map(n => planetMap[n]) : Object.values(planetMap);
    return result;
}
