import { expect, test, Page } from '@playwright/test';
import { MessageType } from '../../src/common/message.js';

async function instrument(page: Page) {
    await page.addInitScript(({ loadType, initializeType }) => {
        const NativeWebSocket = window.WebSocket;
        Reflect.set(window, 'connectionAttempts', 0);
        Reflect.set(window, 'snapshotsReceived', 0);
        Reflect.set(window, 'snapshotLoads', 0);
        window.WebSocket = class extends NativeWebSocket {
            constructor(url: string | URL, protocols?: string | string[]) {
                super(url, protocols);
                const number = Number(Reflect.get(window, 'connectionAttempts')) + 1;
                Reflect.set(window, 'connectionAttempts', number);
                Reflect.set(window, 'testGameSocket', this);
                // Instrument the native application socket, without a forwarding proxy.
                const send = this.send.bind(this);
                this.send = data => {
                    if (typeof data === 'string') {
                        const frame: unknown = JSON.parse(data);
                        if (frame && typeof frame === 'object' && 'type' in frame && frame.type === loadType) {
                            if (Reflect.get(window, 'throwSnapshot')) {
                                Reflect.set(window, 'throwSnapshot', false);
                                throw new DOMException('Simulated foreground send failure', 'InvalidStateError');
                            }
                            if (number === 1 && Reflect.get(window, 'blackhole')) {
                                Reflect.set(window, 'snapshotLoads', Reflect.get(window, 'snapshotLoads') + 1);
                                return;
                            }
                        }
                    }
                    send(data);
                };
                const close = this.close.bind(this);
                this.close = (code, reason) => {
                    if (Reflect.get(window, 'holdNextClose')) {
                        Reflect.set(window, 'holdNextClose', false);
                        Reflect.set(window, 'heldClose', true);
                        return;
                    }
                    close(code, reason);
                };
                this.addEventListener('message', event => {
                    if (Reflect.get(window, 'dropAllSnapshots') || (number === 1 && Reflect.get(window, 'blackhole'))) {
                        event.stopImmediatePropagation();
                        return;
                    }
                    if (JSON.parse(event.data).type === initializeType) {
                        Reflect.set(window, 'snapshotsReceived', Reflect.get(window, 'snapshotsReceived') + 1);
                    }
                });
            }
        };
    }, { loadType: MessageType.GAME_LOAD, initializeType: MessageType.BROADCAST_INITIALIZE });
}

test('open connections without an initial snapshot exhaust bounded recovery instead of resetting it', async ({ page }) => {
    await instrument(page);
    await page.addInitScript(() => Reflect.set(window, 'dropAllSnapshots', true));
    await page.clock.install();
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'testGameSocket')?.readyState)).toBe(1);
    await expect(page.getByRole('progressbar', { name: 'Connecting', exact: true })).toBeVisible();
    for (let attempt = 1; attempt <= 5; attempt += 1) {
        await page.clock.fastForward(10001);
        if (attempt < 5) {
            await page.clock.fastForward(3000 * 2 ** (attempt - 1));
            await expect.poll(() => page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(attempt + 1);
            await expect.poll(() => page.evaluate(() => Reflect.get(window, 'testGameSocket')?.readyState)).toBe(1);
        }
    }
    await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).toBeVisible();
    await page.clock.fastForward(60000);
    expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(5);
    await page.evaluate(() => Reflect.set(window, 'dropAllSnapshots', false));
    await page.getByRole('button', { name: 'Reconnect', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Connecting', exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(6);
});

async function visibility(page: Page, state: 'visible' | 'hidden') {
    await page.evaluate(value => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
        document.dispatchEvent(new Event('visibilitychange'));
    }, state);
}

for (const problem of ['lost snapshot', 'send exception']) {
    test(`foreground ${problem} recovers a fresh game without reloading or throwing`, async ({ page, request }) => {
        await instrument(page);
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        const helper = await page.context().newPage();
        try {
            await page.goto(`/${id}/players`);
            const faction = page.getByRole('combobox', { name: /^Faction /u }).first();
            await expect(faction).toContainText('None');
            await page.clock.install();
            if (problem === 'lost snapshot') await page.evaluate(() => Reflect.set(window, 'blackhole', true));
            await visibility(page, 'hidden');
            await helper.goto(`/${id}`);
            await helper.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Resume helper');
            await helper.getByRole('button', { name: 'Continue', exact: true }).click();
            await helper.getByRole('combobox', { name: /^Faction /u }).first().click();
            await helper.getByRole('option', { name: 'The Arborec', exact: true }).click();
            await expect(helper.getByRole('combobox', { name: /^Faction /u }).first()).toContainText('The Arborec');
            if (problem === 'lost snapshot') await expect(faction).toContainText('None');
            else await expect(faction).toContainText('The Arborec');
            if (problem === 'send exception') await page.evaluate(() => Reflect.set(window, 'throwSnapshot', true));
            else await page.evaluate(() => Reflect.set(window, 'holdNextClose', true));
            await visibility(page, 'visible');
            if (problem === 'send exception') expect(await page.evaluate(() => Reflect.get(window, 'throwSnapshot'))).toBe(false);
            expect(errors).toEqual([]);
            if (problem === 'lost snapshot') {
                expect(await page.evaluate(() => Reflect.get(window, 'snapshotLoads'))).toBe(1);
                await page.clock.fastForward(5000);
                await visibility(page, 'hidden');
                await visibility(page, 'visible');
                expect(await page.evaluate(() => Reflect.get(window, 'snapshotLoads'))).toBe(1);
                await page.clock.fastForward(5001);
            }
            await page.clock.fastForward(3001);
            await expect.poll(() => page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(2);
            await expect(faction).toContainText('The Arborec');
            if (problem === 'lost snapshot') expect(await page.evaluate(() => Reflect.get(window, 'heldClose'))).toBe(true);
            await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).not.toBeVisible();
            expect(errors).toEqual([]);
        } finally {
            await helper.close();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}

test('a successful foreground snapshot cancels its recovery deadline', async ({ page, request }) => {
    await instrument(page);
    const created = await request.post('/api/game/create', { data: {} });
    expect(created.ok()).toBe(true);
    const id: unknown = await created.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    try {
        await page.goto(`/${id}/players`);
        await expect(page.getByRole('combobox', { name: /^Faction /u }).first()).toBeVisible();
        await page.clock.install();
        const before: number = await page.evaluate(() => Reflect.get(window, 'snapshotsReceived'));
        // A foreground refresh uses the existing socket; no new connection is needed.
        await visibility(page, 'hidden');
        await visibility(page, 'visible');
        await expect.poll(() => page.evaluate(() => Reflect.get(window, 'snapshotsReceived'))).toBeGreaterThan(before);
        await expect(page.getByRole('progressbar', { name: 'Connecting', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).not.toBeVisible();
        await page.clock.fastForward(30000);
        expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(1);
    } finally {
        await request.post('/api/game/delete', { data: { id } });
    }
});

for (const code of [1008, 1011]) {
    test(`foreground visibility cannot bypass explicit recovery after close ${code}`, async ({ page }) => {
        await instrument(page);
        let close = async () => {};
        await page.routeWebSocket('**/socket**', route => {
            route.connectToServer();
            close = () => route.close({ code, reason: 'Explicit recovery required' });
        });
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        await page.clock.install();
        await close();
        await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).toBeVisible();
        await visibility(page, 'hidden');
        await visibility(page, 'visible');
        await page.clock.fastForward(60000);
        expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(1);
        await page.getByRole('button', { name: 'Reconnect', exact: true }).click();
        await expect.poll(() => page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(2);
        await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).not.toBeVisible();
    });
}
