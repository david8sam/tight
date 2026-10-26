import { expect, test } from '@playwright/test';
import { z } from 'zod';

for (const key of ['Enter', 'Space']) {
    test(`canceling device disconnection with ${key} restores keyboard focus without revoking access`, async ({ page, browser, request, baseURL }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        const guest = await browser.newContext({ baseURL });
        let revocations = 0;
        page.on('request', outgoing => {
            if (new URL(outgoing.url()).pathname === '/api/session/revoke') revocations += 1;
        });
        try {
            const issued = await request.post('/api/session/invite', { data: { role: 'spectator', gameId: id } });
            expect(issued.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await issued.json());
            await page.goto(`/${id}/players`);
            await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
            const dialog = page.getByRole('dialog', { name: `Pair a device with game ${id}`, exact: true });
            const disconnect = dialog.getByRole('button', { name: 'Disconnect paired devices', exact: true });
            const keep = dialog.getByRole('button', { name: 'Keep devices connected', exact: true });
            for (let cycle = 0; cycle < 2; cycle += 1) {
                await disconnect.press(key);
                await expect(keep).toBeVisible();
                await keep.press(key);
                await expect(keep).toHaveCount(0);
                await expect(disconnect).toBeFocused();
            }
            await page.keyboard.press('Tab');
            await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(dialog).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'Pair a device', exact: true })).toBeFocused();
            expect(revocations).toBe(0);
            expect((await guest.request.post('/api/session/claim', { data: { token } })).ok()).toBe(true);
            expect(await (await request.get(`/api/game/validate?gameId=${id}`)).json()).toBe(true);
        } finally {
            await guest.close();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
