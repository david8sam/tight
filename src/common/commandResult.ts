import { z } from 'zod';
import { GAME_CODE_PATTERN } from './gameCode.js';
import { gameVersionSchema } from './gameVersion.js';

export const commandResultSchema = z
    .object({
        id: z.string().uuid(),
        gameId: z.string().regex(GAME_CODE_PATTERN),
        status: z.enum(['saved', 'duplicate', 'stale', 'conflict', 'rejected', 'missing', 'unconfirmed']),
        version: gameVersionSchema.nullable(),
        message: z.string().max(200).optional(),
    })
    .strict();
export type CommandResult = z.infer<typeof commandResultSchema>;
