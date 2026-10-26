import { z } from 'zod';
import { isPlayerName } from './playerName.js';

export const gameConnectionsSchema = z.object({
    players: z.array(z.object({
        playerId: z.string().refine(isPlayerName),
        tableEditing: z.boolean(),
    }).strict()).max(32),
    spectators: z.number().int().min(0).max(64),
}).strict();
export type GameConnections = z.infer<typeof gameConnectionsSchema>;
