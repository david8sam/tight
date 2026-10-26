import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const fault of ['game code', 'reserved name', 'overlong name', 'healthy'] as const) {
    test(`a host can reopen its saved game with ${fault} tab hints`, async ({ page, context, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        await page.goto(`/${id}`);
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Saved host');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        await context.addInitScript(({ id, fault }) => {
            if (location.protocol !== 'http:') return;
            sessionStorage.setItem('gameId', fault === 'game code' ? '../not-a-game' : id);
            sessionStorage.setItem('playerId', fault === 'reserved name' ? 'constructor' : fault === 'overlong name' ? 'X'.repeat(81) : 'Saved host');
        }, { id, fault });
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
        expect((await (await request.get('/api/session')).json()).role).toBe('host');
        await page.goto(`/${id}/status`);
        if (fault !== 'healthy') {
            await page.getByRole('combobox', { name: /^Select Player/u }).click();
            await page.getByRole('option', { name: 'Saved host', exact: true }).click();
            await page.getByRole('button', { name: 'Continue', exact: true }).click();
        }
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        const saved = z.object({ game: z.object({ players: z.record(z.string(), z.unknown()) }) }).parse(await (await request.get(`/api/game/export?gameId=${id}`)).json());
        expect(Object.keys(saved.game.players)).toEqual(['Saved host']);
    });
}
