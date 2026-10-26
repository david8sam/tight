import { z } from 'zod';

export const gameVersionSchema = z
    .object({
        incarnation: z.string().uuid(),
        revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    })
    .strict();
export type GameVersion = z.infer<typeof gameVersionSchema>;
