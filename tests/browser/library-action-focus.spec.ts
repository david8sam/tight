import { expect, test } from '@playwright/test';

for (const action of ['refresh', 'archive', 'delete', 'refresh after moving focus'] as const) {
    test(`library ${action} leaves keyboard focus in a useful place`, async ({ page, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        let release = () => {};
        try {
            await page.goto('/');
            const card = page.getByRole('article', { name: `Saved game ${id}`, exact: true });
            await expect(card).toBeVisible();
            let waiting = false;
            const gate = new Promise<void>(resolve => { release = resolve; });
            await page.route('**/api/game/list', async route => {
                waiting = true;
                await gate;
                await route.continue();
            });
            const refresh = page.getByRole('button', { name: 'Refresh saved games', exact: true });
            if (action === 'archive') await card.getByRole('button', { name: `Archive ${id}`, exact: true }).press('Enter');
            else if (action === 'delete') {
                await card.getByRole('button', { name: `Delete ${id}`, exact: true }).press('Enter');
                await page.getByRole('dialog').getByRole('button', { name: 'Delete saved game', exact: true }).press('Enter');
            } else await refresh.press('Enter');
            await expect.poll(() => waiting).toBe(true);
            if (action === 'refresh after moving focus') {
                await page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }).press('Enter');
            }
            release();
            await expect(refresh).toBeEnabled();
            if (action === 'archive' || action === 'delete') {
                await expect(card).toHaveCount(0);
                await expect(page.getByRole('dialog')).toHaveCount(0);
                await expect(page.getByRole('heading', { name: 'Saved games', exact: true })).toBeFocused();
            } else if (action === 'refresh') await expect(refresh).toBeFocused();
            else await expect(page.getByRole('button', { name: 'Switch to Light Theme', exact: true })).toBeFocused();
        } finally {
            release();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
