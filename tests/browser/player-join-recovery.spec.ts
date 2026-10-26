import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { MessageType } from '../../src/common/message.js';

for (const scenario of ['pending edits', 'timeout focus', 'deliberate focus']) {
    test(`player join protects ${scenario} while its real update is delayed`, async ({ page, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        let holding = true;
        let armed = false;
        let attempts = 0;
        let release = () => {};
        const updates: string[] = [];
        await page.routeWebSocket('**/socket**', route => {
            const server = route.connectToServer();
            release = () => {
                holding = false;
                for (const update of updates.splice(0)) route.send(update);
            };
            route.onMessage(message => {
                const packet = z.object({ type: z.number() }).passthrough().parse(JSON.parse(message.toString()));
                if (packet.type === MessageType.COMMAND_BATCH) {
                    attempts += 1;
                    armed = true;
                }
                server.send(message);
            });
            server.onMessage(message => {
                const encoded = message.toString();
                const packet = z.object({ type: z.number() }).passthrough().parse(JSON.parse(encoded));
                if (holding && armed && (packet.type === MessageType.BROADCAST_CHANGE || packet.type === MessageType.BROADCAST_INITIALIZE)) updates.push(encoded);
                else route.send(message);
            });
        });
        try {
            await page.goto(`/${id}`);
            const dialog = page.getByRole('dialog', { name: 'Player', exact: true });
            const name = dialog.getByRole('textbox', { name: 'Enter Name', exact: true });
            const select = dialog.getByRole('combobox', { name: /^Select Player(?: |$)/u });
            const submit = dialog.getByRole('button', { name: /^(Continue|Joining game)$/u });
            const close = dialog.getByRole('button', { name: 'Close', exact: true });
            await name.fill('Original host');
            await page.clock.install();
            await submit.press('Enter');
            await expect.poll(() => updates.length).toBeGreaterThan(0);
            expect(attempts).toBe(1);
            if (scenario === 'pending edits') {
                await expect(name).toHaveAttribute('readonly', '');
                await expect(select).toBeDisabled();
                await expect(submit).toHaveAccessibleName('Continue');
                await name.focus();
                await page.keyboard.type(' changed');
                await expect(name).toHaveValue('Original host');
                await submit.focus();
            }
            await page.keyboard.press('Enter');
            await page.keyboard.press('Space');
            expect(attempts).toBe(1);
            if (scenario === 'deliberate focus') await close.focus();
            await page.clock.fastForward(15001);
            await expect(dialog.getByRole('alert')).toContainText('Could not confirm your player joined');
            await expect(scenario === 'deliberate focus' ? close : submit).toBeFocused();
            await expect(name).toBeEditable();
            await expect(select).toBeEnabled();
            release();
            await expect(dialog).toHaveCount(0);
            await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
            expect(attempts).toBe(1);
            const exported: unknown = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            const saved = z.object({ game: z.object({ players: z.record(z.string(), z.unknown()) }) }).parse(exported);
            expect(Object.keys(saved.game.players)).toEqual(['Original host']);
            await page.reload();
            await expect(page.getByRole('dialog', { name: 'Player', exact: true })).toHaveCount(0);
            await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        } finally {
            release();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
