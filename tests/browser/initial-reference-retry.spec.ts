import { expect } from '@playwright/test';
import { test } from '../helpers/isolated-browser-host.js';

for (const outcome of ['success', 'repeated failure', 'moved focus'] as const) {
    test(`initial faction read retry preserves keyboard recovery after ${outcome}`, async ({ page }) => {
        let release!: () => void;
        const held = new Promise<void>(resolve => { release = resolve; });
        let started!: () => void;
        const pending = new Promise<void>(resolve => { started = resolve; });
        let reads = 0;
        await page.route('**/api/faction/list-names', async route => {
            const attempt = ++reads;
            if (attempt === 1) return route.fulfill({ status: 503, json: {} });
            if (attempt !== 2) return route.continue();
            const actual = await route.fetch();
            started();
            await held;
            if (outcome === 'repeated failure') await route.fulfill({ status: 503, json: {} });
            else await route.fulfill({ response: actual });
        });
        await page.goto('/factions');
        const retry = page.getByRole('button', { name: 'Retry loading information', exact: true });
        await expect(retry).toBeVisible();
        await retry.press('Enter');
        await pending;
        await expect(page.getByRole('progressbar', { name: 'Loading factions', exact: true })).toBeVisible();
        const theme = page.getByRole('button', { name: 'Switch to Dark Theme', exact: true });
        if (outcome === 'moved focus') await theme.focus();
        release();
        if (outcome === 'repeated failure') {
            await expect(retry).toBeVisible();
            await expect(retry).toBeFocused();
            await retry.press('Enter');
        }
        const selection = page.getByRole('combobox', { name: /^Faction /u });
        await expect(selection).toContainText('The Arborec');
        await expect(outcome === 'moved focus' ? theme : selection).toBeFocused();
        expect(reads).toBe(outcome === 'repeated failure' ? 3 : 2);
    });
}
