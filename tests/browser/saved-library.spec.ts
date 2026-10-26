import { expect, test } from '@playwright/test';

test('hosts can name, archive and restore saved games, and failed renames stay editable', async ({ page, request }, testInfo) => {
    const response = await request.post('/api/game/create', { data: { numPlayers: 2 } });
    expect(response.ok()).toBe(true);
    const id: unknown = await response.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    try {
        await page.goto('/');
        const card = page.getByRole('article', { name: `Saved game ${id}`, exact: true });
        await expect(card).toBeVisible();
        await card.getByRole('button', { name: `Rename ${id}`, exact: true }).click();
        await page.getByRole('textbox', { name: 'Game name', exact: true }).fill('Saturday 银河');
        await page.getByRole('textbox', { name: 'Game name', exact: true }).press('Enter');
        await expect(card.getByRole('heading', { name: 'Saturday 银河', exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath('saved-library.png') });
        await page.reload();
        await expect(card.getByRole('heading', { name: 'Saturday 银河', exact: true })).toBeVisible();
        await card.getByRole('button', { name: `Archive ${id}`, exact: true }).click();
        await expect(card).toHaveCount(0);
        await page.getByRole('checkbox', { name: 'Show archived games', exact: true }).check();
        await expect(card.getByText('Archived', { exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('checkbox', { name: 'Show archived games', exact: true })).not.toBeChecked();
        await expect(card).toHaveCount(0);
        await page.getByRole('checkbox', { name: 'Show archived games', exact: true }).check();
        await card.getByRole('button', { name: `Restore ${id}`, exact: true }).click();
        await expect(card.getByRole('button', { name: `Archive ${id}`, exact: true })).toBeVisible();
        await page.route('**/api/game/rename', route => route.fulfill({ status: 503, body: '{}' }));
        await card.getByRole('button', { name: `Rename ${id}`, exact: true }).click();
        await page.getByRole('textbox', { name: 'Game name', exact: true }).fill('Unsaved name');
        await page.getByRole('button', { name: 'Save name', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Rename saved game', exact: true });
        await expect(dialog.getByRole('alert')).toContainText('could not save');
        await expect(dialog.getByRole('textbox', { name: 'Game name', exact: true })).toHaveValue('Unsaved name');
        await page.unroute('**/api/game/rename');
        await dialog.getByRole('textbox', { name: 'Game name', exact: true }).fill('');
        await dialog.getByRole('button', { name: 'Save name', exact: true }).click();
        await expect(card.getByRole('heading', { name: id, exact: true })).toBeVisible();
        await page.setViewportSize({ width: 390, height: 700 });
        await expect(card.getByRole('link', { name: `Resume ${id}`, exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally {
        await request.post('/api/game/delete', { data: { id } });
    }
});
