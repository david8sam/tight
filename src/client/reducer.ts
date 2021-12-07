import { Faction } from 'common/Faction';
import { GameMap, Game, StrategyCard } from 'common/Game';
import { PlanetMap } from 'common/Planet';
import { Account, AppTheme, BaseAccountMap, LoginStatus } from 'common/Account';
import { ChangeData } from 'common/message';

export enum ActionType {
    setReconnecting,
    setTheme,
    setLoginStatus,
    setState,
    updateState,
    setFactionInfo,
}

export interface State {
    // Client Data
    initialized: boolean;
    reconnecting: boolean;
    theme: AppTheme;
    accountId: string | null;
    loginStatus: LoginStatus;

    // Server Data (Client does NOT modify)
    factionNames: string[];
    factionInfo: Faction | null;

    account: Account | null; // Loggined in player account
    accountsInfo: BaseAccountMap;
    games: GameMap;

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
    reconnecting: false,
    theme: 'light',
    accountId: null,
    loginStatus: LoginStatus.LOGGED_OUT,

    // Server data
    factionNames: [],
    factionInfo: null,
    games: {},
    account: null,
    accountsInfo: {},
    planets: {},
    strategyCards: [],
};

/**
 * Update State from server changes
 */
function updateState(state: State, payload: ChangeData): State {
    let newState = { ...state };

    // Update app level states
    const { games, account, accountsInfo } = payload;
    if (account) {
        newState.account = { ...state.account, ...account };
        newState.theme = account.settings.theme;
        const accountLoggedIn = account.loggedIn;
        if (accountLoggedIn && state.loginStatus === LoginStatus.LOGIN_PENDING) {
            newState.loginStatus = LoginStatus.LOGGED_IN;
        } else if (!accountLoggedIn && state.loginStatus === LoginStatus.LOGOUT_PENDING) {
            newState.loginStatus = LoginStatus.LOGGED_OUT;
        }
    }

    if (accountsInfo) {
        newState.accountsInfo = accountsInfo;
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

            // TODO: Investigate even more granular updates?
            const currentGame: Game = state.games[id] || {};
            const updatedGame: Game = { ...currentGame, ...created };
            if (status) {
                updatedGame.status = { ...status };
            }

            if (planets) {
                updatedGame.planets = { ...updatedGame.planets, ...planets };
            }

            if (players) {
                updatedGame.players = { ...updatedGame.players, ...players };

                // Key without no value means admin or spectator has left
                Object.keys(players).forEach(id => {
                    if (!players[id]) {
                        delete updatedGame.players[id];
                    }
                });
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
 */
export default function reducer(state: State, action: Action): State {
    const { type, payload } = action;
    switch (type) {
        case ActionType.setReconnecting:
            return { ...state, reconnecting: payload };
        case ActionType.setTheme:
            return { ...state, theme: payload.theme };
        case ActionType.setLoginStatus:
            return {
                ...state,
                loginStatus: payload.status,
                accountId: payload.accountId,
            };

        case ActionType.setState:
            return { ...state, ...payload, initialized: true };
        case ActionType.updateState:
            return updateState(state, payload);

        case ActionType.setFactionInfo:
            return { ...state, factionInfo: payload };

        default:
            return state;
    }
}
