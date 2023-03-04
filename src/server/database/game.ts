import fs from 'fs';
import path from 'path';

import cloneDeep from 'lodash/cloneDeep';
import uniqueId from 'lodash/uniqueId';

import {
    Game,
    GameJoinStatus,
    GameMap,
    GamePlanet,
    GamePlanetMap,
    GamePlayerMap,
    generateBlankObjective,
    Objective,
    Phase,
    SECRET_OBJECTIVE_IDS,
    StrategyCardIndex,
    Version,
} from 'common/Game';
import { Planet } from 'common/Planet';
import uuidv4 from 'common/uuidv4';

import { getGamesDir, getHomeDir, load, save } from '../appData';
import { Planets } from './planet';

const GAMES_FILE = path.join(getHomeDir(), 'games.json');
// console.log(`games file: ${GAMES_FILE}`);

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

export function initialize() {
    if (_games) {
        return;
    }

    const gameData: string = fs.existsSync(GAMES_FILE) ? fs.readFileSync(GAMES_FILE, { encoding: 'utf-8' }) : '{}';

    _games = JSON.parse(gameData);
}

export function loadGames() {
    const gamesDir = getGamesDir();
    const dirs = fs.readdirSync(gamesDir, 'utf-8');
    dirs.forEach(dir => load(dir, _games));
}

export function saveGames() {
    const gamesDir = getGamesDir();
    if (!fs.existsSync(gamesDir)) {
        fs.mkdirSync(gamesDir);
    }

    // Sort by creator
    const gamesByCreator: Map<string, GameMap> = new Map();
    Object.values(_games).forEach(g => {
        let games = gamesByCreator.get(g.creator);
        if (!games) {
            games = {};
            gamesByCreator.set(g.creator, games);
        }

        games[g.id] = g;
    });

    // Save one directory per creator
    gamesByCreator.forEach((games, creator) => {
        const creatorDir = path.join(gamesDir, creator);
        save(creatorDir, games);
    });
}

export function deleteGames(ids: string[] | 'all') {
    let idArray = ids === 'all' ? Object.keys(_games) : ids;
    idArray.forEach(id => {
        delete _games[id];

        // delete file
    });

    if (idArray.length) {
        saveGames();
    }
}

export interface CreateGameParams {
    creator: string;
    version: Version;
    name?: string;
    numPlayers?: number;
    numRounds?: number;
    numVictoryPoints?: number;
    publicObjectives: Objective[];
}

export function createGame({
    creator,
    version = Version.TI4_1,
    name,
    numPlayers = 8,
    numRounds = 10,
    numVictoryPoints = 10,
    publicObjectives,
}: CreateGameParams): Game {
    const game = {
        id: `game:${uuidv4()}`,
        date: Date.now(),
        name: name || `Game${uniqueId()}`,
        numPlayers,
        numRounds,
        numVictoryPoints,
        version,
        creator,
        players: {} as GamePlayerMap,
        planets: cloneDeep(DEFAULT_GAME_PLANETS) as GamePlanetMap,
        publicObjectives,
        status: {
            setupStep: 0,
            started: false,
            ended: false,
            round: 1,
            phase: Phase.STRATEGY,
            turn: StrategyCardIndex.NONE,
            speaker: creator,
            pickOrder: [creator],
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

type AddPlayerOptions = {
    joinStatus?: GameJoinStatus;
};

export function addPlayer(gameId: string, playerId: string | string[], options?: AddPlayerOptions) {
    const game = getGame(gameId);
    if (!game) {
        return;
    }

    // Default join as player
    const { joinStatus = GameJoinStatus.PLAYER } = options || {};

    // Initialize all players added to the game.
    const playeridArray = Array.isArray(playerId) ? playerId : [playerId];
    playeridArray.forEach(pid => {
        if (!game.players[pid]) {
            // New player
            game.players[pid] = {
                id: pid,
                name: pid,
                joined: true,
                joinStatus,
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
        } else {
            // Existing player, rejoin
            const player = game.players[pid];
            player.joined = true;
            if (player.joinStatus !== GameJoinStatus.PLAYER) {
                // Can change status if not an active player
                player.joinStatus = joinStatus;
            }
        }
    });
}

export function removePlayer(gameId: string, playerId: string | string[], deletePlayer: boolean = false) {
    const game = getGame(gameId);
    if (!game) {
        return;
    }

    const playeridArray = Array.isArray(playerId) ? playerId : [playerId];
    playeridArray.forEach(pid => {
        if (deletePlayer) {
            delete game.players[pid];
        } else if (game.players[pid]) {
            game.players[pid].joined = false;
        }
    });
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
