import { Planet, PlanetMap } from 'common/Planet.js';

import PlanetsTI4 from './TI4.js';
import PlanetsTI4ProphecyOfKings from './TI4ProphecyOfKings.js';

export const Planets: readonly Planet[] = [...PlanetsTI4, ...PlanetsTI4ProphecyOfKings].sort((aa, bb) => {
    // Sort alphabetically
    const a = aa.name.toLowerCase();
    const b = bb.name.toLowerCase();
    return a.localeCompare(b);
});

export const PlanetsMap: Readonly<PlanetMap> = Planets.reduce((m: PlanetMap, p: Planet): PlanetMap => {
    m[p.name] = p;
    return m;
}, {});

export function listPlanets(): Readonly<PlanetMap> {
    return PlanetsMap;
}

export function getFactionPlanets(name: string) {
    if (!name) {
        return [];
    }

    return Planets.filter(p => p.home === name);
}
