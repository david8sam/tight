import { Response, Router } from 'express';

import {
    NoParams,
    PlanetListNamesResults,
    PlanetListResults,
    PlanetSearchParams,
    PlanetSearchResults,
} from 'common/api.js';
import { Planet } from 'common/Planet.js';

import { listPlanetNames, listPlanets, Planets } from '../database/planet/index.js';

import { GetRequest } from './types.js';

export default function initializePlanetOperations(router: Router) {
    router.get('/planet/list-names', (req: GetRequest<NoParams>, res: Response<PlanetListNamesResults>): void => {
        const names = listPlanetNames();
        res.status(200).json(names);
    });

    router.get('/planet/list', (req: GetRequest<NoParams>, res: Response<PlanetListResults>): void => {
        const planets = listPlanets();
        res.status(200).json(planets);
    });

    router.get('/planet/search', (req: GetRequest<PlanetSearchParams>, res: Response<PlanetSearchResults>): void => {
        const allPlanets = Planets as Planet[];
        const select = req.query.select ? req.query.select.trim().split(',') : ['*'];

        let planets: Partial<Planet>[] = [];
        if (select.length === 1 && select[0] === '*') {
            planets = allPlanets;
        } else {
            allPlanets.forEach(p => {
                const planet = (select as (keyof Planet)[]).reduce((a, key) => {
                    const value = p[key];
                    if (key && value) {
                        a[key] = value;
                    }

                    return a;
                }, {} as Record<string, unknown>);

                planets.push(planet as Partial<Planet>);
            });
        }

        res.status(200).json(planets);
    });
}
