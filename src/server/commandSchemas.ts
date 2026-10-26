import { gameVersionSchema } from 'common/gameVersion.js';
import { z } from 'zod';

import { Phase, StrategyCardIndex, Version } from 'common/Game.js';
import { MessageType } from 'common/message.js';

import {
    factionNames,
    gameIdSchema,
    playerId,
    factionName,
    color,
    planetId,
    planetIds,
    playerIds,
    index,
    publicObjectives,
    secretObjectives,
    modifiers,
} from './gameSchemas.js';
export { gameIdSchema } from './gameSchemas.js';
const base = z.object({ gameId: gameIdSchema }).strict();
const faction = base.extend({ factionName });
const planet = faction.extend({ planetId: planetIds });
const status = base.extend({
    phase: z.nativeEnum(Phase).optional(),
    turn: z.nativeEnum(StrategyCardIndex).optional(),
    pickOrder: z.array(factionName).min(1).max(8).optional(),
    pickTurn: index.optional(),
    speaker: factionName.optional(),
});

export const gameCreateSchema = z
    .object({
        version: z.nativeEnum(Version).optional(),
        numPlayers: z.number().int().min(1).max(8).optional(),
        numRounds: z.number().int().min(1).max(20).optional(),
        numVictoryPoints: z.number().int().min(1).max(20).optional(),
        publicObjectives: publicObjectives.optional(),
    })
    .strict();
export const gameRestartSchema = gameCreateSchema.extend({ id: gameIdSchema });
export const gameDeleteSchema = z.object({ id: gameIdSchema }).strict();
export const gameQuerySchema = base;
export const connectionQuerySchema = z
    .object({
        gameId: gameIdSchema.optional(),
        playerId: playerId.optional(),
    })
    .strict();
export const factionQuerySchema = z
    .object({
        name: z
            .string()
            .min(1)
            .max(4096)
            .refine(value => {
                const names = value.split(',');
                return names.length <= 32 && names.every(name => factionNames.has(name));
            }, 'Unknown faction'),
    })
    .strict();
const selectablePlanetFields = new Set([
    'name',
    'trait',
    'resources',
    'influence',
    'home',
    'legendary',
    'DMZ',
    'biotic',
    'warfare',
    'propulsion',
    'cybernetic',
]);
export const planetQuerySchema = z
    .object({
        select: z
            .string()
            .max(256)
            .refine(
                value => !value || value === '*' || value.split(',').every(field => selectablePlanetFields.has(field)),
                'Unknown planet field',
            )
            .optional(),
    })
    .strict();

function command<Type extends MessageType, Data extends z.ZodObject>(type: Type, data: Data) {
    return z.object({ type: z.literal(type), data }).strict();
}

export const clientCommandSchema = z.discriminatedUnion('type', [
    command(MessageType.GAME_ADD_PLAYER, base.extend({ playerId })),
    command(
        MessageType.GAME_UPDATE_FACTION,
        base.extend({
            order: index,
            name: z.union([z.literal('None'), factionName]).optional(),
            color: color.optional(),
            playerIds: playerIds.optional(),
        }),
    ),
    command(MessageType.GAME_REORDER_FACTION, base.extend({ index, newIndex: index })),
    command(MessageType.START_GAME, base),
    command(MessageType.STOP_GAME, base),
    command(MessageType.END_GAME, base.extend({ ended: z.boolean().optional() })),
    command(MessageType.GAME_SET_PUBLIC_OBJECTIVES, base.extend({ publicObjectives })),
    command(MessageType.GAME_STATUS_SET, status),
    command(MessageType.GAME_SET_SPEAKER, base.extend({ speaker: factionName })),
    command(
        MessageType.GAME_SET_CUSTODIANS_REMOVED,
        base.extend({
            custodiansRemoved: z.boolean(),
            agenda1Voted: z.boolean().optional(),
            agenda2Voted: z.boolean().optional(),
        }),
    ),
    command(
        MessageType.GAME_SET_AGENDA_VOTED,
        base.extend({ agenda1Voted: z.boolean().optional(), agenda2Voted: z.boolean().optional() }),
    ),
    command(MessageType.GAME_NEXT_ROUND, base),
    command(MessageType.UPDATE_PLANET, base.extend({ planetId, modifiers })),
    command(MessageType.TAKE_NAALU_ZERO_TOKEN, faction),
    command(MessageType.TAKE_STRATEGY_CARD, faction.extend({ strategyCard: z.nativeEnum(StrategyCardIndex) })),
    command(
        MessageType.RETURN_STRATEGY_CARD,
        faction.extend({ strategyCard: z.nativeEnum(StrategyCardIndex).optional() }),
    ),
    command(MessageType.FLIP_STRATEGY_CARD, faction.extend({ flipped: z.boolean() })),
    command(MessageType.PASS_TURN, faction.extend({ passed: z.boolean() })),
    // JSON serializes sparse checkbox arrays as nulls; normalize those holes to false.
    command(
        MessageType.SET_PUBLIC_OBJECTIVES,
        faction.extend({
            publicObjectives: z
                .array(z.boolean().nullable())
                .max(100)
                .transform(values => values.map(value => value ?? false)),
        }),
    ),
    command(MessageType.SET_SECRET_OBJECTIVE, faction.extend({ secretObjectives })),
    command(
        MessageType.SET_VICTORY_POINTS,
        faction.extend({ victoryPoints: z.number().finite().int().min(-100).max(100) }),
    ),
    command(MessageType.TAKE_PLANET, planet),
    command(MessageType.LOST_PLANET, planet),
    command(MessageType.EXHAUST_PLANET, planet.extend({ ability: z.boolean().optional() })),
    command(MessageType.REFRESH_PLANET, planet.extend({ ability: z.boolean().optional() })),
    command(MessageType.EXHAUST_PLANET_ABILITY, planet),
    command(MessageType.REFRESH_PLANET_ABILITY, planet),
]);

export type ClientCommand = z.infer<typeof clientCommandSchema>;

export const clientRequestSchema = z
    .union([
        z
            .object({
                type: z.literal(MessageType.GAME_LOAD),
                data: base.extend({ playerId: playerId.nullable().optional() }),
            })
            .strict(),
        z
            .object({
                type: z.literal(MessageType.COMMAND_BATCH),
                id: z.string().uuid(),
                baseVersion: gameVersionSchema,
                data: base.extend({ commands: z.array(clientCommandSchema).min(1).max(32) }),
            })
            .strict(),
    ])
    .superRefine((request, context) => {
        if (
            request.type === MessageType.COMMAND_BATCH &&
            request.data.commands.some(command => command.data.gameId !== request.data.gameId)
        )
            context.addIssue({ code: z.ZodIssueCode.custom, message: 'Commands must belong to one game' });
    });
export type ClientRequest = z.infer<typeof clientRequestSchema>;
