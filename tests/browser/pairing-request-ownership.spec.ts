import { expect, errors } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const role of ['player', 'spectator'] as const) {
    for (const proof of ['busy feedback', 'duplicate activation'] as const) {
        test(`${role} pairing retry owns one request with ${proof}`, async ({ browser, request, baseURL }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            let release = () => {};
            try {
                const expected = role === 'player' ? { role, gameId: id, playerId: 'Persistent guest' } : { role, gameId: id };
                const issued = await request.post('/api/session/invite', { data: expected });
                expect(issued.ok()).toBe(true);
                const { token } = z.object({ token: z.string() }).parse(await issued.json());
                const page = await guest.newPage();
                const gate = new Promise<void>(resolve => { release = resolve; });
                let claims = 0;
                await page.route('**/api/session/claim', async route => {
                    const claim = ++claims;
                    if (claim === 2) await gate;
                    if (claim <= 2) await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                    else await route.continue();
                });
                await page.goto('/#pair=' + token);
                await expect(page.getByRole('alert')).toContainText('The host could not complete pairing');
                const retry = page.getByRole('button', { name: 'Try again', exact: true });
                await retry.press('Enter');
                await expect.poll(() => claims).toBe(2);
                if (proof === 'busy feedback') {
                    await expect(retry).toBeDisabled();
                    await expect(retry).toHaveAttribute('aria-busy', 'true');
                    await expect(page.getByRole('status')).toContainText('Checking this device');
                }
                const duplicate = page.waitForRequest('**/api/session/claim', { timeout: 500 }).then(() => true, error => {
                    if (error instanceof errors.TimeoutError) return false;
                    throw error;
                });
                await page.keyboard.press('Enter');
                await page.keyboard.press('Space');
                expect(await duplicate).toBe(false);
                expect(claims).toBe(2);
                await expect(retry).toBeFocused();
                release();
                await expect(retry).toBeEnabled();
                await expect(retry).toBeFocused();
                await expect(page.getByRole('status')).toHaveCount(0);
                await retry.press('Enter');
                await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
                await expect(page.getByText(role === 'player' ? /^Playing as Persistent guest\./u : 'Spectator, read only.')).toBeVisible();
                expect(claims).toBe(3);
                expect(await (await guest.request.get('/api/session')).json()).toEqual(expected);
                expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
            } finally {
                release();
                await guest.close();
                await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}

for (const proof of ['pending check', 'failed check focus'] as const) {
    test(`an unpaired device recovers from a ${proof}`, async ({ browser, baseURL }) => {
        const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        let release = () => {};
        try {
            const page = await guest.newPage();
            await page.goto('/');
            const check = page.getByRole('button', { name: 'Check pairing', exact: true });
            await expect(check).toBeVisible();
            const gate = new Promise<void>(resolve => { release = resolve; });
            let reads = 0;
            await page.route('**/api/session', async route => {
                reads += 1;
                if (proof === 'pending check') await gate;
                await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
            });
            await check.press('Enter');
            await expect.poll(() => reads).toBe(1);
            if (proof === 'pending check') {
                await expect(check).toBeVisible();
                await expect(check).toBeDisabled();
                await expect(check).toBeFocused();
                await expect(page.getByRole('status')).toContainText('Checking this device');
                await page.keyboard.press('Enter');
                await page.keyboard.press('Space');
                expect(reads).toBe(1);
                release();
            }
            await expect(page.getByRole('alert')).toContainText('Could not check this device');
            await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeFocused();
            expect(reads).toBe(1);
            expect(await (await guest.request.get('/api/session')).json()).toEqual({ role: 'unpaired' });
            await page.unroute('**/api/session');
            await page.getByRole('button', { name: 'Try again', exact: true }).press('Enter');
            await expect(check).toBeVisible();
            await expect(check).toBeEnabled();
            await expect(check).toBeFocused();
        } finally {
            release();
            await guest.close();
        }
    });
}
