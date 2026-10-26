import assert from 'node:assert/strict';
import { _electron as electron, request as apiRequest } from '@playwright/test';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';
import { createHash } from 'node:crypto';

const [mode, executable, directory, setup] = process.argv.slice(2);
if (!['create', 'resume', 'blocked-update'].includes(mode) || !executable || !directory) throw new Error('Expected create/resume/blocked-update, installed executable, and test data directory.');
const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
const environment = { ...process.env };
delete environment.TIGHT_DATA_DIR;
delete environment.NODE_PATH;
if (process.platform === 'win32') {
    for (const name of Object.keys(environment)) if (name.toLowerCase() === 'path') delete environment[name];
    environment.PATH = [process.env.SystemRoot, path.join(process.env.SystemRoot, 'System32')].join(';');
}
async function installedFiles(directory, prefix = '') {
    const files = {};
    for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
        const relative = path.join(prefix, entry.name);
        if (entry.isDirectory()) Object.assign(files, await installedFiles(directory, relative));
        else if (entry.isFile()) files[relative] = createHash('sha256').update(await readFile(path.join(directory, relative))).digest('hex');
    }
    return files;
}
const app = await electron.launch({ executablePath: executable, args: [], cwd: path.dirname(executable), env: environment, timeout: 30000 });
let guestSocket;
try {
    const page = await app.firstWindow();
    const identity = await app.evaluate(({ app }) => ({ name: app.getName(), version: app.getVersion(), packaged: app.isPackaged, electron: process.versions.electron }));
    assert.deepEqual(identity, { name: 'TIGHT', version: manifest.version, packaged: true, electron: manifest.devDependencies.electron });
    const recordPath = path.join(directory, 'installer-save.json');
    if (mode === 'create') {
        await page.getByRole('button', { name: 'Create Game', exact: true }).waitFor();
        const response = await page.request.post(`${new URL(page.url()).origin}/api/game/create`, { data: { numPlayers: 2, numRounds: 3 } });
        assert.equal(response.status(), 200);
        const id = await response.json();
        assert.equal(typeof id, 'string');
        const origin = new URL(page.url()).origin;
        assert.equal((await page.request.post(`${origin}/api/game/rename`, { data: { gameId: id, name: 'Installer saved game 银河' } })).status(), 200);
        assert.equal((await page.request.post(`${origin}/api/game/archive`, { data: { gameId: id, archived: true } })).status(), 200);
        const invitation = await (await page.request.post(`${origin}/api/session/invite`, { data: { role: 'spectator', gameId: id } })).json();
        const guest = await apiRequest.newContext();
        let guestCookie;
        try {
            const claimed = await guest.post(`${origin}/api/session/claim`, { data: { token: invitation.token } });
            assert.equal(claimed.status(), 200);
            guestCookie = claimed.headers()['set-cookie'].split(';')[0];
        } finally { await guest.dispose(); }
        const library = (await (await page.request.get(`${origin}/api/game/list`)).json()).find(game => game.id === id);
        const snapshot = await (await page.request.get(`${new URL(page.url()).origin}/api/game/export?gameId=${id}`)).json();
        await writeFile(recordPath, JSON.stringify({ id, snapshot, library, guestCookie }));
    } else {
        const { id, snapshot, library, guestCookie } = JSON.parse(await readFile(recordPath, 'utf8'));
        await page.getByRole('checkbox', { name: 'Show archived games', exact: true }).check();
        await page.getByRole('article', { name: `Saved game ${id}`, exact: true }).waitFor();
        if (mode === 'blocked-update') {
            if (!setup) throw new Error('Expected setup executable for the running-host guard check.');
            const origin = new URL(page.url()).origin;
            guestSocket = new WebSocket(`${origin.replace('http:', 'ws:')}/socket?gameId=${id}`, { headers: { cookie: guestCookie } });
            await once(guestSocket, 'message', { signal: AbortSignal.timeout(5000) });
            const started = await page.evaluate(() => performance.timeOrigin);
            const files = await installedFiles(path.dirname(executable));
            for (const installer of [setup, path.join(path.dirname(executable), 'Uninstall TIGHT.exe')]) {
                const uninstall = installer !== setup;
                // NSIS's uninstaller launcher self-copies and exits 0 before its child finishes.
                // PowerShell -Wait waits for the entire process tree on Windows.
                const script = "$ErrorActionPreference = 'Stop'\n$p = Start-Process -FilePath $env:TIGHT_TEST_UNINSTALLER -ArgumentList '/S' -Wait -PassThru\nexit $p.ExitCode";
                const child = uninstall
                    ? spawn('pwsh.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
                        stdio: 'inherit', windowsHide: true, env: { ...process.env, TIGHT_TEST_UNINSTALLER: installer },
                    })
                    : spawn(installer, ['/S'], { stdio: 'ignore', windowsHide: true });
                try {
                    const [code] = await once(child, 'exit', { signal: AbortSignal.timeout(45000) });
                    assert.equal(code, uninstall ? 0 : 2, `${path.basename(installer)} must follow its launcher exit-code contract.`);
                } finally { if (child.exitCode === null) child.kill(); }
                assert.equal(await page.evaluate(() => performance.timeOrigin), started, 'Installer must not restart the host.');
                assert.equal(guestSocket.readyState, WebSocket.OPEN, 'A paired guest must remain connected.');
                assert.deepEqual(await installedFiles(path.dirname(executable)), files, 'Refused setup/uninstall must leave every installed file unchanged.');
            }
        }
        const restored = await (await page.request.get(`${new URL(page.url()).origin}/api/game/export?gameId=${id}`)).json();
        assert.deepEqual(restored, snapshot, 'Setup and uninstall must preserve the complete saved game.');
        const origin = new URL(page.url()).origin;
        const restoredLibrary = (await (await page.request.get(`${origin}/api/game/list`)).json()).find(game => game.id === id);
        assert.deepEqual(restoredLibrary, library, 'Setup must preserve the saved-game name, archive status and timestamp.');
        const guest = await apiRequest.newContext({ extraHTTPHeaders: { cookie: guestCookie } });
        try {
            const session = await guest.get(`${origin}/api/session`);
            assert.equal(session.status(), 200);
            assert.deepEqual(await session.json(), { role: 'spectator', gameId: id });
        } finally { await guest.dispose(); }
    }
} finally {
    guestSocket?.terminate();
    await app.evaluate(({ dialog, app }) => {
        dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
        app.quit();
    });
    await app.close();
}
