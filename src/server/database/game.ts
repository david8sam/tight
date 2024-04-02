import { cloneDeep } from 'lodash-es';

import {
    Game,
    GameClientData,
    GameFaction,
    GameMap,
    GamePlanet,
    GamePlanetMap,
    generateBlankObjective,
    Phase,
    SECRET_OBJECTIVE_IDS,
    StrategyCardIndex,
    Version,
} from 'common/Game.js';
import { Planet } from 'common/Planet.js';

import { Planets } from './planet/index.js';
import { GameCreateParams } from 'common/api.js';
import { generateGameCode } from '../utils/game.js';

// Map of all games
let _games: GameMap = {};

// Default setting for all planets in a new game
const DEFAULT_GAME_PLANETS: Readonly<GamePlanetMap> = Planets.reduce((result: GamePlanetMap, planet: Planet) => {
    const { name, legendary } = planet;
    result[name] = { name, owner: null, refreshed: false };
    if (legendary) {
        result[name].refreshedAbility = true;
    }
    return result;
}, {});

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

    let factions: GameFaction[] = [];
    for (let i = 0; i < numPlayers; ++i) {
        factions.push(createEmptyFaction());
    }

    const game: Game = {
        id,
        date: Date.now(),
        players: {},
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

    if (_games) {
        _games[game.id] = game;
    } else {
        _games = { [game.id]: game };
    }

    return game;
}

export function deleteGame(id: string): boolean {
    if (_games && _games[id]) {
        delete _games[id];
        return true;
    }

    return false;
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
