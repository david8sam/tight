import { Faction } from 'common/Faction';
import { GameMap, Game, StrategyCard } from 'common/Game';
import { PlanetMap } from 'common/Planet';
import { AccountMap, LoginStatus } from 'common/Account';
import { ChangeData } from 'common/message';

export enum ActionType {
    useDarkTheme,

    setLoginStatus,

    initializeState,
    updateState,

    addGame,
    removeGame,

    setFactionInfo,
    setGames,
    setPlanets,
    setAccounts,
}

export interface State {
    // Client Data
    initialized: boolean;
    useDarkTheme: boolean;
    loginStatus: LoginStatus;
    accountId?: string | null;

    // Server Data (Client does NOT modify)
    factionNames: string[];
    factionInfo: Faction | null;
    games: GameMap;
    accounts: AccountMap;
    planets: PlanetMap;
    strategyCards: StrategyCard[];
}

export interface Action {
    type: ActionType;
    payload: any;
}

export const initialState = {
    // Client data
    initialized: false,
    useDarkTheme: false,
    loginStatus: LoginStatus.LOGGED_OUT,

    // Server data
    factionNames: [],
    factionInfo: null,
    games: {},
    accounts: {},
    planets: {},
    strategyCards: [],
};

/**
 * Update State from server changes
 * @param state Current state
 * @param payload The change data
 * @returns The updated state
 */
function updateState(state: State, payload: ChangeData) {
    let newState = { ...state };

    // Update app level states
    const { games, planets, accounts } = payload;
    if (planets) {
        newState.planets = planets;
    }

    if (accounts) {
        newState.accounts = accounts;
    }

    // Update changes to games
    const gamesArray = Object.values(games || {});
    if (gamesArray.length) {
        const updatedGameMap: GameMap = {};
        const deletedGames: string[] = [];

        gamesArray.forEach(g => {
            const { id, created, deleted, status, planets, players } = g;
            if (deleted) {
                deletedGames.push(id);
                return;
            }

            const currentGame: Game = state.games[id] || {};
            const updatedGame: Game = { ...currentGame, ...created };
            if (status) {
                updatedGame.status = { ...updatedGame.status, ...status };
            }

            if (planets) {
                updatedGame.planets = { ...updatedGame.planets, ...planets };
            }

            if (players) {
                updatedGame.players = { ...updatedGame.players, ...players };
            }

            updatedGameMap[id] = updatedGame;
        });

        const allGames = { ...state.games, ...updatedGameMap };
        deletedGames.forEach(gameId => delete allGames[gameId]);
        newState.games = allGames;
    }

    return newState;
}

/**
 * Reducer function to handle dispatched actions
 * @param state Current state
 * @param action The dispatched action
 * @returns The final state
 */
export default function reducer(state: State, action: Action): State {
    const { type, payload } = action;
    switch (type) {
        case ActionType.useDarkTheme:
            return { ...state, useDarkTheme: Boolean(payload) };

        case ActionType.setLoginStatus:
            return { ...state, loginStatus: payload.status, accountId: payload.accountId };

        case ActionType.initializeState:
            return { ...state, ...payload, initialized: true };
        case ActionType.updateState:
            return updateState(state, payload);

        case ActionType.setFactionInfo:
            return { ...state, factionInfo: payload };

        // Game actions
        case ActionType.setGames:
            return { ...state, games: { ...state.games, ...payload } };
        case ActionType.addGame:
            return { ...state, games: { ...state.games, [payload.id]: payload } };
        case ActionType.removeGame:
            if (!state || !state.games) {
                return state;
            }
            delete state.games[payload];
            return { ...state, games: { ...state.games } };

        // Planet actions
        case ActionType.setPlanets:
            return { ...state, planets: { ...state.planets, ...payload } };

        // Account actions
        case ActionType.setAccounts:
            return { ...state, accounts: { ...state.accounts, ...payload } };

        default:
            return state;
    }
}
