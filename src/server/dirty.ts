import isEmpty from 'lodash/isEmpty';

import { GameChangeDataMap, GameChangeData, GamePlanet, GamePlanetMap, GamePlayerMap } from 'common/Game';

import { listAccounts } from './database/account';
import { getGame, listGames } from './database/game';

export interface DirtyGameParts {
    created?: boolean;
    deleted?: boolean;
    status?: boolean;
    planets?: boolean | string[];
    players?: boolean | string[];
    publicObjectives?: boolean;
}

export type DirtyGamePartsMap = Record<string, DirtyGameParts>;

// Keep track what data needs to be broadcasted to everyone.
export const dirty = {
    games: {} as DirtyGamePartsMap,
    accounts: [] as string[],
    accountsInfo: false,
};

export function setDirty(value: boolean = true) {
    dirty.accountsInfo = value;
    dirty.accounts.length = 0;
    dirty.games = {};

    if (value) {
        const allAccounts = listAccounts();
        Object.keys(allAccounts).forEach(accountId => markAccountDirty(accountId));

        const allGames = listGames();
        Object.keys(allGames).forEach(gameId => markGameDirty(gameId));
    }
}

export function isDirty(): boolean {
    return dirty.accounts.length > 0 || dirty.accountsInfo || !isEmpty(dirty.games);
}

export function markAccountDirty(id: string) {
    if (!dirty.accounts.includes(id)) {
        dirty.accounts.push(id);
    }
}

// Helper to mark parts of a Game object to be broadcasted out.
export function markGameDirty(
    gameId: string,
    dirtyParts: DirtyGameParts = { created: false, deleted: false, status: true, planets: true, players: true },
) {
    const data = dirty.games[gameId];
    dirty.games[gameId] = { ...data, ...dirtyParts };
}

export function getDirtyGameData(): GameChangeDataMap | null {
    const gameDataMap: GameChangeDataMap = {};
    const dirtyArray = Object.entries(dirty.games);
    dirtyArray.forEach(([gameId, dirtyParts]) => {
        // Build data for each dirty game
        const gameData: GameChangeData = { id: gameId };
        const { created, deleted, status, planets, players, publicObjectives } = dirtyParts;
        if (deleted) {
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
            gameData.created = game;
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
            if (Array.isArray(players)) {
                gameData.players = players.reduce((p, id) => {
                    // Set null for deleted player so it will be sent
                    p[id] = game.players[id] ?? null;
                    return p;
                }, {} as GamePlayerMap);
            } else {
                gameData.players = game.players;
            }
        }

        if (publicObjectives) {
            gameData.publicObjectives = game.publicObjectives;
        }

        gameDataMap[gameId] = gameData;
    });

    return dirtyArray.length ? gameDataMap : null;
}

export function formatChangePlanets(
    planets: GamePlanet[],
    playerId?: string, // Optional player that is changing the planets
): { changedPlanets: string[]; changedPlayers: string[] } {
    const changedPlayersSet = new Set<string>(playerId ? [playerId] : undefined);
    const changedPlanets = planets.map(p => {
        if (p.owner) {
            changedPlayersSet.add(p.owner);
        }
        return p.name;
    });
    const changedPlayers = [...changedPlayersSet.values()];

    return { changedPlanets, changedPlayers };
}
