import { expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { PNG } from 'pngjs';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

const require = createRequire(import.meta.url);

for (const role of ['player', 'spectator'] as const) {
    for (const change of ['adapter', 'stop', 'unavailable adapter'] as const) {
        test(`a pending ${role} invitation uses the current address after ${change}`, async ({ page, browser, request, baseURL }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            let release = () => {};
            try {
                // Native adapter enumeration is the controlled boundary. The server issues real invitations.
                await page.addInitScript(() => {
                    const hosting = { mode: 'lan', address: '192.168.1.10', port: 18743,
                        interfaces: [{ name: 'Wi-Fi', address: '192.168.1.10' }] };
                    window.tightDesktop = { getHosting: async () => hosting, setHosting: async () => hosting };
                });
                await page.goto(`/${id}/players`);
                await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
                const dialog = page.getByRole('dialog', { name: `Pair a device with game ${id}`, exact: true });
                if (role === 'spectator') {
                    await dialog.getByRole('combobox', { name: /^Device permission/u }).click();
                    await page.getByRole('option', { name: 'Spectator, read only', exact: true }).click();
                } else {
                    await dialog.getByRole('textbox', { name: 'Player name', exact: true }).fill('Network guest');
                }
                const create = dialog.getByRole('button', { name: 'Create invitation', exact: true });
                const link = dialog.getByRole('textbox', { name: 'One-use invitation link', exact: true });
                await create.click();
                await expect(link).toHaveValue(/^http:\/\/192\.168\.1\.10:18743\/#pair=/u);
                await expect(dialog.getByRole('img')).toBeVisible();

                const gate = new Promise<void>(resolve => { release = resolve; });
                let issuedToken = '';
                await page.route('**/api/session/invite', async route => {
                    const response = await route.fetch();
                    expect(response.ok()).toBe(true);
                    issuedToken = z.object({ token: z.string() }).parse(await response.json()).token;
                    await gate;
                    await route.fulfill({ response });
                });
                await create.click();
                await expect.poll(() => issuedToken.length).toBe(43);
                await expect(create).toBeDisabled();
                await page.evaluate(next => {
                    const api = window.tightDesktop;
                    if (!api) throw new Error('Missing native test bridge');
                    api.getHosting = async () => next;
                    window.dispatchEvent(new Event('focus'));
                }, change === 'adapter'
                    ? { mode: 'lan', address: '192.168.1.20', port: 18743,
                        interfaces: [{ name: 'Ethernet', address: '192.168.1.20' }] }
                    : change === 'stop' ? { mode: 'local', port: 18743, interfaces: [] }
                    : { mode: 'lan', address: '192.168.1.10', port: 18743, interfaces: [] });
                // Clearing the previous link proves the new native state committed before the old response.
                await expect(link).toHaveCount(0);
                await expect(dialog.getByRole('img')).toHaveCount(0);
                release();
                const currentOrigin = change === 'adapter' ? 'http://192.168.1.20:18743' : baseURL;
                const currentLink = `${currentOrigin}/#pair=${issuedToken}`;
                await expect(link).toHaveValue(currentLink);
                if (change === 'adapter') {
                    const qr = dialog.getByRole('img');
                    await expect(qr).toBeVisible();
                    const picture = PNG.sync.read(await qr.screenshot());
                    const reader: unknown = require('jsqr');
                    if (typeof reader !== 'function') throw new Error('Missing QR decoder');
                    const decoded: unknown = reader(new Uint8ClampedArray(picture.data), picture.width, picture.height);
                    expect(z.object({ data: z.string() }).parse(decoded).data).toBe(currentLink);
                }
                else {
                    await expect(dialog.getByRole('img')).toHaveCount(0);
                    await expect(dialog.getByText('This link works only on this PC. Turn on Wi-Fi sharing to invite phones.')).toBeVisible();
                    if (change === 'unavailable adapter') {
                        await expect(dialog.getByText('Choose a current network in Wi-Fi sharing before creating an invitation.')).toBeVisible();
                        await expect(create).toBeDisabled();
                    }
                }
                expect(await dialog.innerHTML()).not.toContain('192.168.1.10');
                expect((await guest.request.post('/api/session/claim', { data: { token: issuedToken } })).ok()).toBe(true);
                expect(await (await guest.request.get('/api/session')).json()).toMatchObject({ role, gameId: id });
                expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
            } finally {
                release();
                await guest.close();
                await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}
