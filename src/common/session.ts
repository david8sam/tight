import { z } from 'zod';
import { isGameCode } from './gameCode.js';
import { isPlayerName } from './playerName.js';

const gameId = z.string().refine(isGameCode);
const playerId = z.string().refine(isPlayerName);
export const guestSessionSchema = z.discriminatedUnion('role', [
    z.object({ role: z.literal('player'), gameId, playerId, tableEditing: z.literal(true).optional() }).strict(),
    z.object({ role: z.literal('spectator'), gameId }).strict(),
]);
export const sessionSchema = z.union([
    z.object({ role: z.literal('host') }).strict(),
    z.object({ role: z.literal('unpaired') }).strict(),
    guestSessionSchema,
]);
export type GuestSession = z.infer<typeof guestSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;
