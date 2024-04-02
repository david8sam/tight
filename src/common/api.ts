import { Faction } from './Faction.js';
import { Objective, StrategyCard, Version } from './Game.js';
import { Planet, PlanetMap } from './Planet.js';

export type NoParams = never;

export type GameCreateParams = {
    version?: Version;
    numPlayers?: number;
    numRounds?: number;
    numVictoryPoints?: number;
    publicObjectives?: Objective[];
};

export type GameCreateResult = string;

export type GameDeleteParams = { id: string };

export type GameDeleteResult = boolean;

export type GameValidateParams = { gameId: string };
export type GameValidateResult = boolean;

export type GameListPlayersParams = { gameId: string };
export type GameListPlayersResult = string[];

export type FactionListResults = Faction[];
export type FactionListNamesResults = string[];

export type FactionGetParams = { name: string };
export type FactionGetResults = Faction[];

export type StrategyCardListResults = StrategyCard[];

export type PlanetListResults = PlanetMap;
export type PlanetListNamesResults = string[];

export type PlanetSearchParams = {
    select?: string; // comma separated, '*' for all
};
export type PlanetSearchResults = Partial<Planet>[];
