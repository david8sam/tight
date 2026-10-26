import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { createDiagnostics, errorCode, MAX_BYTES } = require('../desktop/diagnostics.cjs');
const versions = { app: '0.0.1', electron: '45', node: '24', token: 'SECRET' };
const state = {
    backend: 'ready',
    storage: 'open',
    sharing: 'local',
    connections: 2,
    connectedPlayers: 1,
    adapters: 1,
    token: 'SECRET',
};

test('diagnostic exports contain only named event codes and approved status fields', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-diagnostics-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const diagnostics = createDiagnostics(directory);
    diagnostics.record('backend.starting');
    diagnostics.record('backend.start-failed', 'EADDRINUSE');
    diagnostics.record('SECRET player /private/path');
    diagnostics.record('backend.ready', 'SECRET');
    const report = diagnostics.exportReport(versions, state);
    assert.equal(JSON.stringify(report).includes('SECRET'), false);
    assert.equal(report.events.length, 3);
    assert.equal(report.persistentLogs, true);
    assert.equal(report.versions.backend, versions.app);
    assert.equal(report.events[1].code, 'EADDRINUSE');
    assert.equal(report.events[2].code, undefined);
    assert.deepEqual(report.host, {
        backend: 'ready',
        storage: 'open',
        sharing: 'local',
        connections: 2,
        connectedPlayers: 1,
        adapters: 1,
    });
    assert.equal(errorCode({ code: 'ENOSPC', message: 'SECRET' }), 'ENOSPC');
    assert.equal(errorCode(new Error('SECRET')), 'UNKNOWN');
    assert.equal(errorCode(new Error('private path', { cause: { code: 'ENOSPC' } })), 'ENOSPC');
    assert.equal(errorCode({ code: 'ERR_SQLITE_ERROR', errcode: 13, message: 'private path' }), 'SQLITE_FULL');
    const restarted = createDiagnostics(directory);
    assert.deepEqual(restarted.exportReport(versions, state).events, report.events);
    await writeFile(
        path.join(directory, 'desktop-events.jsonl'),
        JSON.stringify({
            at: new Date().toISOString(),
            event: 'backend.ready',
            token: 'SECRET',
            payload: 'PRIVATE GAME',
        }) + '\nnot json\n',
    );
    const sanitized = restarted.exportReport(versions, state);
    assert.equal(sanitized.events.length, 1);
    assert.equal(JSON.stringify(sanitized).includes('SECRET'), false);
    assert.equal(JSON.stringify(sanitized).includes('PRIVATE GAME'), false);
});

test('diagnostic logs rotate within three bounded files and exports retain only the latest events', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-diagnostics-bound-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const diagnostics = createDiagnostics(directory);
    for (let index = 0; index < 4500; index += 1) diagnostics.record('backend.start-failed', 'EADDRINUSE');
    const files = await readdir(directory);
    assert.equal(files.length, 3);
    for (const name of files) assert.ok((await readFile(path.join(directory, name))).length <= MAX_BYTES);
    assert.equal(diagnostics.exportReport(versions, state).events.length, 200);
});

test('unwritable diagnostic storage keeps a bounded memory report without crashing hosting', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-diagnostics-failure-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const blocked = path.join(directory, 'file');
    await writeFile(blocked, 'not a directory');
    const diagnostics = createDiagnostics(blocked);
    for (let index = 0; index < 250; index += 1) diagnostics.record('backend.ready');
    const report = diagnostics.exportReport(versions, state);
    assert.equal(report.persistentLogs, false);
    assert.equal(report.events.length, 200);
});

test('export reports unreadable persistent logs and retains current-launch events', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-diagnostics-read-failure-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const diagnostics = createDiagnostics(directory);
    diagnostics.record('backend.ready');
    const file = path.join(directory, 'desktop-events.jsonl');
    await rm(file);
    await mkdir(file);
    const report = diagnostics.exportReport(versions, state);
    assert.equal(report.persistentLogs, false);
    assert.deepEqual(report.events.map(value => value.event), ['backend.ready']);
});

test('oversized persistent logs are rejected without losing current-launch diagnostics', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-diagnostics-oversized-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const diagnostics = createDiagnostics(directory);
    diagnostics.record('backend.start-failed', 'ENOSPC');
    await writeFile(path.join(directory, 'desktop-events.jsonl'), 'x'.repeat(MAX_BYTES + 1));
    const report = diagnostics.exportReport(versions, state);
    assert.equal(report.persistentLogs, false);
    assert.deepEqual(report.events.map(value => value.code), ['ENOSPC']);
});

test('diagnostics identify a packaged build without exposing arbitrary build metadata', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-build-diagnostics-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const diagnostics = createDiagnostics(directory);
    const build = { revision: 'a'.repeat(40), modified: false, path: 'SECRET' };
    assert.deepEqual(diagnostics.exportReport({ ...versions, build }, state).versions.build, {
        revision: 'a'.repeat(40), modified: false,
    });
    const invalid = diagnostics.exportReport({ ...versions, build: { revision: 'SECRET', modified: false } }, state);
    assert.deepEqual(invalid.versions.build, { revision: null, modified: null });
    assert.equal(JSON.stringify(invalid).includes('SECRET'), false);
});
