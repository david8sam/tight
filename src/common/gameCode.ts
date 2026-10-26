export const GAME_CODE_PATTERN = /^[A-Z]{4}$/;

export function isGameCode(value: unknown): value is string {
    return typeof value === 'string' && GAME_CODE_PATTERN.test(value);
}
