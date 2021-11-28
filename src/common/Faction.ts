export type UnitType =
    // ships
    | 'flagship'
    | 'warSun'
    | 'dreadnought'
    | 'cruiser'
    | 'carrier'
    | 'destroyer'
    | 'fighter'
    // ground forces
    | 'infantry'
    // structures
    | 'spaceDock'
    | 'pds';

export type UnitCountMap = Partial<Record<UnitType, number>>;

export interface Ability {
    name: string;
    description: string;
}

export interface PromissoryNote {
    name: string;
    description: string;
}

export interface TechReq {
    biotic?: number;
    warfare?: number;
    propulsion?: number;
    cybernetic?: number;
}

export interface FactionTech {
    name: string;
    description: string;
    requirements: TechReq;
}

export interface Flagship {
    name: string;
    cost: number;
    combat: [number, number]; // (i.e 7x2)
    move: number;
    capacity: number;
    abilities: string[];
}

export interface Faction {
    name: string;
    abilities?: Ability[];
    promissoryNote?: PromissoryNote;
    factionTech?: FactionTech[];
    startingUnits?: UnitCountMap;
    startingTech?: string[];
    commodities?: number;
    flagship?: Flagship;
}
