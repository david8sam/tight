import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const mode of ['retained', 'cleared', 'reseeded', 'direct'] as const) {
    test(`saved-game navigation opens the status route with ${mode} tab hints`, async ({ page, context, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        await page.goto(`/${id}`);
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Returning host');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        if (mode === 'cleared') await page.evaluate(() => {
            sessionStorage.removeItem('gameId');
            sessionStorage.removeItem('playerId');
        });
        if (mode === 'reseeded') await context.addInitScript(({ id }) => {
            if (location.protocol !== 'http:') return;
            sessionStorage.setItem('gameId', id);
            sessionStorage.setItem('playerId', 'Returning host');
        }, { id });
        // A fresh document reproduces reopening the host with its existing profile.
        if (mode === 'direct') await page.goto(`/${id}`);
        else {
            await page.goto('/');
            await page.getByRole('link', { name: `Resume ${id}`, exact: true }).click();
        }
        if (mode === 'cleared') {
            await page.getByRole('combobox', { name: /^Select Player/u }).click();
            await page.getByRole('option', { name: 'Returning host', exact: true }).click();
            await page.getByRole('button', { name: 'Continue', exact: true }).click();
        }
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
        const saved = z.object({ game: z.object({ players: z.record(z.string(), z.unknown()) }) }).parse(await (await request.get(`/api/game/export?gameId=${id}`)).json());
        expect(Object.keys(saved.game.players)).toEqual(['Returning host']);
    });
}

test('a malformed bare game address still offers recovery without validating it as a game', async ({ page }) => {
    const validation: string[] = [];
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/game/validate') validation.push(request.url()); });
    await page.goto('/not-a-game');
    await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
    expect(validation).toEqual([]);
});
