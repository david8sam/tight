import { isEmpty } from 'lodash-es';

import { GameChangeData, GameChangeDataMap, GameFaction, GamePlanet, GamePlanetMap } from 'common/Game.js';

import { getGame, listGames, deleteGame, persistGame } from './database/game.js';
import log from './log.js';

const REMOVE_GAME_TIME_THRESHOLD = 1000 * 60 * 60 * 4; // 4 hours
const _gameTimestampMap = new Map<string, number>();

export interface DirtyGameParts {
    created?: boolean;
    deleted?: boolean;
    status?: boolean;
    players?: boolean;
    planets?: boolean | string[];
    factions?: boolean | string[];
    publicObjectives?: boolean;
}

export type DirtyGamePartsMap = Record<string, DirtyGameParts>;

// Keep track what data needs to be broadcasted to everyone.
export const dirty = {
    games: {} as DirtyGamePartsMap,
};

export function setDirty(value: boolean = true) {
    dirty.games = {};

    if (value) {
        const allGames = listGames();
        Object.keys(allGames).forEach(gameId => markGameDirty(gameId));
    }
}

export function isDirty(): boolean {
    return !isEmpty(dirty.games);
}

// Helper to mark parts of a Game object to be broadcasted out.
export function markGameDirty(
    gameId: string,
    dirtyParts: DirtyGameParts | undefined = {
        created: false,
        deleted: false,
        status: true,
        planets: true,
        players: true,
        factions: true,
        publicObjectives: true,
    },
) {
    if (!getGame(gameId)) {
        return;
    }

    _gameTimestampMap.set(gameId, Date.now());

    const prevDirtyParts = dirty.games[gameId];

    // Game is deleted, don't process any other dirty flags
    if (prevDirtyParts?.deleted || dirtyParts.deleted) {
        dirty.games[gameId] = { deleted: true };
        return;
    }

    let { planets, factions, ...otherDirtyParts } = dirtyParts;
    if (prevDirtyParts && planets && Array.isArray(planets)) {
        if (prevDirtyParts.planets === true) {
            // All planets were dirty, keep them all marked
            planets = true;
        } else if (Array.isArray(prevDirtyParts.planets)) {
            // Some planets were marked dirty, merge with newly marked planets
            planets = [...prevDirtyParts.planets, ...planets];
        }
    } else if (!planets && prevDirtyParts?.planets) {
        // Keep previous dirty flag
        planets = prevDirtyParts.planets;
    }

    if (prevDirtyParts && factions && Array.isArray(factions)) {
        if (prevDirtyParts.factions === true) {
            factions = true;
        } else if (Array.isArray(prevDirtyParts.factions)) {
            factions = [...prevDirtyParts.factions, ...factions];
        }
    } else if (!factions && prevDirtyParts?.factions) {
        factions = prevDirtyParts.factions;
    }

    dirty.games[gameId] = { ...prevDirtyParts, ...otherDirtyParts, planets, factions };
}

export function getDirtyGameData(): GameChangeDataMap | null {
    const gameDataMap: GameChangeDataMap = {};
    const dirtyArray = Object.entries(dirty.games);
    dirtyArray.forEach(([gameId, dirtyParts]) => {
        // Build data for each dirty game
        const gameData: GameChangeData = { id: gameId };
        const { created, deleted, status, planets, players, factions, publicObjectives } = dirtyParts;
        if (deleted) {
            log(`Removing old game: ${gameId}`);
            deleteGame(gameId);
            gameData.deleted = true;
            gameDataMap[gameId] = gameData;
            return;
        }

        const game = getGame(gameId);
        if (!game) {
            return;
        }

        if (created) {
            // Send back full game info
            gameData.created = { ...game, players: Object.keys(game.players) };
            gameDataMap[gameId] = gameData;
        }

        // Send only the part that has changed
        if (status) {
            gameData.status = game.status;
        }

        if (planets) {
            if (Array.isArray(planets)) {
                gameData.planets = planets.reduce((p, id) => {
                    p[id] = game.planets[id];
                    return p;
                }, {} as GamePlanetMap);
            } else {
                gameData.planets = game.planets;
            }
        }

        if (players) {
            gameData.players = Object.keys(game.players);
        }

        if (factions) {
            if (Array.isArray(factions)) {
                gameData.factions = factions.reduce((f, name) => {
                    const factionIndex = game.factions?.findIndex(fact => fact.name === name);
                    if (factionIndex > -1) {
                        f[factionIndex] = game.factions[factionIndex];
                    }
                    return f;
                }, [] as GameFaction[]);
            } else {
                gameData.factions = game.factions;
            }
        }

        if (publicObjectives) {
            gameData.publicObjectives = game.publicObjectives;
        }

        if (!gameData.deleted) {
            persistGame(gameId);
        }

        gameDataMap[gameId] = gameData;
    });

    return dirtyArray.length ? gameDataMap : null;
}

export function formatChangePlanets(
    planets: GamePlanet[],
    factionName?: string, // Optional faction that is changing the planets
): { changedPlanets: string[]; changedFactions: string[] } {
    const changedFactionsSet = new Set<string>(factionName ? [factionName] : undefined);
    const changedPlanets = planets.map(p => {
        if (p.owner) {
            changedFactionsSet.add(p.owner);
        }
        return p.name;
    });
    const changedFactions = [...changedFactionsSet.values()];

    return { changedPlanets, changedFactions };
}

export function removeOldGames() {
    const now = Date.now();
    _gameTimestampMap.forEach((timestamp, gameId) => {
        if (now - timestamp > REMOVE_GAME_TIME_THRESHOLD) {
            _gameTimestampMap.delete(gameId);
            markGameDirty(gameId, { deleted: true });
        }
    });
}
