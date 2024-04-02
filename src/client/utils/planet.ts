import { GamePlanet } from 'common/Game';
import { Planet, Traits } from 'common/Planet';

import { PlanetData } from '../types';

export function getPlanetValue<P extends Planet | GamePlanet | PlanetData, K extends keyof P>(planet: P, key: K): P[K] {
    let value = planet[key];

    if ('modifiers' in planet && planet.modifiers && key in planet.modifiers) {
        const modifier = planet.modifiers[key as keyof typeof planet.modifiers];
        if (key === 'trait' && modifier !== undefined) {
            (value as Traits) = modifier as Traits;
        } else if (modifier !== undefined && (typeof value === 'number' || typeof value === 'undefined')) {
            (value as number) = (value ?? 0) + (modifier as number);
        }
    }

    return value;
}
