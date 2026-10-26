import { Response } from 'express';
import { z } from 'zod';

export function parseRequest<Schema extends z.ZodType>(
    schema: Schema,
    value: unknown,
    res: Response,
): z.ZodSafeParseResult<z.output<Schema>> {
    const result = schema.safeParse(value);
    if (!result.success) res.status(400).json({ error: 'Invalid request' });
    return result;
}
