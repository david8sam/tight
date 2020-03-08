import isEmpty from 'lodash/isEmpty';

import { GameChangeDataMap, GameChangeData } from 'common/Game';

import * as GameDB from './database/game';

export interface DirtyGameParts {
    created?: boolean;
    deleted?: boolean;
    status?: boolean;
    planets?: boolean;
    players?: boolean;
}

export interface DirtyGamePartsMap {
    [id: string]: DirtyGameParts;
}

// Keep track what data needs to be broadcasted to everyone.
export const dirty = {
    games: {} as DirtyGamePartsMap,
    accounts: false,
};

export function setDirty(value: boolean = true) {
    dirty.accounts = value;
    dirty.games = {};

    if (value) {
        const allGames = GameDB.listGames();
        Object.keys(allGames).forEach(gameId => markGameDirty(gameId));
    }
}

export function isDirty(): boolean {
    if (dirty.accounts) {
        return true;
    }

    return !isEmpty(dirty.games);
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
        const { created, deleted, status, planets, players } = dirtyParts;
        if (deleted) {
            gameData.deleted = true;
            gameDataMap[gameId] = gameData;
            return;
        }

        const game = GameDB.getGame(gameId);
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
            gameData.planets = game.planets;
        }

        if (players) {
            gameData.players = game.players;
        }

        gameDataMap[gameId] = gameData;
    });

    return dirtyArray.length ? gameDataMap : null;
}
