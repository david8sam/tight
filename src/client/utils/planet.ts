import { GamePlanet } from 'common/Game';
import { Planet, Traits } from 'common/Planet';

import { PlanetData } from '../types';

type PlanetType = Planet | GamePlanet | PlanetData;

type PlanetTypeWithModifiers = PlanetType & {
    trait?: Traits | Traits[];
};

function isTraitsModifier(k: string, v: unknown): v is Traits[] {
    return k === 'trait';
}

export function getPlanetValue<P extends PlanetTypeWithModifiers, K extends keyof P>(planet: P, key: K): P[K] {
    let value = planet[key];

    if ('modifiers' in planet && planet.modifiers && key in planet.modifiers) {
        const modifier = planet.modifiers[key as keyof typeof planet.modifiers];
        if (isTraitsModifier(key as string, modifier)) {
            (value as Traits[]) = modifier;
        } else if (key === 'DMZ' && typeof value === 'boolean') {
            (value as boolean) = modifier as boolean;
        } else if (modifier !== undefined && (typeof value === 'number' || typeof value === 'undefined')) {
            (value as number) = (value ?? 0) + (modifier as number);
        }
    }

    return value;
}
