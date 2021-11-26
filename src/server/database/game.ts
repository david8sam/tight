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
    SECRET_OBJECTIVE_ID,
    StrategyCardIndex,
    Version,
} from 'common/Game';
import uuidv4 from 'common/uuidv4';

import { getHomeDir } from '../appData';
import { Planets } from './planet';
import { Planet } from 'common/Planet';

const GAMES_FILE = path.join(getHomeDir(), 'games.json');
console.log(`games file: ${GAMES_FILE}`);

// Map of all games
let _games: GameMap = {};

// Default setting for all planets in a new game
const DEFAULT_GAME_PLANETS: Readonly<GamePlanetMap> = Planets.reduce((result: GamePlanetMap, planet: Planet) => {
    const { name } = planet;
    result[name] = { name, owner: null, refreshed: false };
    return result;
}, {});

export function initialize() {
    if (_games) {
        return;
    }

    const gameData: string = fs.existsSync(GAMES_FILE) ? fs.readFileSync(GAMES_FILE, { encoding: 'utf-8' }) : '{}';

    _games = JSON.parse(gameData);
}

function save() {
    const data = JSON.stringify(_games);
    // fs.writeFileSync(GAMES_FILE, data);
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
    version = Version.TI4,
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
                strategyCard: StrategyCardIndex.NONE,
                strategyCardTaken: false,
                stragetyCardFlipped: false,
                passed: false,
                planets: [],
                publicObjectives: [],
                secretObjective: { cleared: false, objective: generateBlankObjective(SECRET_OBJECTIVE_ID) },
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
