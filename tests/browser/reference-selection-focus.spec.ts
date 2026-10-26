import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const control of ['selection', 'random'] as const) {
    for (const outcome of ['success', 'failure', 'moved focus'] as const) {
        test(`faction ${control} preserves keyboard recovery after ${outcome}`, async ({ page, context, request }) => {
            const response = await request.get('/api/faction/list-names');
            expect(response.ok()).toBe(true);
            const names = z.array(z.string()).min(3).parse(await response.json());
            // Choose another real reference entry without testing random distribution.
            if (control === 'random') await context.addInitScript(value => { Math.random = () => value; }, 1 / (names.length - 1));
            let release!: () => void;
            const held = new Promise<void>(resolve => { release = resolve; });
            let started!: () => void;
            const pending = new Promise<void>(resolve => { started = resolve; });
            let reads = 0;
            await page.route('**/api/faction/get-faction?*', async route => {
                if (++reads !== 2) return route.continue();
                const actual = await route.fetch();
                started();
                await held;
                if (outcome === 'failure') await route.fulfill({ status: 503, json: {} });
                else await route.fulfill({ response: actual });
            });
            await page.goto('/factions');
            const selection = page.getByRole('combobox', { name: /^Faction /u });
            const random = page.getByRole('button', { name: 'Randomize', exact: true });
            await expect(selection).toContainText(names[0]);
            if (control === 'selection') {
                await selection.press('Enter');
                await page.getByRole('option', { name: names[1], exact: true }).press('Enter');
            } else await random.press('Enter');
            await pending;
            await expect(page.getByRole('progressbar', { name: 'Loading factions', exact: true })).toBeVisible();
            const theme = page.getByRole('button', { name: 'Switch to Dark Theme', exact: true });
            if (outcome === 'moved focus') await theme.focus();
            release();
            if (outcome === 'failure') {
                const retry = page.getByRole('button', { name: 'Retry loading information', exact: true });
                await expect(retry).toBeVisible();
                await expect(retry).toBeFocused();
                await retry.press('Enter');
            }
            await expect(selection).toContainText(names[1]);
            await expect(outcome === 'moved focus' ? theme : control === 'selection' ? selection : random).toBeFocused();
        });
    }
}
