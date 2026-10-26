import { z } from 'zod';
import { Version } from 'common/Game';
import { isGameCode } from 'common/gameCode';
import {
    FactionGetParams,
    FactionGetResults,
    FactionListNamesResults,
    FactionListResults,
    GameCreateParams,
    GameCreateResult,
    GameDeleteParams,
    GameDeleteResult,
    GameListPlayersParams,
    GameListPlayersResult,
    GameRestartParams,
    GameRestartResult,
    GameValidateParams,
    GameValidateResult,
    NoParams,
    PlanetListNamesResults,
    PlanetListResults,
    StrategyCardListResults,
} from 'common/api';
import { getApiUrl } from './urls';
import { readResponse } from './request';
type RequestOptions = { signal?: AbortSignal };
const gameCode = z.string().refine(isGameCode, 'Invalid game code');
const names = z.array(z.string().min(1)).min(1).max(100);
const strategyCards = z.array(z.object({
    name: z.string(), initiative: z.number(), primary: z.array(z.string()), secondary: z.array(z.string()),
    version: z.nativeEnum(Version), notes: z.array(z.string()).optional(), color: z.string(),
})).min(1).max(32);

async function get<
    Params extends Record<string, string | number | boolean> = Record<string, string | number | boolean>,
    Result = any,
>(url: string, params?: Params, options: RequestOptions = {}): Promise<Result> {
    const queryParams =
        params &&
        new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;
    return readResponse(fullUrl, { method: 'GET', ...options }, async response => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
    });
}

async function post<Params extends Record<string, unknown> = Record<string, unknown>, Result = any>(
    url: string,
    params?: Params,
    options: RequestOptions = {},
): Promise<Result> {
    return readResponse(url, {
        ...options,
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: params ? JSON.stringify(params) : undefined,
    }, async response => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
    });
}

type APIRequest<Params, Result> = (params: Params) => Promise<Result>;

function buildUrl(operation: string) {
    return getApiUrl(window.location.origin, operation);
}

function createGet<
    Params extends Record<string, string | number | boolean> = Record<string, string | number | boolean>,
    Result = any,
>(operation: string, validate: (value: Result) => Result = value => value) {
    return async (params?: Params, options?: RequestOptions): Promise<Result> => validate(await get<Params, Result>(buildUrl(operation), params, options));
}

function createPost<Params extends Record<string, unknown> = Record<string, unknown>, Result = any>(
    operation: string,
    validate: (value: Result) => Result,
) {
    return async (params?: Params, options?: RequestOptions): Promise<Result> => validate(await post<Params, Result>(buildUrl(operation), params, options));
}

export default {
    gameCreate: createPost<GameCreateParams, GameCreateResult>('/game/create', value => gameCode.parse(value)),
    gameRestart: createPost<GameRestartParams, GameRestartResult>('/game/restart', value => gameCode.parse(value)),
    gameDelete: createPost<GameDeleteParams, GameDeleteResult>('/game/delete', value => z.boolean().parse(value)),
    gameValidate: createGet<GameValidateParams, GameValidateResult>('/game/validate', value => z.boolean().parse(value)),
    gameListPlayers: createGet<GameListPlayersParams, GameListPlayersResult>('/game/list-players'),

    factionList: createGet<NoParams, FactionListResults>('/faction/list'),
    factionListNames: createGet<NoParams, FactionListNamesResults>('/faction/list-names', value => names.parse(value)),
    factionGetFaction: createGet<FactionGetParams, FactionGetResults>('/faction/get-faction'),

    strategyCardList: createGet<NoParams, StrategyCardListResults>('/strategy-card/list', value => strategyCards.parse(value)),

    planetList: createGet<NoParams, PlanetListResults>('/planet/list'),
    planetListNames: createGet<NoParams, PlanetListNamesResults>('/planet/list-names'),
};
