import { clientRequestSchema, ClientRequest } from './commandSchemas.js';

type ParseResult = { kind: 'message'; message: ClientRequest } | { kind: 'invalid'; code: 1007 | 1008; reason: string };

export default function parseClientMessage(raw: string): ParseResult {
    let payload: unknown;
    try {
        payload = JSON.parse(raw);
    } catch {
        return { kind: 'invalid', code: 1007, reason: 'Invalid JSON' };
    }
    const result = clientRequestSchema.safeParse(payload);
    return result.success
        ? { kind: 'message', message: result.data }
        : { kind: 'invalid', code: 1008, reason: 'Invalid command' };
}
