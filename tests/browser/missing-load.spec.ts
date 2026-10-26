import { expect, test } from '@playwright/test';
import { MessageType } from '../../src/common/message.js';

for (const origin of ['Home', 'another game', 'a remembered missing game'] as const) {
    const switching = origin === 'another game';
    const rememberedMissing = origin === 'a remembered missing game';
    test(`a game deleted between validation and loading from ${origin} offers recovery`, async ({ page, request }) => {
        const codes: string[] = [];
        try {
            for (let index = 0; index < (switching ? 2 : 1); index += 1) {
                const created = await request.post('/api/game/create', { data: { numPlayers: index + 1 } });
                expect(created.ok()).toBe(true);
                const code: unknown = await created.json();
                if (typeof code !== 'string') throw new Error('Expected game code');
                codes.push(code);
            }
            const target = codes[codes.length - 1];
            let saved: unknown;
            if (rememberedMissing) {
                saved = await (await request.get(`/api/game/export?gameId=${target}`)).json();
                expect((await request.post('/api/game/delete', { data: { id: target } })).ok()).toBe(true);
                await page.addInitScript(({ id, changeType }) => {
                    sessionStorage.setItem('gameId', id);
                    const NativeWebSocket = window.WebSocket;
                    window.WebSocket = class extends NativeWebSocket {
                        constructor(url: string | URL, protocols?: string | string[]) {
                            super(url, protocols);
                            // Keep the previous null snapshot by delaying the import's change broadcast.
                            this.addEventListener('message', event => {
                                if (JSON.parse(event.data).type === changeType) event.stopImmediatePropagation();
                            });
                        }
                    };
                }, { id: target, changeType: MessageType.BROADCAST_CHANGE });
            }
            if (switching) {
                await page.goto(`/${codes[0]}/players`);
                await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
                await page.getByRole('button', { name: 'Menu', exact: true }).click();
                await page.getByRole('button', { name: 'Home', exact: true }).click();
            } else await page.goto('/');
            if (rememberedMissing) {
                await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
                expect((await request.post('/api/game/import', { data: saved })).ok()).toBe(true);
                await page.getByRole('button', { name: 'Refresh saved games', exact: true }).click();
            }
            let deletedAfterValidation = false;
            await page.route('**/api/game/validate?**', async route => {
                if (new URL(route.request().url()).searchParams.get('gameId') !== target || deletedAfterValidation) {
                    await route.continue();
                    return;
                }
                const validated = await route.fetch();
                expect(await validated.json()).toBe(true);
                const deleted = await request.post('/api/game/delete', { data: { id: target } });
                expect(deleted.ok()).toBe(true);
                deletedAfterValidation = true;
                await route.fulfill({ response: validated });
            });
            await page.getByRole('link', { name: `Resume ${target}`, exact: true }).click();
            await expect.poll(() => deletedAfterValidation).toBe(true);
            await expect(page.getByRole('heading', { name: `Game ${target} was not found or is no longer available`, exact: true })).toBeVisible();
            await expect(page).toHaveURL(`/${target}/deleted`);
            expect(await page.evaluate(() => sessionStorage.getItem('gameId'))).toBeNull();
            await page.getByRole('button', { name: 'Go to Home page', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Create Game', exact: true })).toBeVisible();
            await expect(page.getByRole('link', { name: `Resume ${target}`, exact: true })).toHaveCount(0);
            if (switching) {
                await page.getByRole('link', { name: `Resume ${codes[0]}`, exact: true }).click();
                await expect(page.getByRole('textbox', { name: 'Enter Name', exact: true })).toBeVisible();
            }
        } finally {
            for (const id of codes) await request.post('/api/game/delete', { data: { id } });
        }
    });
}
