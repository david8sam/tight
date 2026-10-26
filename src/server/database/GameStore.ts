import { SavedGameSummary, savedGameNameSchema } from 'common/savedGames.js';
import { gameVersionSchema, GameVersion } from 'common/gameVersion.js';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { guestSessionSchema, GuestSession } from 'common/session.js';
import { Game, GameMap } from 'common/Game.js';
import { savedGameSchema } from '../savedGameSchema.js';

export function dataDirectory(): string {
    if (process.env.TIGHT_DATA_DIR) return path.resolve(process.env.TIGHT_DATA_DIR);
    if (process.platform === 'win32')
        return path.join(process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local'), 'TIGHT');
    return path.join(process.env.XDG_DATA_HOME || path.join(homedir(), '.local', 'share'), 'tight');
}

export class CommandRejected extends Error {}

export class StorageError extends Error {
    constructor(cause: unknown) {
        super('Could not save game', { cause });
    }
}

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const commandIdentitySchema = z
    .object({
        id: z.string().uuid(),
        principal: digest,
        payloadHash: digest,
        version: gameVersionSchema,
    })
    .strict();
const receiptSchema = z.object({
    game_id: z.string(),
    principal: digest,
    command_id: z.string().uuid(),
    payload_hash: digest,
    revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
export type CommandIdentity = z.infer<typeof commandIdentitySchema>;
export type CommandCommit =
    | { status: 'saved'; version: GameVersion; game: Game }
    | { status: 'duplicate' | 'stale' | 'conflict'; version: GameVersion }
    | { status: 'missing' };

/** One host owns the database for its lifetime. SQLite releases the lock after a crash. */
export class GameStore {
    private readonly database: DatabaseSync;
    constructor(
        private readonly directory: string,
        private readonly onWriteError: (error: unknown) => void = () => {},
    ) {
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        this.database = new DatabaseSync(path.join(directory, 'games.sqlite'));
        try {
            this.database.exec(
                'PRAGMA foreign_keys=ON; PRAGMA busy_timeout=1000; PRAGMA locking_mode=EXCLUSIVE; BEGIN EXCLUSIVE',
            );
            const version = z
                .object({ user_version: z.number() })
                .parse(this.database.prepare('PRAGMA user_version').get()).user_version;
            if (version === 0) {
                const tables = this.database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
                if (tables.length) throw new Error('Unversioned game database; refusing to overwrite');
                this.database.exec('CREATE TABLE games (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL)');
                this.createAccessSchema();
                this.createCommandSchema();
                this.createLibrarySchema();
                this.createTableEditingSchema();
            } else if (version === 1 || version === 2 || version === 3 || version === 4) {
                // Validate before VACUUM or schema writes so an invalid old save is preserved.
                const games = this.readGames();
                if (version >= 2) this.validateAccessSessions(games);
                if (version >= 3) this.validateCommandStorage(games);
                if (version === 4) this.savedGames();
                this.backupMigration(version);
                if (version === 1) this.createAccessSchema();
                if (version < 3) this.createCommandSchema();
                if (version < 4) this.createLibrarySchema();
                this.createTableEditingSchema();
            } else if (version !== 5) {
                throw new Error('Unsupported game database version; use a compatible version of TIGHT');
            }
            this.database.exec('COMMIT; PRAGMA synchronous=FULL');
        } catch (error) {
            this.database.close();
            throw error;
        }
    }
    private writeError(cause: unknown): StorageError {
        if (cause instanceof StorageError) return cause;
        try {
            this.onWriteError(cause);
        } catch {
            // Diagnostic observers must not interrupt rollback or replace the storage failure.
        }
        return new StorageError(cause);
    }
    private failTransaction(cause: unknown, transaction: boolean): never {
        const failure = cause instanceof CommandRejected ? cause : this.writeError(cause);
        if (transaction) {
            try {
                this.database.exec('ROLLBACK');
            } catch (rollbackError) {
                // SQLite may already have rolled back. Preserve the original write failure.
                if (failure instanceof CommandRejected) throw this.writeError(rollbackError);
            }
        }
        throw failure;
    }
    close(): void {
        this.database.close();
    }
    private createLibrarySchema(): void {
        this.database.exec(`ALTER TABLE games ADD COLUMN name TEXT;
            ALTER TABLE games ADD COLUMN archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0, 1));
            ALTER TABLE games ADD COLUMN last_played INTEGER NOT NULL DEFAULT 0 CHECK(last_played >= 0);
            PRAGMA user_version=4`);
        const update = this.database.prepare('UPDATE games SET last_played=? WHERE id=?');
        for (const game of Object.values(this.readGames())) update.run(game.date, game.id);
    }
    savedGames(): SavedGameSummary[] {
        const games = this.database.prepare('SELECT id, snapshot, name, archived, last_played FROM games').all().map(raw => {
            const row = z.object({
                id: z.string(), snapshot: z.string(), name: savedGameNameSchema,
                archived: z.union([z.literal(0), z.literal(1)]),
                last_played: z.number().int().nonnegative(),
            }).parse(raw);
            const game = savedGameSchema.parse(JSON.parse(row.snapshot));
            if (game.id !== row.id) throw new Error('Saved game ID mismatch');
            return {
                id: game.id, date: game.date, name: row.name, archived: row.archived === 1,
                lastPlayed: row.last_played, round: game.status.round, numRounds: game.numRounds,
                players: Object.keys(game.players),
                state: game.status.ended ? 'finished' : game.status.started ? 'playing' : 'setup',
            } satisfies SavedGameSummary;
        });
        return games.sort((a, b) => b.lastPlayed - a.lastPlayed || a.id.localeCompare(b.id));
    }
    organize(id: string, change: { name: string | null } | { archived: boolean }): boolean {
        try {
            const result = 'name' in change
                ? this.database.prepare('UPDATE games SET name=? WHERE id=?').run(change.name, id)
                : this.database.prepare('UPDATE games SET archived=? WHERE id=?').run(Number(change.archived), id);
            return result.changes > 0;
        } catch (cause) {
            throw this.writeError(cause);
        }
    }
    private createTableEditingSchema(): void {
        this.database.exec(`ALTER TABLE access_sessions ADD COLUMN table_editing INTEGER NOT NULL DEFAULT 0
            CHECK(table_editing IN (0, 1) AND (role='player' OR table_editing=0));
            PRAGMA user_version=5`);
    }
    private createAccessSchema(): void {
        this.database.exec(`CREATE TABLE access_sessions (
            token_hash TEXT PRIMARY KEY,
            game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('player', 'spectator')),
            player_id TEXT,
            CHECK ((role='player' AND player_id IS NOT NULL) OR (role='spectator' AND player_id IS NULL))
        ); PRAGMA user_version=2`);
    }
    private backupMigration(version: number): void {
        this.database.exec('COMMIT');
        const directory = path.join(this.directory, 'backups', 'migrations');
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        this.database
            .prepare('VACUUM INTO ?')
            .run(path.join(directory, `v${version}-${Date.now()}-${randomUUID()}.sqlite`));
        this.database.exec('BEGIN EXCLUSIVE');
    }
    private createCommandSchema(): void {
        this.database
            .exec(`ALTER TABLE games ADD COLUMN incarnation TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
            ALTER TABLE games ADD COLUMN revision INTEGER NOT NULL DEFAULT 0 CHECK(revision >= 0 AND revision <= 9007199254740991);
            CREATE TABLE command_receipts (
                sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
                principal TEXT NOT NULL,
                command_id TEXT NOT NULL,
                payload_hash TEXT NOT NULL,
                revision INTEGER NOT NULL CHECK(revision >= 0 AND revision <= 9007199254740991),
                UNIQUE(game_id, principal, command_id)
            );
            CREATE INDEX command_receipts_game_sequence ON command_receipts(game_id, sequence);
            PRAGMA user_version=3`);
        const update = this.database.prepare('UPDATE games SET incarnation=? WHERE id=?');
        for (const raw of this.database.prepare('SELECT id FROM games').all()) {
            const { id } = z.object({ id: z.string() }).parse(raw);
            update.run(randomUUID(), id);
        }
    }
    version(id: string): GameVersion | null {
        const raw = this.database.prepare('SELECT incarnation, revision FROM games WHERE id=?').get(id);
        return raw ? gameVersionSchema.parse(raw) : null;
    }
    private validateCommandStorage(games: GameMap): void {
        const versions = new Map<string, GameVersion>();
        for (const raw of this.database.prepare('SELECT id, incarnation, revision FROM games').all()) {
            const row = z.object({ id: z.string(), incarnation: z.string(), revision: z.number() }).parse(raw);
            versions.set(row.id, gameVersionSchema.parse({ incarnation: row.incarnation, revision: row.revision }));
        }
        let count = 0;
        for (const raw of this.database
            .prepare('SELECT game_id, principal, command_id, payload_hash, revision FROM command_receipts LIMIT 10001')
            .all()) {
            if (++count > 10000) throw new Error('Saved command receipt limit exceeded');
            const row = receiptSchema.parse(raw);
            const version = versions.get(row.game_id);
            if (!games[row.game_id] || !version || row.revision > version.revision)
                throw new Error('Saved command receipt references an invalid game revision');
        }
    }
    private readGames(): GameMap {
        const games: GameMap = {};
        for (const raw of this.database.prepare('SELECT id, snapshot FROM games').all()) {
            const row = z.object({ id: z.string(), snapshot: z.string() }).parse(raw);
            const game = savedGameSchema.parse(JSON.parse(row.snapshot));
            if (game.id !== row.id) throw new Error('Saved game ID mismatch');
            games[game.id] = game;
        }
        return games;
    }
    private validateAccessSessions(games: GameMap, tableEditing = false): void {
        for (const raw of this.database
            .prepare(`SELECT token_hash, game_id, role, player_id, ${tableEditing ? 'table_editing' : '0 AS table_editing'} FROM access_sessions`)
            .all()) {
            const row = z
                .object({
                    token_hash: z.string().regex(/^[a-f0-9]{64}$/),
                    game_id: z.string(),
                    role: z.enum(['player', 'spectator']),
                    player_id: z.string().nullable(),
                    table_editing: z.union([z.literal(0), z.literal(1)]),
                })
                .parse(raw);
            guestSessionSchema.parse({
                role: row.role,
                gameId: row.game_id,
                ...(row.role === 'player' ? { playerId: row.player_id } : {}),
                ...(row.table_editing === 1 ? { tableEditing: true } : {}),
            });
            if (!games[row.game_id]) throw new Error('Saved device grant references a missing game');
        }
    }
    load(): GameMap {
        const games = this.readGames();
        this.validateAccessSessions(games, true);
        this.validateCommandStorage(games);
        this.savedGames();
        if (Object.keys(games).length) {
            const backups = path.join(this.directory, 'backups');
            mkdirSync(backups, { recursive: true, mode: 0o700 });
            const filename = `${Date.now()}-${randomUUID()}.sqlite`;
            this.database.prepare('VACUUM INTO ?').run(path.join(backups, filename));
            for (const old of readdirSync(backups)
                .filter(name => /^\d+-[a-f0-9-]+\.sqlite$/.test(name))
                .sort()
                .slice(0, -3)) {
                unlinkSync(path.join(backups, old));
            }
        }
        return games;
    }
    findAccessSession(hash: string): GuestSession | null {
        const raw = this.database
            .prepare('SELECT game_id, role, player_id, table_editing FROM access_sessions WHERE token_hash=?')
            .get(hash);
        if (!raw) return null;
        const row = z
            .object({ game_id: z.string(), role: z.enum(['player', 'spectator']), player_id: z.string().nullable(), table_editing: z.union([z.literal(0), z.literal(1)]) })
            .parse(raw);
        return guestSessionSchema.parse({
            role: row.role,
            gameId: row.game_id,
            ...(row.role === 'player' ? { playerId: row.player_id } : {}),
            ...(row.table_editing === 1 ? { tableEditing: true } : {}),
        });
    }
    revokeAccessSessions(gameId: string): void {
        try {
            this.database.prepare('DELETE FROM access_sessions WHERE game_id=?').run(gameId);
        } catch (cause) {
            throw this.writeError(cause);
        }
    }
    saveAccessSession(hash: string, session: GuestSession): void {
        let transaction = false;
        try {
            this.database.exec('BEGIN IMMEDIATE');
            transaction = true;
            if (session.role === 'player')
                this.database
                    .prepare('DELETE FROM access_sessions WHERE game_id=? AND player_id=?')
                    .run(session.gameId, session.playerId);
            this.database
                .prepare('INSERT INTO access_sessions(token_hash, game_id, role, player_id, table_editing) VALUES (?, ?, ?, ?, ?)')
                .run(hash, session.gameId, session.role, session.role === 'player' ? session.playerId : null, session.role === 'player' && session.tableEditing ? 1 : 0);
            this.database.exec('COMMIT');
        } catch (cause) {
            this.failTransaction(cause, transaction);
        }
    }
    save(game: Game): Game {
        // Parse the serialized form so sparse objective arrays have the same representation on disk and reload.
        const saved = savedGameSchema.parse(JSON.parse(JSON.stringify(game)));
        const snapshot = JSON.stringify(saved);
        try {
            this.database
                .prepare(
                    `INSERT INTO games(id, snapshot, incarnation, revision, last_played) VALUES (?, ?, ?, 1, ?)
                    ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot, revision=games.revision+1, last_played=MAX(games.last_played, excluded.last_played)
                    WHERE games.snapshot != excluded.snapshot`,
                )
                .run(game.id, snapshot, randomUUID(), Date.now());
            return saved;
        } catch (cause) {
            throw this.writeError(cause);
        }
    }
    commitCommand(id: string, identity: CommandIdentity, change: () => Game): CommandCommit {
        const command = commandIdentitySchema.parse(identity);
        let transaction = false;
        try {
            this.database.exec('BEGIN IMMEDIATE');
            transaction = true;
            const current = this.version(id);
            let result: CommandCommit;
            if (!current) result = { status: 'missing' };
            else {
                const raw = this.database
                    .prepare(
                        'SELECT payload_hash, revision FROM command_receipts WHERE game_id=? AND principal=? AND command_id=?',
                    )
                    .get(id, command.principal, command.id);
                const receipt = raw
                    ? z.object({ payload_hash: digest, revision: z.number().int().nonnegative() }).parse(raw)
                    : null;
                if (receipt)
                    result =
                        receipt.payload_hash === command.payloadHash
                            ? { status: 'duplicate', version: { ...current, revision: receipt.revision } }
                            : { status: 'conflict', version: current };
                else if (
                    current.incarnation !== command.version.incarnation ||
                    current.revision !== command.version.revision
                )
                    result = { status: 'stale', version: current };
                else {
                    const candidate = change();
                    if (candidate.id !== id) throw new Error('Command changed the game ID');
                    const saved = this.save(candidate);
                    const version = this.version(id);
                    if (!version) throw new Error('Game disappeared during command commit');
                    this.database
                        .prepare(
                            'INSERT INTO command_receipts(game_id, principal, command_id, payload_hash, revision) VALUES (?, ?, ?, ?, ?)',
                        )
                        .run(id, command.principal, command.id, command.payloadHash, version.revision);
                    this.database
                        .prepare(
                            'DELETE FROM command_receipts WHERE game_id=? AND sequence NOT IN (SELECT sequence FROM command_receipts WHERE game_id=? ORDER BY sequence DESC LIMIT 2000)',
                        )
                        .run(id, id);
                    this.database.exec(
                        'DELETE FROM command_receipts WHERE sequence NOT IN (SELECT sequence FROM command_receipts ORDER BY sequence DESC LIMIT 10000)',
                    );
                    result = { status: 'saved', version, game: saved };
                }
            }
            this.database.exec('COMMIT');
            return result;
        } catch (cause) {
            this.failTransaction(cause, transaction);
        }
    }
    delete(id: string): void {
        try {
            this.database.prepare('DELETE FROM games WHERE id=?').run(id);
        } catch (cause) {
            throw this.writeError(cause);
        }
    }
}
