import { isGameCode } from 'common/gameCode';
import { isPlayerName } from 'common/playerName';

type Hint = 'gameId' | 'playerId' | 'theme';
type Backing = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function parseHint(key: Hint, value: string | null): string | null {
    switch (key) {
        case 'gameId': return isGameCode(value) ? value : null;
        case 'playerId': return isPlayerName(value) ? value : null;
        case 'theme': return value === 'light' || value === 'dark' ? value : null;
    }
}

/** Optional tab hints never establish permissions or own durable game data. */
export function createSessionHints(storage: () => Backing) {
    const memory = new Map<Hint, string>();
    let available = true;
    return {
        getItem(key: Hint): string | null {
            if (available) {
                try {
                    const value = parseHint(key, storage().getItem(key));
                    if (value === null) memory.delete(key);
                    else memory.set(key, value);
                    return value;
                } catch {
                    available = false;
                }
            }
            return memory.get(key) ?? null;
        },
        setItem(key: Hint, value: string): void {
            memory.set(key, value);
            if (available) {
                try { storage().setItem(key, value); } catch { available = false; }
            }
        },
        removeItem(key: Hint): void {
            memory.delete(key);
            if (available) {
                try { storage().removeItem(key); } catch { available = false; }
            }
        },
    };
}

// Resolve the browser API lazily: even accessing the property can throw.
export const sessionHints = createSessionHints(() => window.sessionStorage);
