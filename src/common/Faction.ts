export enum UnitType {
    // ships
    Flagship = 'Flagship',
    WarSun = 'War Sun',
    Dreadnought = 'Dreadnought',
    Cruiser = 'Cruiser',
    Carrier = 'Carrier',
    Destroyer = 'Destroyer',
    Fighter = 'Fighter',
    // ground forces
    Mech = 'Mech',
    Infantry = 'Infantry',
    // structures
    SpaceDock = 'Space Dock',
    PDS = 'PDS',
}

export interface Unit {
    type: UnitType;
    cost?: number | [number, number];
    combat?: number | [number, number]; // (i.e 7x2)
    move?: number;
    capacity?: number;
}

export type UnitCountMap = Partial<Record<UnitType, number>>;

export interface Ability {
    name: string;
    description: string;
}

export interface PromissoryNote {
    name: string;
    description: string;
}

export interface TechPrereq {
    biotic?: number;
    warfare?: number;
    propulsion?: number;
    cybernetic?: number;
}

export interface FactionTech {
    name: string;
    description: string;
    prerequisites?: TechPrereq;
}

export interface FactionUnit extends Unit {
    name: string;
    abilities?: string[];
    prerequisites?: TechPrereq;
}

export interface Flagship extends Omit<Unit, 'type'> {
    cost: number;
    name: string;
    abilities: string[];
    prerequisites?: TechPrereq;
}

export interface Mech extends Omit<Unit, 'type'> {
    cost: number;
    name: string;
    description: string;
    abilities?: string[];
}

export enum LeaderType {
    Agent,
    Commander,
    Hero,
}

export interface Leader {
    type: LeaderType;
    name: string;
    unlock: string;
    ability: string;
}

export interface Faction {
    name: string;
    abilities?: Ability[];
    promissoryNotes?: PromissoryNote[];
    factionTech?: FactionTech[];
    factionUnits?: FactionUnit[];
    startingUnits?: UnitCountMap;
    startingTech?: string[];
    commodities?: number;
    flagship?: Flagship | Flagship[];
    mech?: Mech | Mech[];
    leaders?: Leader[];
}
