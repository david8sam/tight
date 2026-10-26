export const MAX_PLAYER_NAME_LENGTH = 80;

export function isPlayerName(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        value.length > 0 &&
        value.length <= MAX_PLAYER_NAME_LENGTH &&
        value.trim().length > 0 &&
        !Object.hasOwn(Object.prototype, value) &&
        value !== 'prototype'
    );
}
