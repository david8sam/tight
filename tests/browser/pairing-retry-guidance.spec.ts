import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const role of ['player', 'spectator'] as const) {
    for (const status of [429, 503]) {
        test(`${role} pairing explains retryable HTTP ${status} without rejecting the invitation`, async ({ browser, request, baseURL }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            try {
                const expected = role === 'player' ? { role, gameId: id, playerId: 'Patient guest' } : { role, gameId: id };
                const issued = await request.post('/api/session/invite', { data: expected });
                expect(issued.ok()).toBe(true);
                const { token } = z.object({ token: z.string() }).parse(await issued.json());
                const page = await guest.newPage();
                let claims = 0;
                await page.route('**/api/session/claim', async route => {
                    claims += 1;
                    if (claims === 1) await route.fulfill({ status, headers: { 'Retry-After': '1' }, contentType: 'application/json', body: '{}' });
                    else await route.continue();
                });
                await page.goto('/#pair=' + token);
                const alert = page.getByRole('alert');
                await expect(alert).toContainText(status === 429 ? 'Too many pairing attempts' : 'The host could not complete pairing');
                await expect(alert).toContainText('try again');
                await expect(alert).not.toContainText('invalid, expired, or already used');
                expect(new URL(page.url()).hash).toBe('');
                expect(await (await guest.request.get('/api/session')).json()).toEqual({ role: 'unpaired' });
                expect(claims).toBe(1);
                await page.getByRole('button', { name: 'Try again', exact: true }).press('Enter');
                await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
                await expect(page.getByText(role === 'player' ? /^Playing as Patient guest\./u : 'Spectator, read only.')).toBeVisible();
                expect(claims).toBe(2);
                expect(await (await guest.request.get('/api/session')).json()).toEqual(expected);
                expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
                await page.reload();
                await expect(page.getByText(role === 'player' ? /^Playing as Patient guest\./u : 'Spectator, read only.')).toBeVisible();
                expect(claims).toBe(2);
            } finally {
                await guest.close();
                await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}

for (const [length, status] of [[43, 403], [129, 400]]) {
    test(`a real HTTP ${status} link rejection still asks for a replacement`, async ({ browser, baseURL }) => {
        const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        try {
            const page = await guest.newPage();
            const rejected = page.waitForResponse('**/api/session/claim');
            await page.goto('/#pair=' + 'x'.repeat(length));
            expect((await rejected).status()).toBe(status);
            await expect(page.getByRole('alert')).toContainText('invalid, expired, or already used');
            await expect(page.getByRole('alert')).toContainText('Ask the host for a new link');
            expect(await (await guest.request.get('/api/session')).json()).toEqual({ role: 'unpaired' });
        } finally {
            await guest.close();
        }
    });
}
