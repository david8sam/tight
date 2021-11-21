export enum Traits {
    CULTURAL = 'CULTURAL',
    HAZARDOUS = 'HAZARDOUS',
    INDUSTRIAL = 'INDUSTRIAL',
}

export interface Planet {
    readonly name: string;
    readonly trait?: Traits;
    readonly resources: number;
    readonly influence: number;
    readonly home?: string; // faction name
    readonly legendary?: string; // ability

    // Tech bonuses
    readonly biotic?: number; // green
    readonly warfare?: number; //red
    readonly propulsion?: number; // blue
    readonly cybernetic?: number; // yellow
}

export interface PlanetMap {
    [name: string]: Planet;
}

export function getPlanetsById(planets: PlanetMap, id: string | string[]): Planet[] {
    const idArray = Array.isArray(id) ? id : [id];

    const planetArray: Planet[] = [];
    idArray.forEach(i => {
        const planet = planets[i];
        if (planet) {
            planetArray.push(planet);
        }
    });

    return planetArray;
}
