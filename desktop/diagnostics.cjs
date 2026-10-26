const fs = require('node:fs');
const path = require('node:path');
const { parseBuildIdentity } = require('./build-identity.cjs');

const EVENTS = new Set([
    'app.started',
    'app.quit-requested',
    'app.shutdown',
    'app.suspended',
    'app.resumed',
    'backend.starting',
    'backend.ready',
    'backend.start-failed',
    'backend.stopped',
    'backend.crashed',
    'backend.stop-timeout',
    'storage.write-failed',
    'sharing.enabled',
    'sharing.disabled',
    'sharing.failed',
    'sharing.resume-failed',
    'diagnostics.exported',
]);
const ERROR_CODES = new Set([
    'EACCES',
    'EPERM',
    'ENOSPC',
    'EROFS',
    'EADDRINUSE',
    'EADDRNOTAVAIL',
    'SQLITE_BUSY',
    'SQLITE_FULL',
    'SQLITE_CANTOPEN',
    'SQLITE_CORRUPT',
    'SQLITE_READONLY',
    'ERR_SQLITE_ERROR',
]);
const MAX_BYTES = 64 * 1024;
const MAX_RECORDS = 200;

function errorCode(error) {
    const sqlite = {
        5: 'SQLITE_BUSY',
        8: 'SQLITE_READONLY',
        11: 'SQLITE_CORRUPT',
        13: 'SQLITE_FULL',
        14: 'SQLITE_CANTOPEN',
    };
    let current = error;
    for (let depth = 0; current && depth < 3; depth += 1, current = current.cause) {
        if (sqlite[current.errcode]) return sqlite[current.errcode];
        if (ERROR_CODES.has(current.code)) return current.code;
    }
    return 'UNKNOWN';
}
function safeRecord(record) {
    if (!record || !EVENTS.has(record.event) || !Number.isFinite(Date.parse(record.at))) return null;
    return {
        at: new Date(record.at).toISOString(),
        event: record.event,
        ...(record.code && (ERROR_CODES.has(record.code) || record.code === 'UNKNOWN') ? { code: record.code } : {}),
    };
}
function createDiagnostics(directory) {
    const file = path.join(directory, 'desktop-events.jsonl');
    let persistent = true;
    const recent = [];
    function record(event, code) {
        const value = safeRecord({ at: new Date().toISOString(), event, code });
        if (!value) return;
        recent.push(value);
        if (recent.length > MAX_RECORDS) recent.shift();
        try {
            fs.mkdirSync(directory, { recursive: true });
            const line = JSON.stringify(value) + '\n';
            if (fs.existsSync(file) && fs.statSync(file).size + Buffer.byteLength(line) > MAX_BYTES) {
                fs.rmSync(file + '.2', { force: true });
                if (fs.existsSync(file + '.1')) fs.renameSync(file + '.1', file + '.2');
                fs.renameSync(file, file + '.1');
            }
            fs.appendFileSync(file, line, { mode: 0o600 });
        } catch {
            persistent = false;
        }
    }
    function exportReport(versions, state) {
        const history = [];
        for (const suffix of ['.2', '.1', '']) {
            try {
                const status = fs.statSync(file + suffix);
                if (!status.isFile() || status.size > MAX_BYTES) {
                    persistent = false;
                    continue;
                }
                const bytes = fs.readFileSync(file + suffix);
                for (const line of bytes.toString('utf8').split('\n')) {
                    try {
                        const value = safeRecord(JSON.parse(line));
                        if (value) history.push(value);
                    } catch {}
                }
            } catch (error) {
                if (error.code !== 'ENOENT') persistent = false;
            }
        }
        return {
            format: 1,
            exportedAt: new Date().toISOString(),
            versions: {
                app: versions.app,
                build: parseBuildIdentity(versions.build),
                backend: versions.app,
                electron: versions.electron,
                node: versions.node,
                platform: process.platform,
                arch: process.arch,
            },
            host: {
                backend: state.backend,
                storage: state.storage,
                sharing: state.sharing,
                connectedPlayers: state.connectedPlayers,
                connections: state.connections,
                adapters: state.adapters,
            },
            persistentLogs: persistent,
            events: (persistent ? history : recent).slice(-MAX_RECORDS),
        };
    }
    return { record, exportReport };
}
module.exports = { createDiagnostics, errorCode, MAX_BYTES };
