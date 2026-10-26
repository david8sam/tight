import { z } from 'zod';
import { Game, Phase, StrategyCardIndex, Version } from 'common/Game.js';
import {
    planetNames,
    gameIdSchema,
    playerId,
    factionName,
    color,
    planetId,
    publicObjectives,
    secretObjectives,
    modifiers,
} from './gameSchemas.js';

const faction = z
    .object({
        name: z.union([z.literal('None'), factionName]),
        color,
        playerIds: z.array(playerId).max(32),
        hasNaaluZeroToken: z.boolean(),
        strategyCard: z.nativeEnum(StrategyCardIndex),
        strategyCardTaken: z.boolean(),
        stragetyCardFlipped: z.boolean(),
        passed: z.boolean(),
        planets: z.array(planetId).max(planetNames.size),
        secretObjectives,
        publicObjectives: z
            .array(z.boolean().nullable())
            .max(100)
            .transform(values => values.map(value => value ?? false)),
        victoryPoints: z.number().finite(),
    })
    .strict();

export const savedGameSchema: z.ZodType<Game> = z
    .object({
        id: gameIdSchema,
        date: z.number().int().nonnegative(),
        version: z.nativeEnum(Version),
        players: z.record(playerId, z.object({ id: playerId }).strict()),
        numPlayers: z.number().int().min(1).max(8),
        numRounds: z.number().int().min(1).max(20),
        numVictoryPoints: z.number().int().min(1).max(20),
        started: z.boolean(),
        factions: z.array(faction).min(1).max(8),
        publicObjectives,
        planets: z.record(
            planetId,
            z
                .object({
                    name: planetId,
                    owner: factionName.nullable(),
                    refreshed: z.boolean(),
                    refreshedAbility: z.boolean().optional(),
                    modifiers: modifiers.optional(),
                })
                .strict(),
        ),
        status: z
            .object({
                started: z.boolean(),
                ended: z.boolean(),
                round: z.number().int().min(1).max(20),
                phase: z.nativeEnum(Phase),
                turn: z.nativeEnum(StrategyCardIndex),
                speaker: z.union([z.literal(''), factionName]),
                pickOrder: z.array(z.union([z.literal('None'), factionName])).max(8),
                pickTurn: z.number().int().min(0).max(7),
                custodiansRemoved: z.boolean(),
                agenda1Voted: z.boolean(),
                agenda2Voted: z.boolean(),
            })
            .strict(),
    })
    .strict()
    .superRefine((game, context) => {
        if (
            Object.keys(game.players).length > 32 ||
            Object.keys(game.planets).length !== planetNames.size ||
            Object.values(game.planets).some(
                planet =>
                    planet.owner !== null &&
                    !game.factions.some(
                        faction => faction.name === planet.owner && faction.planets.includes(planet.name),
                    ),
            ) ||
            game.factions.some(
                faction =>
                    new Set(faction.planets).size !== faction.planets.length ||
                    faction.planets.some(name => game.planets[name]?.owner !== faction.name),
            ) ||
            game.factions.length !== game.numPlayers ||
            game.status.round > game.numRounds ||
            Object.entries(game.players).some(([id, player]) => id !== player.id) ||
            Object.entries(game.planets).some(([name, planet]) => name !== planet.name) ||
            game.factions.some(faction => faction.playerIds.some(id => !Object.hasOwn(game.players, id)))
        ) {
            context.addIssue({ code: z.ZodIssueCode.custom, message: 'Inconsistent saved game' });
        }
    });
