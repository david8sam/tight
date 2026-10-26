import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
process.env.TIGHT_USE_HTTP = 'true';
const { startBackend, GameStore } = await import('../build/backend.js');
const principal = 'a'.repeat(64);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const identity = (version, value = {}, actor = principal) => ({
    id: randomUUID(),
    version,
    principal: actor,
    payloadHash: hash(value),
});

async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-commands-'));
    let backend;
    let store;
    t.after(async () => {
        store?.close();
        await backend?.stop();
        await rm(directory, { recursive: true, force: true });
    });
    backend = await startBackend({ host: '127.0.0.1', port: 0, dataDirectory: directory });
    const headers = { cookie: `tight-session=${backend.hostToken}`, 'Content-Type': 'application/json' };
    const id = await (
        await fetch(`${backend.origin}/api/game/create`, { method: 'POST', headers, body: '{"numPlayers":1}' })
    ).json();
    const { game } = await (await fetch(`${backend.origin}/api/game/export?gameId=${id}`, { headers })).json();
    await backend.stop();
    const open = onWriteError => {
        assert.equal(store, undefined);
        store = new GameStore(directory, onWriteError);
        store.load();
        return store;
    };
    const close = () => {
        store?.close();
        store = undefined;
    };
    const sql = operation => {
        assert.equal(store, undefined);
        const db = new DatabaseSync(path.join(directory, 'games.sqlite'));
        try {
            return operation(db);
        } finally {
            db.close();
        }
    };
    return { directory, game, open, close, sql };
}

const scored = (game, value) => {
    const next = structuredClone(game);
    next.factions[0].victoryPoints = value;
    return next;
};
const mustNotApply = () => {
    throw new Error('Rejected or repeated command was executed');
};

test('command receipts survive reopen, reject stale or conflicting edits, and distinguish principals and game incarnations', async t => {
    const f = await fixture(t);
    let store = f.open();
    const version = store.version(f.game.id);
    assert.equal(version.revision, 1);
    const command = identity(version, { score: 1 });
    const saved = store.commitCommand(f.game.id, command, () => scored(f.game, 1));
    assert.equal(saved.status, 'saved');
    assert.deepEqual(saved.version, { ...version, revision: 2 });
    assert.equal(store.commitCommand(f.game.id, command, mustNotApply).status, 'duplicate');
    assert.equal(
        store.commitCommand(f.game.id, { ...command, payloadHash: hash({ score: 2 }) }, mustNotApply).status,
        'conflict',
    );
    assert.equal(store.commitCommand(f.game.id, identity(version), mustNotApply).status, 'stale');
    const other = store.commitCommand(
        f.game.id,
        { ...command, principal: 'b'.repeat(64), payloadHash: hash({ score: 2 }), version: saved.version },
        () => scored(f.game, 2),
    );
    assert.equal(other.status, 'saved');
    assert.equal(other.version.revision, 3);
    const noop = identity(other.version);
    assert.deepEqual(store.commitCommand(f.game.id, noop, () => other.game).version, other.version);
    assert.equal(store.commitCommand(f.game.id, noop, mustNotApply).status, 'duplicate');
    store.save(other.game);
    assert.deepEqual(
        store.version(f.game.id),
        other.version,
        'saving an unchanged snapshot does not invent a revision',
    );
    f.close();
    store = f.open();
    assert.deepEqual(store.version(f.game.id), other.version);
    assert.deepEqual(store.commitCommand(f.game.id, command, mustNotApply), {
        status: 'duplicate',
        version: saved.version,
    });
    store.saveAccessSession(principal, { role: 'player', gameId: f.game.id, playerId: 'Phone' });
    store.delete(f.game.id);
    store.save(f.game);
    const replacement = store.version(f.game.id);
    assert.notEqual(replacement.incarnation, version.incarnation);
    assert.equal(replacement.revision, 1);
    assert.equal(store.findAccessSession(principal), null);
    assert.equal(store.commitCommand(f.game.id, command, mustNotApply).status, 'stale');
    assert.deepEqual(store.load()[f.game.id], f.game);
});

test('a failed receipt write rolls back its game and revision, and retry can commit after storage recovers', async t => {
    const f = await fixture(t);
    let store = f.open();
    const version = store.version(f.game.id);
    const command = identity(version, { score: 3 });
    f.close();
    f.sql(db =>
        db.exec(
            "CREATE TRIGGER reject_receipt BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'simulated receipt failure'); END",
        ),
    );
    store = f.open();
    assert.throws(() => store.commitCommand(f.game.id, command, () => scored(f.game, 3)), /Could not save game/);
    assert.deepEqual(store.version(f.game.id), version);
    assert.deepEqual(store.load()[f.game.id], f.game);
    f.close();
    f.sql(db => {
        assert.equal(db.prepare('SELECT count(*) AS count FROM command_receipts').get().count, 0);
        db.exec('DROP TRIGGER reject_receipt');
    });
    store = f.open();
    const result = store.commitCommand(f.game.id, command, () => scored(f.game, 3));
    assert.equal(result.status, 'saved');
    assert.equal(result.version.revision, 2);
    assert.equal(store.load()[f.game.id].factions[0].victoryPoints, 3);
});

test('a forced process exit after commit retains both state and its receipt', async t => {
    const f = await fixture(t);
    const store = f.open();
    const command = identity(store.version(f.game.id), { score: 4 });
    f.close();
    const code = `import { GameStore } from ${JSON.stringify(new URL('../build/backend.js', import.meta.url).href)};
        const store = new GameStore(process.argv[1]);
        const [game] = Object.values(store.load());
        const result = store.commitCommand(game.id, JSON.parse(process.argv[2]), () => {
            game.factions[0].victoryPoints = 4; return game;
        });
        if (result.status !== 'saved') process.exit(2);
        process.kill(process.pid, 'SIGKILL');`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', code, f.directory, JSON.stringify(command)], {
        stdio: ['ignore', 'ignore', 'pipe'],
    });
    let errors = '';
    child.stderr.on('data', value => (errors += value));
    const timer = setTimeout(() => child.kill('SIGKILL'), 10000);
    const [status, signal] = await once(child, 'exit').finally(() => clearTimeout(timer));
    assert.ok(status !== 0 || signal, errors);
    const reopened = f.open();
    assert.equal(reopened.load()[f.game.id].factions[0].victoryPoints, 4, errors);
    assert.deepEqual(reopened.commitCommand(f.game.id, command, mustNotApply), {
        status: 'duplicate',
        version: { ...command.version, revision: 2 },
    });
});

test('version-two migration preserves games and grants with a separate pre-migration backup', async t => {
    const f = await fixture(t);
    f.sql(db => {
        db.exec(
            'ALTER TABLE access_sessions DROP COLUMN table_editing; DROP TABLE command_receipts; ALTER TABLE games DROP COLUMN name; ALTER TABLE games DROP COLUMN archived; ALTER TABLE games DROP COLUMN last_played; ALTER TABLE games DROP COLUMN incarnation; ALTER TABLE games DROP COLUMN revision; PRAGMA user_version=2',
        );
        db.prepare('INSERT INTO access_sessions(token_hash, game_id, role, player_id) VALUES (?, ?, ?, ?)').run(
            principal,
            f.game.id,
            'player',
            'Phone',
        );
    });
    const store = f.open();
    assert.deepEqual(store.load()[f.game.id], f.game);
    assert.equal(store.version(f.game.id).revision, 0);
    assert.equal(store.findAccessSession(principal).playerId, 'Phone');
    const backups = await readdir(path.join(f.directory, 'backups', 'migrations'));
    const names = backups.filter(name => name.startsWith('v2-'));
    assert.equal(names.length, 1);
    const backup = new DatabaseSync(path.join(f.directory, 'backups', 'migrations', names[0]), { readOnly: true });
    try {
        assert.equal(backup.prepare('PRAGMA user_version').get().user_version, 2);
        assert.deepEqual(JSON.parse(backup.prepare('SELECT snapshot FROM games').get().snapshot), f.game);
        assert.equal(backup.prepare('SELECT token_hash FROM access_sessions').get().token_hash, principal);
    } finally {
        backup.close();
    }
});

test('an invalid version-two grant prevents migration without changing the original database', async t => {
    const f = await fixture(t);
    f.sql(db => {
        db.exec(
            'ALTER TABLE access_sessions DROP COLUMN table_editing; DROP TABLE command_receipts; ALTER TABLE games DROP COLUMN name; ALTER TABLE games DROP COLUMN archived; ALTER TABLE games DROP COLUMN last_played; ALTER TABLE games DROP COLUMN incarnation; ALTER TABLE games DROP COLUMN revision; PRAGMA user_version=2; PRAGMA ignore_check_constraints=ON',
        );
        db.prepare('INSERT INTO access_sessions(token_hash, game_id, role, player_id) VALUES (?, ?, ?, ?)').run(
            principal,
            f.game.id,
            'host',
            null,
        );
    });
    const filename = path.join(f.directory, 'games.sqlite');
    const original = await readFile(filename);
    assert.throws(() => new GameStore(f.directory));
    assert.deepEqual(await readFile(filename), original);
    await assert.rejects(readdir(path.join(f.directory, 'backups')), { code: 'ENOENT' });
});

test('receipt retention stays bounded and a pruned committed change cannot be applied again', async t => {
    const f = await fixture(t);
    let store = f.open();
    const ids = ['ABCA', 'ABCB', 'ABCC', 'ABCD', 'ABCE', 'ABCF'].filter(id => id !== f.game.id).slice(0, 5);
    for (const id of ids) store.save({ ...f.game, id });
    const old = identity(store.version(ids[0]), { score: 1 });
    assert.equal(store.commitCommand(ids[0], old, () => scored({ ...f.game, id: ids[0] }, 1)).status, 'saved');
    f.close();
    let oldestInSecond;
    f.sql(db => {
        // Seed valid retained no-op receipts in one transaction rather than paying 10,000 fsyncs.
        const insert = db.prepare(
            'INSERT INTO command_receipts(game_id, principal, command_id, payload_hash, revision) VALUES (?, ?, ?, ?, ?)',
        );
        db.exec('BEGIN IMMEDIATE');
        for (let game = 0; game < ids.length; game++) {
            for (let index = game === 0 ? 1 : 0; index < 2000; index++) {
                const command = randomUUID();
                if (game === 1 && index === 0) oldestInSecond = command;
                insert.run(ids[game], principal, command, hash({ noop: true }), game === 0 ? 2 : 1);
            }
        }
        db.exec('COMMIT');
        assert.equal(db.prepare('SELECT count(*) AS count FROM command_receipts').get().count, 10000);
    });
    store = f.open();
    const version = store.version(f.game.id);
    const noop = store.commitCommand(f.game.id, identity(version), () => f.game);
    assert.equal(noop.status, 'saved');
    assert.deepEqual(noop.version, version);
    assert.equal(store.commitCommand(ids[0], old, mustNotApply).status, 'stale');
    assert.equal(
        store.commitCommand(ids[1], identity(store.version(ids[1])), () => ({ ...f.game, id: ids[1] })).status,
        'saved',
    );
    f.close();
    f.sql(db => {
        assert.equal(db.prepare('SELECT count(*) AS count FROM command_receipts').get().count, 10000);
        assert.equal(
            db
                .prepare(
                    'SELECT max(total) AS total FROM (SELECT count(*) AS total FROM command_receipts GROUP BY game_id)',
                )
                .get().total,
            2000,
        );
        assert.equal(db.prepare('SELECT 1 FROM command_receipts WHERE command_id=?').get(old.id), undefined);
        assert.equal(db.prepare('SELECT 1 FROM command_receipts WHERE command_id=?').get(oldestInSecond), undefined);
    });
});

test('invalid persisted command receipts fail loading without replacing the original data', async t => {
    const f = await fixture(t);
    f.sql(db =>
        db
            .prepare(
                'INSERT INTO command_receipts(game_id, principal, command_id, payload_hash, revision) VALUES (?, ?, ?, ?, ?)',
            )
            .run(f.game.id, 'not-a-digest', randomUUID(), hash({}), 1),
    );
    const filename = path.join(f.directory, 'games.sqlite');
    const original = await readFile(filename);
    const store = new GameStore(f.directory);
    try {
        assert.throws(() => store.load());
    } finally {
        store.close();
    }
    assert.deepEqual(await readFile(filename), original);
});


test('nested command save failures notify once and a broken diagnostic observer cannot change rollback', async t => {
    const f = await fixture(t);
    f.sql(db => db.exec("CREATE TRIGGER fail_save BEFORE UPDATE ON games BEGIN SELECT RAISE(ABORT, 'PRIVATE storage detail'); END"));
    const failures = [];
    const store = f.open(error => {
        failures.push(error);
        throw new Error('observer failed');
    });
    const version = store.version(f.game.id);
    assert.throws(() => store.commitCommand(f.game.id, identity(version), () => scored(f.game, 3)), /Could not save game/);
    assert.equal(failures.length, 1);
    assert.match(failures[0].message, /PRIVATE storage detail/);
    assert.deepEqual(store.version(f.game.id), version);
    assert.deepEqual(store.load()[f.game.id], f.game);
});

test('SQLite automatic rollback retains the original write failure and its diagnostic notification', async t => {
    const f = await fixture(t);
    f.sql(db => db.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ROLLBACK, 'PRIVATE automatic rollback'); END"));
    const failures = [];
    const store = f.open(error => failures.push(error));
    const version = store.version(f.game.id);
    assert.throws(() => store.commitCommand(f.game.id, identity(version), () => scored(f.game, 3)), /Could not save game/);
    assert.equal(failures.length, 1);
    assert.match(failures[0].message, /PRIVATE automatic rollback/);
    assert.deepEqual(store.version(f.game.id), version);
    assert.deepEqual(store.load()[f.game.id], f.game);
});
