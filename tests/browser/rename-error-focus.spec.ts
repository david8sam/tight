import { expect, test } from '@playwright/test';
import { savedGameListSchema } from '../../src/common/savedGames.js';

for (const submitFrom of ['input', 'button'] as const) {
    test(`a failed rename submitted from the ${submitFrom} permits keyboard correction without duplicate pending writes`, async ({ page, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        let release = () => {};
        try {
            await page.goto('/');
            const card = page.getByRole('article', { name: `Saved game ${id}`, exact: true });
            const rename = card.getByRole('button', { name: `Rename ${id}`, exact: true });
            await rename.press('Enter');
            const dialog = page.getByRole('dialog', { name: 'Rename saved game', exact: true });
            const name = dialog.getByRole('textbox', { name: 'Game name', exact: true });
            await expect(name).toBeFocused();
            await name.fill('First name');
            let attempts = 0;
            const gate = new Promise<void>(resolve => { release = resolve; });
            await page.route('**/api/game/rename', async route => {
                attempts += 1;
                if (attempts === 1) {
                    await gate;
                    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                } else await route.continue();
            });
            if (submitFrom === 'button') {
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await expect(dialog.getByRole('button', { name: 'Save name', exact: true })).toBeFocused();
            }
            await page.keyboard.press('Enter');
            await expect.poll(() => attempts).toBe(1);
            if (submitFrom === 'input') await expect(name).toBeFocused();
            await expect(dialog.getByRole('button', { name: 'Save name', exact: true })).toBeDisabled();
            await page.keyboard.type('Ignored while pending');
            await expect(name).toHaveValue('First name');
            await page.keyboard.press('Enter');
            expect(attempts).toBe(1);
            release();
            await expect(dialog.getByRole('alert')).toContainText('could not save');
            await expect(name).toBeEditable();
            await expect(name).toBeFocused();
            expect(attempts).toBe(1);
            await page.keyboard.press('ControlOrMeta+A');
            await page.keyboard.type('Corrected game name');
            await page.keyboard.press('Enter');
            await expect(dialog).toHaveCount(0);
            await expect(card.getByRole('heading', { name: 'Corrected game name', exact: true })).toBeVisible();
            await expect(rename).toBeFocused();
            expect(attempts).toBe(2);
            const games = savedGameListSchema.parse(await (await request.get('/api/game/list')).json());
            expect(games.find(game => game.id === id)).toMatchObject({ name: 'Corrected game name' });
        } finally {
            release();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
