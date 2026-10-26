import { expect, test, Page } from '@playwright/test';
import { MessageType } from '../../src/common/message.js';

interface CommandFrame {
    type: MessageType;
    id: string;
    baseVersion: { incarnation: string; revision: number };
    data: { gameId: string; commands: { type: MessageType; data: unknown }[] };
}

async function openSetup(page: Page, id: string) {
    await page.goto(`/${id}`);
    await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Retry host');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('combobox', { name: /^Faction /u }).first()).toBeEnabled();
    await expect(page.getByRole('status')).toHaveText('Saved');
}

for (const droppedReplies of [1, 3]) {
    test(`${droppedReplies === 1 ? 'lost acknowledgment retries automatically' : 'exhausted acknowledgments require checking the last change'} without applying twice`, async ({ page, request }, testInfo) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        let armed = false;
        let dropped = 0;
        const sent: string[] = [];
        const results: { id: string; status: string; version: { revision: number } }[] = [];
        await page.routeWebSocket('**/socket**', route => {
            const server = route.connectToServer();
            route.onMessage(message => {
                const encoded = message.toString();
                const frame: CommandFrame = JSON.parse(encoded);
                if (armed && frame.type === MessageType.COMMAND_BATCH) sent.push(encoded);
                server.send(message);
            });
            server.onMessage(message => {
                const packet = JSON.parse(message.toString());
                if (armed && packet.type === MessageType.COMMAND_RESULT) {
                    results.push(packet.data);
                    if (dropped < droppedReplies) {
                        dropped += 1;
                        return;
                    }
                }
                route.send(message);
            });
        });
        try {
            await openSetup(page, id);
            await page.clock.install();
            armed = true;
            await page.getByRole('combobox', { name: /^Faction /u }).first().click();
            await page.getByRole('option', { name: 'The Arborec', exact: true }).click();
            await expect.poll(() => results.length).toBe(1);
            await expect(page.getByRole('status')).toHaveText('Saving…');
            await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeDisabled();
            for (let attempt = 1; attempt <= droppedReplies; attempt += 1) {
                await page.clock.fastForward(10001);
                if (attempt < 3) await expect.poll(() => results.length).toBe(attempt + 1);
            }
            if (droppedReplies === 3) {
                await expect(page.getByRole('status')).toHaveText('Unconfirmed');
                await expect(page.getByRole('alert')).toContainText('Could not confirm your last change');
                await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeDisabled();
                await page.screenshot({ path: testInfo.outputPath('unconfirmed.png') });
                await page.getByRole('button', { name: 'Check last change', exact: true }).click();
            }
            await expect(page.getByRole('status')).toHaveText('Saved');
            await expect(page.getByRole('combobox', { name: /^Faction /u }).first()).toBeEnabled();
            await expect(page.getByRole('alert')).not.toBeVisible();
            expect(sent).toHaveLength(droppedReplies + 1);
            expect(new Set(sent).size).toBe(1);
            const frame: CommandFrame = JSON.parse(sent[0]);
            expect(results[0].status).toBe('saved');
            expect(results.slice(1).every(result => result.status === 'duplicate')).toBe(true);
            expect(results.every(result => result.id === frame.id)).toBe(true);
            expect(results.every(result => result.version.revision === frame.baseVersion.revision + 1)).toBe(true);
            const exported = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            expect(exported.game.factions[0].name).toBe('The Arborec');
            await page.screenshot({ path: testInfo.outputPath('confirmed.png') });
        } finally {
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
