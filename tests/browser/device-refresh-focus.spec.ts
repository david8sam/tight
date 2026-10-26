import { expect, test } from '@playwright/test';
import { z } from 'zod';

for (const fail of [false, true]) {
    for (const moveFocus of [false, true]) {
        test(`connected-device ${fail ? 'failed' : 'successful'} refresh ${moveFocus ? 'preserves another focused control' : 'retains keyboard focus for another attempt'}`, async ({ page, request }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            let release = () => {};
            try {
                await page.goto(`/${id}/players`);
                await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
                const dialog = page.getByRole('dialog', { name: `Pair a device with game ${id}`, exact: true });
                const panel = dialog.getByRole('button', { name: 'Connected devices', exact: true });
                await panel.press('Enter');
                await expect(dialog.getByText('No paired players are connected.', { exact: true })).toBeVisible();
                await page.clock.install();
                await page.clock.pauseAt(new Date(Date.now() + 1000));
                let attempts = 0;
                const gate = new Promise<void>(resolve => { release = resolve; });
                await page.route('**/api/session/connections?*', async route => {
                    attempts += 1;
                    if (attempts === 1) {
                        await gate;
                        if (fail) {
                            await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                            return;
                        }
                    }
                    await route.continue();
                });
                const refresh = dialog.getByRole('button', { name: 'Refresh connected devices', exact: true });
                const close = dialog.getByRole('button', { name: 'Close', exact: true });
                await refresh.press('Enter');
                await expect.poll(() => attempts).toBe(1);
                await expect(refresh).toBeDisabled();
                await page.keyboard.press('Enter');
                await page.keyboard.press('Space');
                expect(attempts).toBe(1);
                if (moveFocus) await close.focus();
                release();
                const retry = dialog.getByRole('button', { name: fail ? 'Retry connected devices' : 'Refresh connected devices', exact: true });
                await expect(retry).toBeEnabled();
                if (fail) await expect(dialog.getByRole('alert')).toContainText('Could not load connected devices');
                await expect(moveFocus ? close : retry).toBeFocused();
                if (moveFocus) await retry.focus();
                await page.keyboard.press('Enter');
                await expect.poll(() => attempts).toBe(2);
                await expect(dialog.getByText('No paired players are connected.', { exact: true })).toBeVisible();
                await expect(refresh).toBeFocused();
                await expect(dialog.getByRole('alert')).toHaveCount(0);
                await page.keyboard.press('Shift+Tab');
                await expect(panel).toBeFocused();
                await page.keyboard.press('Enter');
                await page.clock.fastForward(15000);
                expect(attempts).toBe(2);
            } finally {
                release();
                await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}
