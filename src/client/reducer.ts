import { GameVersion } from 'common/gameVersion';
import { sessionHints } from './utils/sessionHints';
import { GameClientData, GamePlayer, StrategyCard } from 'common/Game';
import { ChangeData } from 'common/message';
import { AppTheme } from './types';

export enum ActionType {
    setConnecting,
    setCommandStatus,
    setTheme,
    setPlayerId,
    setStrategyCards,

    setState,
    updateState,
}

export interface CommandNotice {
    kind: 'failed' | 'unconfirmed';
    message: string;
}

export interface State {
    gameVersion: GameVersion | null;
    pendingCommands: number;
    saveStatus: 'idle' | 'pending' | 'saved' | 'unconfirmed' | 'failed';
    commandNotice: CommandNotice | null;
    theme: AppTheme;
    initialized: boolean;
    snapshotSequence: number;
    connecting: boolean;
    connectError: boolean;
    reconnect: boolean;
    playerId: string | null;
    game: GameClientData | null;
    strategyCards: StrategyCard[];
}

export interface Action {
    type: ActionType;
    payload: any;
}

export const initialState: State = {
    gameVersion: null,
    pendingCommands: 0,
    saveStatus: 'idle',
    commandNotice: null,
    initialized: false, // state is populated from server data.
    snapshotSequence: 0,
    connecting: false,
    connectError: false,
    reconnect: false,
    strategyCards: [],
    game: null,
    playerId: sessionHints.getItem('playerId') || null,
    theme: sessionHints.getItem('theme') === 'dark' ? 'dark' : 'light',
};

/**
 * Update State from server changes
 */
function updateState(state: State, payload: ChangeData): State {
    // Update app level states
    const { game } = payload;

    if (!game) {
        return state;
    }

    // Update changes to game
    const { created, deleted, status, planets, players, factions, publicObjectives } = game;
    if (deleted) {
        return { ...state, game: null, gameVersion: null };
    }

    // TODO: Investigate even more granular updates?
    const currentGame: GameClientData | null = created ? created : state.game;
    if (!currentGame) {
        return state;
    }

    const updatedGame: GameClientData = { ...currentGame };
    if (status) {
        updatedGame.status = status;
    }

    if (planets) {
        updatedGame.planets = { ...updatedGame.planets, ...planets };
    }

    if (players) {
        updatedGame.players = players;
    }

    if (factions) {
        const updatedFactions = [...updatedGame.factions];
        factions.forEach((uf, factionIndex) => {
            updatedFactions[factionIndex] = { ...updatedFactions[factionIndex], ...uf };
        });
        updatedGame.factions = updatedFactions;
    }

    if (publicObjectives) {
        updatedGame.publicObjectives = [...publicObjectives];
    }

    return { ...state, game: updatedGame, gameVersion: payload.gameVersion };
}

function validateState(state: State): State {
    const { game, playerId } = state;

    // Remove player if not valid for the current game
    if (playerId && !game?.players.includes(playerId)) {
        state.playerId = null;
    }

    return state;
}

/**
 * Reducer function to handle dispatched actions
 */
export default function reducer(state: State, action: Action): State {
    const { type, payload } = action;

    // console.log(`action: ${ActionType[type]}`);

    // TODO: Type payloads per action type
    switch (type) {
        case ActionType.setCommandStatus:
        case ActionType.setConnecting:
            return { ...state, ...payload };
        case ActionType.setTheme:
            sessionHints.setItem('theme', payload);
            return { ...state, theme: payload };
        case ActionType.setPlayerId:
            sessionHints.setItem('playerId', payload ?? '');
            return { ...state, playerId: payload };
        case ActionType.setStrategyCards:
            return { ...state, strategyCards: payload };

        case ActionType.setState: {
            // A missing-game response still needs to be observed when game was already null.
            const next = validateState({
                ...state,
                ...payload,
                initialized: true,
                snapshotSequence: state.snapshotSequence + 1,
            });
            sessionHints.setItem('playerId', next.playerId ?? '');
            return next;
        }
        case ActionType.updateState:
            return updateState(state, payload);

        default:
            return state;
    }
}
