import { z } from 'zod';
import { GAME_CODE_PATTERN } from './gameCode.js';

export const savedGameNameSchema = z.string().trim().min(1).max(80).nullable();

export const savedGameListSchema = z.array(
    z
        .object({
            id: z.string().regex(GAME_CODE_PATTERN),
            date: z.number().int().nonnegative(),
            name: savedGameNameSchema,
            archived: z.boolean(),
            lastPlayed: z.number().int().nonnegative(),
            round: z.number().int().positive(),
            numRounds: z.number().int().positive(),
            players: z.array(z.string()),
            state: z.enum(['setup', 'playing', 'finished']),
        })
        .strict(),
);
export type SavedGameSummary = z.infer<typeof savedGameListSchema>[number];
