import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const outcome of ['success', 'retry', 'invalid', 'button'] as const) {
    test(`Joining supports ${outcome} submission without duplicate validation`, async ({ page, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        await page.goto('/');
        await page.getByRole('button', { name: 'Join Game', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Join game', exact: true });
        const input = dialog.getByRole('textbox', { name: 'Game Code', exact: true });
        const submit = dialog.getByRole('button', { name: 'Join', exact: true });
        let attempts = 0;
        let release = () => {};
        const gate = new Promise<void>(resolve => { release = resolve; });
        await page.route('**/api/game/validate?*', async route => {
            attempts += 1;
            if (attempts === 1) {
                await gate;
                if (outcome === 'retry') {
                    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                    return;
                }
            }
            await route.continue();
        });
        try {
            if (outcome === 'invalid') {
                await input.fill('AB');
                await expect(submit).toBeDisabled();
                await input.press('Enter');
                await expect(dialog).toBeVisible();
                expect(attempts).toBe(0);
            }
            await input.fill(id.toLowerCase());
            await expect(input).toHaveValue(id);
            if (outcome === 'button') await submit.click();
            else await input.press('Enter');
            await expect.poll(() => attempts).toBe(1);
            await expect(submit).toBeDisabled();
            await input.press('Enter');
            release();
            if (outcome === 'retry') {
                await expect(dialog.getByText('Could not reach the host. Try again.', { exact: true })).toBeVisible();
                await expect(input).toBeFocused();
                await expect(input).toHaveValue(id);
                expect(attempts).toBe(1);
                await input.press('Enter');
            }
            await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
            await expect(page.getByRole('textbox', { name: 'Enter Name', exact: true })).toBeVisible();
            // GameWrapper independently validates the game after navigation.
            await expect.poll(() => attempts).toBe(outcome === 'retry' ? 3 : 2);
        } finally {
            release();
        }
    });
}
