import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { hostingSchema } from '../../src/common/hosting.js';
import { PNG } from 'pngjs';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');

function executable(): string {
    const value: unknown = process.env.TIGHT_DESKTOP_EXECUTABLE || require('electron');
    if (typeof value !== 'string') throw new Error('Expected Electron executable path');
    return value;
}
function launchArguments(): string[] {
    return [
        ...(process.env.TIGHT_ELECTRON_TEST_NO_SANDBOX === 'true' ? ['--no-sandbox'] : []),
        ...(process.env.TIGHT_DESKTOP_EXECUTABLE ? [] : [root]),
    ];
}
async function launch(directory: string) {
    return electron.launch({
        executablePath: executable(),
        args: launchArguments(),
        cwd: directory,
        env: { ...process.env, TIGHT_DATA_DIR: directory },
    });
}
async function quit(app: ElectronApplication) {
    await app.evaluate(async ({ dialog, app }) => {
        dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
        app.quit();
    });
    await app.close();
}

test('desktop owns a loopback backend, isolates the renderer, saves games, and stops cleanly', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight desktop 测试-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const origin = new URL(page.url());
        expect(origin.hostname).toBe('127.0.0.1');
        expect(Number(origin.port)).toBeGreaterThan(1024);
        const renderers = await app.evaluate(({ app }) => app.getAppMetrics().filter(metric => metric.type === 'Tab'));
        expect(renderers.length).toBeGreaterThan(0);
        if (process.platform === 'win32') expect(renderers.every(metric => metric.sandboxed)).toBe(true);
        expect(await page.evaluate(() => typeof Reflect.get(window, 'require'))).toBe('undefined');
        expect(await page.evaluate(() => document.cookie)).not.toContain('tight-session');
        const hostCookie = (await page.context().cookies()).find(cookie => cookie.name === 'tight-session');
        expect(hostCookie?.httpOnly).toBe(true);
        expect(hostCookie?.sameSite).toBe('Strict');
        const second = spawn(executable(), launchArguments(), {
            cwd: directory,
            env: { ...process.env, TIGHT_DATA_DIR: directory },
            stdio: 'ignore',
        });
        try {
            expect((await once(second, 'exit', { signal: AbortSignal.timeout(10000) }))[0]).toBe(0);
        } finally {
            if (second.exitCode === null) second.kill('SIGKILL');
        }
        await app.evaluate(({ BrowserWindow }) => {
            Reflect.set(globalThis, 'navigationPrevented', false);
            BrowserWindow.getAllWindows()[0].webContents.once('will-navigate', event =>
                Reflect.set(globalThis, 'navigationPrevented', event.defaultPrevented),
            );
        });
        await page.evaluate(() => {
            window.location.href = 'https://example.com/';
        });
        await expect.poll(() => app?.evaluate(() => Reflect.get(globalThis, 'navigationPrevented'))).toBe(true);
        expect(new URL(page.url()).origin).toBe(origin.origin);
        // Reset Playwright's pending navigation after Electron cancels it.
        await page.goto(origin.origin);
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const response = await page.request.post(`${origin.origin}/api/game/create`, { data: { numPlayers: 2 } });
        expect(response.ok()).toBe(true);
        const id: unknown = await response.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        await page.getByRole('button', { name: 'Refresh saved games', exact: true }).click();
        await expect(page.getByRole('article', { name: `Saved game ${id}`, exact: true })).toBeVisible();
        // Native dialogs are the only mocked boundary; the backend and windows are real.
        await app.evaluate(({ dialog }) => {
            dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false });
        });
        await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        await quit(app);
        app = undefined;
        await expect(async () => {
            await expect(fetch(origin.origin, { signal: AbortSignal.timeout(1000) })).rejects.toThrow();
        }).toPass();
        app = await launch(directory);
        const resumed = await app.firstWindow();
        await expect(resumed.getByRole('article', { name: `Saved game ${id}`, exact: true })).toBeVisible();
        await app.evaluate(({ dialog }) => {
            dialog.showMessageBox = async () => ({ response: 0, checkboxChecked: false });
        });
        const backendPid = await app.evaluate(
            ({ app }) => app.getAppMetrics().find(metric => metric.name === 'TIGHT game server')?.pid,
        );
        if (!backendPid) throw new Error('Missing backend utility process');
        const recoveredWindow = app.waitForEvent('window');
        process.kill(backendPid, 'SIGKILL');
        const recovered = await recoveredWindow;
        await expect(recovered.getByRole('article', { name: `Saved game ${id}`, exact: true })).toBeVisible();
        const nextPid = await app.evaluate(
            ({ app }) => app.getAppMetrics().find(metric => metric.name === 'TIGHT game server')?.pid,
        );
        expect(nextPid).not.toBe(backendPid);
        await recovered.getByRole('link', { name: `Resume ${id}`, exact: true }).click();
        await expect(recovered.getByRole('textbox', { name: 'Enter Name', exact: true })).toBeVisible();
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});

test('desktop shares on a selected adapter, generates usable QR invitations, and keeps the host local', async ({}, testInfo) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight sharing 测试-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const localOrigin = new URL(page.url()).origin;
        expect(await page.evaluate(() => Object.keys(window.tightDesktop || {}).sort())).toEqual([
            'getHosting',
            'setHosting',
        ]);
        const hosting = hostingSchema.parse(
            await page.evaluate(async () => {
                if (!window.tightDesktop) throw new Error('Missing desktop hosting bridge');
                return window.tightDesktop.getHosting();
            }),
        );
        expect(hosting.mode).toBe('local');
        const adapter = hosting.interfaces[0];
        test.skip(!adapter, 'No private IPv4 adapter in this execution environment');
        await page.getByRole('button', { name: 'Wi-Fi sharing', exact: true }).click();
        await page.getByRole('combobox', { name: 'Wi-Fi or Ethernet network', exact: true }).click();
        await page.getByRole('option', { name: `${adapter.name} (${adapter.address})`, exact: true }).click();
        await page.getByRole('button', { name: 'Start sharing on this network', exact: true }).click();
        const address = `http://${adapter.address}:${hosting.port}`;
        await expect(page.getByRole('textbox', { name: 'Lobby address', exact: true })).toHaveValue(address);
        expect(new URL(page.url()).origin).toBe(localOrigin);
        async function decode(label: string) {
            const qr = page.getByRole('img', { name: label, exact: true });
            await expect(qr).toBeVisible();
            await expect
                .poll(() =>
                    qr.evaluate(element => {
                        const code = element.getBoundingClientRect();
                        const container = element.parentElement?.getBoundingClientRect();
                        if (!container) throw new Error('Missing QR container');
                        return Math.abs(code.x + code.width / 2 - container.x - container.width / 2);
                    }),
                )
                .toBeLessThan(1);
            const picture = PNG.sync.read(await qr.screenshot());
            const reader: unknown = require('jsqr');
            if (typeof reader !== 'function') throw new Error('Missing QR decoder');
            const decoded: unknown = reader(new Uint8ClampedArray(picture.data), picture.width, picture.height);
            if (typeof decoded !== 'object' || !decoded || !('data' in decoded) || typeof decoded.data !== 'string')
                throw new Error('Rendered QR code could not be decoded');
            return decoded.data;
        }
        expect(await decode('Wi-Fi lobby QR code')).toBe(`${address}/`);
        await page.screenshot({ path: testInfo.outputPath('sharing.png') });
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        const created = await page.request.post(`${localOrigin}/api/game/create`, { data: { numPlayers: 1 } });
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Missing game code');
        await page.goto(`${localOrigin}/${id}`);
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Desktop host');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        await page.getByRole('textbox', { name: 'Player name', exact: true }).fill('QR player');
        await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
        const invitation = await decode('Player invitation QR code');
        await page.screenshot({ path: testInfo.outputPath('invitation.png') });
        expect(new URL(invitation).origin).toBe(address);
        const hostCookie = (await page.context().cookies()).find(cookie => cookie.name === 'tight-session');
        expect(hostCookie).toBeDefined();
        expect(invitation).not.toContain(hostCookie?.value || 'missing-host-cookie');
        const token = new URLSearchParams(new URL(invitation).hash.slice(1)).get('pair');
        const claim = await fetch(`${address}/api/session/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        expect(claim.status).toBe(200);
        expect((await claim.json()).playerId).toBe('QR player');
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await page.getByRole('button', { name: 'Wi-Fi sharing', exact: true }).click();
        await page.getByRole('button', { name: 'Stop Wi-Fi sharing', exact: true }).click();
        await expect(page.getByText('Local only. Other devices cannot connect yet.', { exact: true })).toBeVisible();
        await expect(fetch(address, { signal: AbortSignal.timeout(1000) })).rejects.toThrow();
        expect((await page.request.get(`${localOrigin}/api/game/export?gameId=${id}`)).ok()).toBe(true);
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await page.context().clearCookies();
        const denied = await page.evaluate(async () => {
            try {
                await window.tightDesktop?.getHosting();
                return false;
            } catch {
                return true;
            }
        });
        expect(denied, 'the preload bridge must require the current host cookie').toBe(true);
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});

test('desktop resumes approved sharing and generates fresh invitations after a game or app restart', async ({}, testInfo) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight resume sharing 测试-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        let page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const first = hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting()));
        const adapter = first.interfaces[0];
        test.skip(!adapter, 'No private IPv4 adapter in this execution environment');
        await page.evaluate(address => window.tightDesktop?.setHosting(address), adapter.address);
        const created = await page.request.post(`${new URL(page.url()).origin}/api/game/create`, {
            data: { numPlayers: 1 },
        });
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Missing game code');
        await page.goto(`${new URL(page.url()).origin}/${id}`);
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Restart host');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        const invite = async (name: string) => {
            await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
            await page.getByRole('textbox', { name: 'Player name', exact: true }).fill(name);
            await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
            const qr = page.getByRole('img', { name: 'Player invitation QR code', exact: true });
            await expect(qr).toBeVisible();
            const picture = PNG.sync.read(await qr.screenshot());
            const reader: unknown = require('jsqr');
            if (typeof reader !== 'function') throw new Error('Missing QR decoder');
            const decoded: unknown = reader(new Uint8ClampedArray(picture.data), picture.width, picture.height);
            if (typeof decoded !== 'object' || !decoded || !('data' in decoded) || typeof decoded.data !== 'string')
                throw new Error('Rendered QR could not be decoded');
            const link = decoded.data;
            await page.screenshot({ path: testInfo.outputPath(`invitation-${name.replaceAll(' ', '-')}.png`) });
            await page.getByRole('button', { name: 'Close', exact: true }).click();
            return link;
        };
        const firstInvitation = await invite('Before restart');
        const restart = await page.request.post(`${new URL(page.url()).origin}/api/game/restart`, { data: { id } });
        expect(restart.ok()).toBe(true);
        const restartedInvitation = await invite('After game restart');
        expect(restartedInvitation).not.toBe(firstInvitation);
        await quit(app);
        app = await launch(directory);
        page = await app.firstWindow();
        await expect(page.getByRole('article', { name: `Saved game ${id}`, exact: true })).toBeVisible();
        const restored = hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting()));
        expect(restored.mode).toBe('lan');
        if (restored.mode !== 'lan') throw new Error('Sharing was not restored');
        expect(restored.address).toBe(adapter.address);
        await page.getByRole('link', { name: `Resume ${id}`, exact: true }).click();
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Restart host');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        const currentInvitation = await invite('After app restart');
        expect(currentInvitation).not.toBe(restartedInvitation);
        expect(new URL(currentInvitation).hostname).toBe(adapter.address);
        expect(new URL(currentInvitation).port).toBe(String(restored.port));
        const hostCookie = (await page.context().cookies()).find(cookie => cookie.name === 'tight-session');
        expect(currentInvitation).not.toContain(hostCookie?.value || 'missing-host');
        const token = new URLSearchParams(new URL(currentInvitation).hash.slice(1)).get('pair');
        const claim = await fetch(`${new URL(currentInvitation).origin}/api/session/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        expect(claim.status).toBe(200);
        expect((await claim.json()).playerId).toBe('After app restart');
        const reused = await fetch(`${new URL(currentInvitation).origin}/api/session/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        expect(reused.status).toBe(403);
        const staleToken = new URLSearchParams(new URL(restartedInvitation).hash.slice(1)).get('pair');
        const expired = await fetch(`${new URL(currentInvitation).origin}/api/session/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: staleToken }),
        });
        expect(expired.status).toBe(403);
        await page.screenshot({ path: testInfo.outputPath('restored-sharing.png') });
        await page.evaluate(() => window.tightDesktop?.setHosting(null));
        await quit(app);
        app = await launch(directory);
        page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        expect(hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting())).mode).toBe('local');
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});

test('an unavailable remembered adapter stays local and explains how to recover sharing', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight unavailable sharing 测试-'));
    let app: ElectronApplication | undefined;
    try {
        const profile = path.join(directory, 'desktop-profile');
        await mkdir(profile, { recursive: true });
        await writeFile(
            path.join(profile, 'sharing.json'),
            JSON.stringify({
                version: 1,
                adapter: { name: 'Removed Wi-Fi adapter', address: '192.168.123.123' },
            }),
        );
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const hosting = hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting()));
        expect(hosting.mode).toBe('local');
        expect(hosting.restoreError).toBe('unavailable');
        await page.getByRole('button', { name: 'Wi-Fi sharing', exact: true }).click();
        await expect(page.getByRole('alert')).toContainText('Your previously shared network is no longer available');
        await expect(page.getByRole('combobox', { name: 'Wi-Fi or Ethernet network', exact: true })).toBeEnabled();
        await expect(page.getByRole('img', { name: 'Wi-Fi lobby QR code', exact: true })).not.toBeVisible();
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});

test('native diagnostics export excludes private data and sleep restores the selected sharing network', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight diagnostics-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const hosting = hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting()));
        const adapter = hosting.interfaces[0];
        if (adapter) {
            await page.evaluate(address => window.tightDesktop?.setHosting(address), adapter.address);
            await app.evaluate(({ powerMonitor }) => powerMonitor.emit('suspend'));
            await expect
                .poll(
                    async () => hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting())).mode,
                )
                .toBe('local');
            await app.evaluate(({ powerMonitor }) => powerMonitor.emit('resume'));
            await expect
                .poll(
                    async () => hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting())).mode,
                )
                .toBe('lan');
        }
        const expectedBuild = process.env.TIGHT_DESKTOP_EXECUTABLE
            ? { revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), modified: false }
            : { revision: null, modified: null };
        const exported = path.join(directory, 'support.json');
        await app.evaluate(({ dialog }, filename) => {
            dialog.showSaveDialog = async () => ({ canceled: false, filePath: filename });
        }, exported);
        await app.evaluate(({ Menu }) => {
            const help = Menu.getApplicationMenu()?.items.find(item => item.label === 'Help');
            const command = help?.submenu?.items.find(item => item.label === 'Export diagnostics...');
            if (!command) throw new Error('Missing diagnostic export command');
            command.click();
        });
        const { readFile } = await import('node:fs/promises');
        await expect(async () => {
            const report: unknown = JSON.parse(await readFile(exported, 'utf8'));
            expect(report).toMatchObject({
                format: 1,
                versions: { build: expectedBuild },
                host: { backend: 'ready', storage: 'open', connections: 1, connectedPlayers: 0 },
            });
        }).toPass();
        const report = await readFile(exported, 'utf8');
        const cookie = (await page.context().cookies()).find(value => value.name === 'tight-session');
        expect(cookie?.value).toBeDefined();
        expect(report).not.toContain(cookie?.value || 'missing-host-cookie');
        expect(report).not.toContain(directory);
        expect(report).not.toContain(new URL(page.url()).hostname);
        expect(report).toContain('backend.ready');
        if (adapter) expect(report).toContain('app.resumed');
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});

test('ending the operating-system session stops hosting without a confirmation dialog', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight session-end-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const adapter = hostingSchema.parse(await page.evaluate(() => window.tightDesktop?.getHosting())).interfaces[0];
        if (adapter) await page.evaluate(address => window.tightDesktop?.setHosting(address), adapter.address);
        const origin = new URL(page.url()).origin;
        const created = await page.request.post(`${origin}/api/game/create`, { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Missing saved game code');
        const closed = app.waitForEvent('close');
        await app.evaluate(({ BrowserWindow, dialog }) => {
            dialog.showMessageBox = async () => {
                throw new Error('Shutdown must not wait for a confirmation');
            };
            BrowserWindow.getAllWindows()[0].emit('session-end');
        });
        await closed;
        app = undefined;
        await expect(fetch(origin, { signal: AbortSignal.timeout(1000) })).rejects.toThrow();
        app = await launch(directory);
        const resumed = await app.firstWindow();
        await expect(resumed.getByRole('article', { name: `Saved game ${id}`, exact: true })).toBeVisible();
        if (adapter) expect(hostingSchema.parse(await resumed.evaluate(() => window.tightDesktop?.getHosting())).mode).toBe('lan');
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});


test('a runtime save failure reaches the native diagnostic export without private error details', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight write failure-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        await expect((await app.firstWindow()).getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        await quit(app);
        app = undefined;
        const db = new DatabaseSync(path.join(directory, 'games.sqlite'));
        try {
            db.exec("CREATE TRIGGER fail_save BEFORE INSERT ON games BEGIN SELECT RAISE(ABORT, 'PRIVATE SQL detail player secret /private/path'); END");
        } finally {
            db.close();
        }
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const origin = new URL(page.url()).origin;
        const response = await page.request.post(`${origin}/api/game/create`, { data: {} });
        expect(response.status()).toBe(503);
        const exported = path.join(directory, 'write-failure.json');
        await app.evaluate(({ dialog }, filename) => {
            dialog.showSaveDialog = async () => ({ canceled: false, filePath: filename });
        }, exported);
        await app.evaluate(({ Menu }) => {
            const command = Menu.getApplicationMenu()?.items.find(item => item.label === 'Help')?.submenu?.items
                .find(item => item.label === 'Export diagnostics...');
            if (!command) throw new Error('Missing diagnostic export command');
            command.click();
        });
        const { readFile } = await import('node:fs/promises');
        await expect(async () => {
            const report: unknown = JSON.parse(await readFile(exported, 'utf8'));
            expect(report).toMatchObject({ events: expect.arrayContaining([
                expect.objectContaining({ event: 'storage.write-failed', code: 'ERR_SQLITE_ERROR' }),
            ]) });
        }).toPass();
        const report = await readFile(exported, 'utf8');
        expect(report).not.toContain('PRIVATE SQL detail');
        expect(report).not.toContain('/private/path');
        expect(report).not.toContain(directory);
        const cookie = (await page.context().cookies()).find(value => value.name === 'tight-session');
        expect(cookie?.value).toBeDefined();
        expect(report).not.toContain(cookie?.value || 'missing-host-cookie');
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});

test('named and archived games remain available after the desktop is reopened', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight library-'));
    let app: ElectronApplication | undefined;
    try {
        app = await launch(directory);
        const page = await app.firstWindow();
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const origin = new URL(page.url()).origin;
        const created = await page.request.post(`${origin}/api/game/create`, { data: { numPlayers: 2 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        expect((await page.request.post(`${origin}/api/game/rename`, { data: { gameId: id, name: 'Saturday 银河' } })).ok()).toBe(true);
        expect((await page.request.post(`${origin}/api/game/archive`, { data: { gameId: id, archived: true } })).ok()).toBe(true);
        await quit(app);
        app = undefined;
        app = await launch(directory);
        const reopened = await app.firstWindow();
        await expect(reopened.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        const card = reopened.getByRole('article', { name: `Saved game ${id}`, exact: true });
        await expect(card).toHaveCount(0);
        await reopened.getByRole('checkbox', { name: 'Show archived games', exact: true }).check();
        await expect(card.getByRole('heading', { name: 'Saturday 银河', exact: true })).toBeVisible();
        await card.getByRole('button', { name: `Restore ${id}`, exact: true }).click();
        await reopened.getByRole('checkbox', { name: 'Show archived games', exact: true }).uncheck();
        await expect(card.getByRole('link', { name: `Resume ${id}`, exact: true })).toBeVisible();
    } finally {
        if (app) await quit(app);
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
});
