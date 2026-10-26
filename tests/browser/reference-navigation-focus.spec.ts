import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const direction of ['next', 'previous'] as const) {
    for (const outcome of ['success', 'failure', 'moved focus'] as const) {
        test(`${direction} faction navigation preserves keyboard recovery after ${outcome}`, async ({ page, request }) => {
            const response = await request.get('/api/faction/list-names');
            expect(response.ok()).toBe(true);
            const names = z.array(z.string()).min(3).parse(await response.json());
            const index = direction === 'next' ? 1 : names.length - 1;
            const following = direction === 'next' ? 2 : names.length - 2;
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
            await expect(page.getByRole('combobox', { name: /^Faction /u })).toContainText(names[0]);
            await page.getByRole('button', { name: names[index], exact: true }).press('Enter');
            await pending;
            await expect(page.getByRole('progressbar', { name: 'Loading factions', exact: true })).toBeVisible();
            const theme = page.getByRole('button', { name: 'Switch to Dark Theme', exact: true });
            if (outcome === 'moved focus') await theme.focus();
            release();
            const next = page.getByRole('button', { name: names[following], exact: true });
            if (outcome === 'failure') {
                const retry = page.getByRole('button', { name: 'Retry loading information', exact: true });
                await expect(retry).toBeVisible();
                await expect(retry).toBeFocused();
                await retry.press('Enter');
            }
            await expect(page.getByRole('combobox', { name: /^Faction /u })).toContainText(names[index]);
            await expect(outcome === 'moved focus' ? theme : next).toBeFocused();
            if (outcome !== 'moved focus') {
                await next.press('Enter');
                await expect(page.getByRole('combobox', { name: /^Faction /u })).toContainText(names[following]);
            }
        });
    }
}
