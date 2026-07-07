import { useEffect, useState } from 'react';

import { PlanetMap } from 'common/Planet';

import api from '../utils/api';

// Static catalog — fetch once per session and share across all consumers.
let cache: PlanetMap | null = null;
let pending: Promise<PlanetMap> | null = null;

function loadPlanetMap(): Promise<PlanetMap> {
    if (cache) {
        return Promise.resolve(cache);
    }

    if (!pending) {
        pending = api.planetList().then(planets => {
            cache = planets;
            pending = null;
            return planets;
        });
    }

    return pending;
}

/**
 * The static planet catalog (name -> base stats). Returns null until loaded.
 */
export default function usePlanetMap(): PlanetMap | null {
    const [planetMap, setPlanetMap] = useState<PlanetMap | null>(cache);

    useEffect(() => {
        if (planetMap) {
            return undefined;
        }

        let mounted = true;
        loadPlanetMap().then(planets => {
            if (mounted) {
                setPlanetMap(planets);
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    return planetMap;
}
