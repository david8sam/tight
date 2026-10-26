import { expect, test } from '@playwright/test';

test('renaming a saved game retains its card during refresh and returns keyboard focus', async ({ page, request }) => {
    const response = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(response.ok()).toBe(true);
    const id: unknown = await response.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    let release = () => {};
    try {
        await page.goto('/');
        const card = page.getByRole('article', { name: `Saved game ${id}`, exact: true, includeHidden: true });
        const rename = card.getByRole('button', { name: `Rename ${id}`, exact: true, includeHidden: true });
        await expect(rename).toBeVisible();
        const opener = await rename.elementHandle();
        if (!opener) throw new Error('Expected rename opener');
        let refreshing = false;
        let gate = new Promise<void>(resolve => { release = resolve; });
        await page.route('**/api/game/list', async route => {
            refreshing = true;
            await gate;
            await route.continue();
        });
        await rename.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Rename saved game', exact: true });
        const name = dialog.getByRole('textbox', { name: 'Game name', exact: true });
        await expect(name).toBeFocused();
        await name.fill('Keyboard library game');
        await name.press('Enter');
        await expect.poll(() => refreshing).toBe(true);
        expect(await opener.evaluate(element => element.isConnected)).toBe(true);
        await expect(card).toBeVisible();
        await expect(rename).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Refresh saved games', exact: true, includeHidden: true })).toBeDisabled();
        release();
        await expect(dialog).toHaveCount(0);
        await expect(card.getByRole('heading', { name: 'Keyboard library game', exact: true })).toBeVisible();
        expect(await opener.evaluate(element => element.isConnected)).toBe(true);
        await expect(rename).toBeFocused();
        await rename.press('Enter');
        await expect(name).toHaveValue('Keyboard library game');
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(rename).toBeFocused();
        refreshing = false;
        gate = new Promise<void>(resolve => { release = resolve; });
        const refresh = page.getByRole('button', { name: 'Refresh saved games', exact: true });
        await refresh.press('Enter');
        await expect.poll(() => refreshing).toBe(true);
        await expect(refresh).toBeDisabled();
        await expect(rename).toBeDisabled();
        expect(await opener.evaluate(element => element.isConnected)).toBe(true);
        release();
        await expect(refresh).toBeEnabled();
        await expect(rename).toBeEnabled();
        expect(await opener.evaluate(element => element.isConnected)).toBe(true);
    } finally {
        release();
        await request.post('/api/game/delete', { data: { id } });
    }
});
