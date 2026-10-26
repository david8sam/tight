import { z } from 'zod';

import { Traits } from 'common/Planet.js';
import { GAME_CODE_PATTERN } from 'common/gameCode.js';
import { isPlayerName } from 'common/playerName.js';
import { FactionColor } from 'common/colors.js';
import { listFactionNames } from './database/faction/index.js';
import { listPlanetNames } from './database/planet/index.js';

export const factionNames = new Set(listFactionNames());
export const planetNames = new Set(listPlanetNames());
export const gameIdSchema = z.string().regex(GAME_CODE_PATTERN);
export const playerId = z.string().refine(isPlayerName, 'Invalid player name');
export const factionName = z.string().refine(value => factionNames.has(value), 'Unknown faction');
export const color = z
    .string()
    .refine(
        value => value === 'None' || Object.values(FactionColor).some(candidate => candidate === value),
        'Unknown color',
    );
export const planetId = z.string().refine(value => planetNames.has(value), 'Unknown planet');
export const planetIds = z.union([planetId, z.array(planetId).max(planetNames.size)]);
export const playerIds = z
    .array(playerId)
    .max(32)
    .refine(values => new Set(values).size === values.length);
export const index = z.number().int().min(0).max(7);
export const objective = z
    .object({
        id: z.number().int(),
        description: z.string().max(1024),
        vp: z.number().int().min(1).max(10),
    })
    .strict();
export const publicObjective = objective.extend({ id: z.number().int().min(1).max(100) });
export const publicObjectives = z
    .array(publicObjective)
    .max(50)
    .refine(values => new Set(values.map(value => value.id)).size === values.length, 'Duplicate objective IDs');
export const secretObjectives = z
    .array(
        z
            .object({
                cleared: z.boolean(),
                objective: objective.extend({ id: z.number().int().min(-3).max(-1) }),
            })
            .strict(),
    )
    .length(3)
    .refine(
        values => values.every((value, position) => value.objective.id === -position - 1),
        'Invalid secret objective order',
    );
export const modifier = z.number().finite().int().min(-100).max(100).optional();
export const modifiers = z
    .object({
        resources: modifier,
        influence: modifier,
        biotic: modifier,
        warfare: modifier,
        propulsion: modifier,
        cybernetic: modifier,
        trait: z.array(z.nativeEnum(Traits)).max(3).optional(),
        DMZ: z.boolean().optional(),
    })
    .strict();
