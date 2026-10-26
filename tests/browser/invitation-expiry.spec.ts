import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const role of ['player', 'spectator'] as const) {
    for (const recovery of ['timer', 'focus', 'visibility'] as const) {
        test(`${role} invitation expires visibly through ${recovery} and can be replaced`, async ({ page, browser, request, baseURL }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            try {
                // Only the native interface enumeration is simulated, so the actual QR is rendered.
                // Invitations, cookies, and permissions still use the real backend.
                await page.addInitScript(() => {
                    const hosting = { mode: 'lan', address: '192.168.1.10', port: 18743,
                        interfaces: [{ name: 'Wi-Fi', address: '192.168.1.10' }] };
                    window.tightDesktop = { getHosting: async () => hosting, setHosting: async () => hosting };
                });
                await page.goto(`/${id}/players`);
                await page.clock.install({ time: new Date() });
                await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
                const dialog = page.getByRole('dialog', { name: `Pair a device with game ${id}`, exact: true });
                if (role === 'spectator') {
                    await dialog.getByRole('combobox', { name: /^Device permission/u }).click();
                    await page.getByRole('option', { name: 'Spectator, read only', exact: true }).click();
                } else {
                    await dialog.getByRole('textbox', { name: 'Player name', exact: true }).fill('Expiry guest');
                }
                const create = dialog.getByRole('button', { name: 'Create invitation', exact: true });
                const responsePromise = page.waitForResponse('**/api/session/invite');
                await create.click();
                const response = await responsePromise;
                expect(response.ok()).toBe(true);
                const issued = z.object({ token: z.string(), expiresAt: z.number() }).parse(await response.json());
                const link = dialog.getByRole('textbox', { name: 'One-use invitation link', exact: true });
                const qr = dialog.getByRole('img');
                await expect(link).toHaveValue(`http://192.168.1.10:18743/#pair=${issued.token}`);
                await expect(qr).toBeVisible();
                if (recovery === 'timer') {
                    await page.clock.pauseAt(issued.expiresAt - 1000);
                    await expect(link).toBeVisible();
                    await page.clock.fastForward(1000);
                } else {
                    // Model a suspended renderer: wall time advances without running its timer.
                    await page.clock.setSystemTime(issued.expiresAt + 1);
                    if (recovery === 'focus') await page.evaluate(() => window.dispatchEvent(new Event('focus')));
                    else await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
                }
                await expect(dialog.getByRole('alert').filter({ hasText: 'This invitation has expired' })).toBeVisible();
                await expect(link).toHaveCount(0);
                await expect(qr).toHaveCount(0);
                expect(await dialog.innerHTML()).not.toContain(issued.token);
                await expect(create).toBeEnabled();
                // Return the simulated clock to the server's real clock for the replacement.
                await page.clock.setSystemTime(new Date());
                await page.clock.resume();
                const replacementPromise = page.waitForResponse('**/api/session/invite');
                await create.click();
                const replacement = z.object({ token: z.string() }).parse(await (await replacementPromise).json());
                expect(replacement.token).not.toBe(issued.token);
                await expect(link).toHaveValue(`http://192.168.1.10:18743/#pair=${replacement.token}`);
                await expect(qr).toBeVisible();
                await expect(dialog.getByText(/This invitation has expired/u)).toHaveCount(0);
                expect((await guest.request.post('/api/session/claim', { data: { token: replacement.token } })).ok()).toBe(true);
                expect(await (await guest.request.get('/api/session')).json()).toMatchObject({ role, gameId: id });
                expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
            } finally {
                await guest.close();
                await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}
