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
    GameValidateParams,
    GameValidateResult,
    NoParams,
    PlanetListNamesResults,
    PlanetListResults,
    StrategyCardListResults,
} from 'common/api';

async function get<
    Params extends Record<string, string | number | boolean> = Record<string, string | number | boolean>,
    Result = any,
>(url: string, params?: Params): Promise<Result> {
    const queryParams =
        params &&
        Object.entries(params)
            .map(([key, value]) => `${key}=${String(value)}`)
            .join('&');
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;
    const response = await fetch(fullUrl, { method: 'GET' });
    return response.json();
}

async function post<Params extends Record<string, unknown> = Record<string, unknown>, Result = any>(
    url: string,
    params?: Params,
): Promise<Result> {
    const response = await fetch(url, {
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
    });
    return response.json();
}

type APIRequest<Params, Result> = (params: Params) => Promise<Result>;

function buildUrl(operation: string) {
    const { protocol, host } = window.location;
    return `${protocol}//${window.location.host}/api${operation}`;
}

function createGet<
    Params extends Record<string, string | number | boolean> = Record<string, string | number | boolean>,
    Result = any,
>(operation: string, getFunc = get) {
    return (params?: Params): Promise<Result> => getFunc(buildUrl(operation), params);
}

function createPost<Params extends Record<string, unknown> = Record<string, unknown>, Result = any>(
    operation: string,
    postFunc = post,
) {
    return (params?: Params): Promise<Result> => postFunc(buildUrl(operation), params);
}

export default {
    gameCreate: createPost<GameCreateParams, GameCreateResult>('/game/create'),
    gameDelete: createPost<GameDeleteParams, GameDeleteResult>('/game/delete'),
    gameValidate: createGet<GameValidateParams, GameValidateResult>('/game/validate'),
    gameListPlayers: createGet<GameListPlayersParams, GameListPlayersResult>('/game/list-players'),

    factionList: createGet<NoParams, FactionListResults>('/faction/list'),
    factionListNames: createGet<NoParams, FactionListNamesResults>('/faction/list-names'),
    factionGetFaction: createGet<FactionGetParams, FactionGetResults>('/faction/get-faction'),

    strategyCardList: createGet<NoParams, StrategyCardListResults>('/strategy-card/list'),

    planetList: createGet<NoParams, PlanetListResults>('/planet/list'),
    planetListNames: createGet<NoParams, PlanetListNamesResults>('/planet/list-names'),
};
