export enum Traits {
    CULTURAL = 'CULTURAL',
    HAZARDOUS = 'HAZARDOUS',
    INDUSTRIAL = 'INDUSTRIAL',
}

export interface Planet {
    name: string;
    trait?: Traits;
    resources: number;
    influence: number;
    home?: string; // faction name
    legendary?: string; // ability

    // Tech bonuses
    biotic?: number; // green
    warfare?: number; //red
    propulsion?: number; // blue
    cybernetic?: number; // yellow
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
