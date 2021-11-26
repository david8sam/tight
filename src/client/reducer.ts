import { Faction } from 'common/Faction';
import { GameMap, Game, StrategyCard } from 'common/Game';
import { PlanetMap } from 'common/Planet';
import { AccountMap, AppTheme, LoginStatus } from 'common/Account';
import { ChangeData } from 'common/message';

export enum ActionType {
    setLoginStatus,
    initializeState,
    updateState,
    setFactionInfo,
}

export interface State {
    // Client Data
    initialized: boolean;
    theme: AppTheme;
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

export const initialState: State = {
    // Client data
    initialized: false,
    theme: 'light',
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
    const { games, accounts } = payload;
    if (accounts) {
        newState.accounts = accounts;
        if (state.accountId) {
            newState.theme = accounts[state.accountId].settings.theme;
        }
    }

    // Update changes to games
    const gamesArray = Object.values(games || {});
    if (gamesArray.length) {
        const updatedGameMap: GameMap = {};
        const deletedGames: string[] = [];

        gamesArray.forEach(g => {
            const { id, created, deleted, status, planets, players, publicObjectives } = g;
            if (deleted) {
                deletedGames.push(id);
                return;
            }

            const currentGame: Game = state.games[id] || {};
            const updatedGame: Game = { ...currentGame, ...created };
            if (status) {
                updatedGame.status = { ...status };
            }

            if (planets) {
                updatedGame.planets = { ...planets };
            }

            if (players) {
                updatedGame.players = { ...players };
            }

            if (publicObjectives) {
                updatedGame.publicObjectives = [...publicObjectives];
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
        case ActionType.setLoginStatus:
            return {
                ...state,
                loginStatus: payload.status,
                accountId: payload.accountId,
            };

        case ActionType.initializeState:
            return { ...state, ...payload, initialized: true };
        case ActionType.updateState:
            return updateState(state, payload);

        case ActionType.setFactionInfo:
            return { ...state, factionInfo: payload };

        default:
            return state;
    }
}
