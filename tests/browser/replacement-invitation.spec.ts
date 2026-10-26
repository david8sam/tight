import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { sessionSchema } from '../../src/common/session.js';
import { test as isolatedTest } from '../helpers/isolated-browser-host.js';

for (const role of ['player', 'spectator']) {
    test(`a replacement ${role} invitation works in the same failed-pairing tab`, async ({ browser, request, baseURL }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        try {
            const page = await guest.newPage();
            await page.goto('/#pair=' + 'x'.repeat(43));
            await expect(page.getByRole('alert')).toContainText('invalid, expired, or already used');
            await expect(page).toHaveURL(baseURL + '/');
            await page.evaluate(() => { document.documentElement.dataset.sameDocument = 'replacement-invitation'; });
            await page.goto('/#help');
            expect(await page.evaluate(() => document.documentElement.dataset.sameDocument)).toBe('replacement-invitation');
            await expect(page.getByRole('alert')).toContainText('invalid, expired, or already used');
            const issued = await request.post('/api/session/invite', {
                data: role === 'player' ? { role, gameId: id, playerId: 'Replacement phone' } : { role, gameId: id },
            });
            expect(issued.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await issued.json());
            await page.goto('/#pair=' + token);
            await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
            expect(await page.evaluate(() => document.documentElement.dataset.sameDocument)).toBeUndefined();
            await expect(page.getByText(role === 'player' ? /^Playing as Replacement phone\./u : 'Spectator, read only.')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Pair a device', exact: true })).toHaveCount(0);
            const session = sessionSchema.parse(await (await guest.request.get('/api/session')).json());
            expect(session).toEqual(role === 'player' ? { role, gameId: id, playerId: 'Replacement phone' } : { role, gameId: id });
            expect((await guest.request.post('/api/game/create', { data: {} })).status()).toBe(403);
            await page.reload();
            await expect(page.getByText(role === 'player' ? /^Playing as Replacement phone\./u : 'Spectator, read only.')).toBeVisible();
        } finally {
            await guest.close();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}

for (const initial of ['unpaired', 'another game']) {
    test(`an invitation replaces ${initial} state in an existing tab`, async ({ browser, request, baseURL }) => {
        const first = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        const second = await request.post('/api/game/create', { data: { numPlayers: 2 } });
        expect(first.ok() && second.ok()).toBe(true);
        const oldId = z.string().parse(await first.json());
        const id = z.string().parse(await second.json());
        const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        try {
            const page = await guest.newPage();
            if (initial === 'another game') {
                const issued = await request.post('/api/session/invite', { data: { role: 'spectator', gameId: oldId } });
                expect(issued.ok()).toBe(true);
                const { token } = z.object({ token: z.string() }).parse(await issued.json());
                await page.goto('/#pair=' + token);
                await expect(page.getByText('Spectator, read only.')).toBeVisible();
                await expect(page.getByRole('table', { name: 'Faction assignments', exact: true }).getByRole('row')).toHaveCount(1);
            } else {
                await page.goto('/');
                await expect(page.getByRole('heading', { name: 'Pair this device with TIGHT', exact: true })).toBeVisible();
            }
            await page.evaluate(() => { document.documentElement.dataset.previousSession = 'must-reset'; });
            const issued = await request.post('/api/session/invite', { data: { role: 'player', gameId: id, playerId: 'New phone' } });
            expect(issued.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await issued.json());
            const invitation = new URL(page.url());
            invitation.hash = 'pair=' + token;
            await page.goto(invitation.href);
            await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
            await expect(page.getByText(/^Playing as New phone\./u)).toBeVisible();
            await expect(page.getByText('Spectator, read only.')).toHaveCount(0);
            await expect(page.getByRole('table', { name: 'Faction assignments', exact: true }).getByRole('row')).toHaveCount(2);
            expect(await page.evaluate(() => document.documentElement.dataset.previousSession)).toBeUndefined();
            expect(sessionSchema.parse(await (await guest.request.get('/api/session')).json())).toEqual({
                role: 'player', gameId: id, playerId: 'New phone',
            });
            expect((await guest.request.post('/api/game/create', { data: {} })).status()).toBe(403);
            await page.reload();
            await expect(page.getByText(/^Playing as New phone\./u)).toBeVisible();
            await expect(page.getByRole('table', { name: 'Faction assignments', exact: true }).getByRole('row')).toHaveCount(2);
        } finally {
            await guest.close();
            for (const gameId of [oldId, id]) await request.post('/api/game/delete', { data: { id: gameId } });
        }
    });
}

isolatedTest('repeated paired-page reloads reuse fingerprinted scripts without asset throttling', async ({ browser, request, baseURL }) => {
    const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(created.ok()).toBe(true);
    const id = z.string().parse(await created.json());
    const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
        const issued = await request.post('/api/session/invite', { data: { role: 'spectator', gameId: id } });
        expect(issued.ok()).toBe(true);
        const { token } = z.object({ token: z.string() }).parse(await issued.json());
        const page = await guest.newPage();
        const errors: string[] = [];
        const throttled: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
            if (response.status() === 429 && !new URL(response.url()).pathname.startsWith('/api/')) {
                throttled.push(new URL(response.url()).pathname);
            }
        });
        await page.goto('/#pair=' + token);
        const rows = page.getByRole('table', { name: 'Faction assignments', exact: true }).getByRole('row');
        await expect(rows).toHaveCount(1);
        const scripts = await page.evaluate(() => performance.getEntriesByType('resource')
            .filter(entry => entry instanceof PerformanceResourceTiming && entry.initiatorType === 'script')
            .map(entry => new URL(entry.name).pathname));
        expect(scripts.length).toBeGreaterThan(0);
        expect(scripts.every(script => /\.[a-f0-9]{20}(?:\.chunk)?\.js$/.test(script))).toBe(true);
        const bundle = scripts.find(script => script.includes('/bundle.'));
        if (!bundle) throw new Error('Expected the production entry script');
        const asset = await guest.request.get(bundle);
        expect(asset.ok()).toBe(true);
        expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
        await asset.dispose();
        const html = await guest.request.get('/');
        expect(html.headers()['cache-control']).not.toContain('immutable');
        await html.dispose();
        for (let reload = 0; reload < 10; reload += 1) {
            await page.reload();
            await expect(page.getByText('Spectator, read only.')).toBeVisible();
            await expect(rows).toHaveCount(1);
        }
        const cachedScripts = await page.evaluate(() => performance.getEntriesByType('resource')
            .filter(entry => entry instanceof PerformanceResourceTiming && entry.initiatorType === 'script' && entry.transferSize === 0).length);
        expect(cachedScripts).toBeGreaterThan(0);
        expect(throttled).toEqual([]);
        expect(errors).toEqual([]);
        expect(sessionSchema.parse(await (await guest.request.get('/api/session')).json())).toEqual({ role: 'spectator', gameId: id });
    } finally {
        await guest.close();
        await request.post('/api/game/delete', { data: { id } });
    }
});
