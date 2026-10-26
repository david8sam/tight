import { expect, test, type APIRequestContext } from '@playwright/test';
import { z } from 'zod';
import { MessageType } from '../../src/common/message.js';

async function createGame(request: APIRequestContext): Promise<string> {
    const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(created.ok()).toBe(true);
    return z.string().parse(await created.json());
}

for (const moveFocus of [false, true]) {
    test(`revoking device access ${moveFocus ? 'preserves deliberate focus' : 'focuses a stable control after removing confirmation'}`, async ({ page, browser, request, baseURL }) => {
        const id = await createGame(request);
        const guest = await browser.newContext({ baseURL });
        let release = () => {};
        try {
            const issued = await request.post('/api/session/invite', { data: { role: 'spectator', gameId: id } });
            expect(issued.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await issued.json());
            await page.goto(`/${id}/players`);
            await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
            const dialog = page.getByRole('dialog', { name: `Pair a device with game ${id}`, exact: true });
            await dialog.getByRole('button', { name: 'Disconnect paired devices', exact: true }).press('Enter');
            const submit = dialog.getByRole('button', { name: 'Revoke device access', exact: true });
            const close = dialog.getByRole('button', { name: 'Close', exact: true });
            const panel = dialog.getByRole('button', { name: 'Connected devices', exact: true });
            let attempts = 0;
            const gate = new Promise<void>(resolve => { release = resolve; });
            await page.route('**/api/session/revoke', async route => {
                attempts += 1;
                await gate;
                await route.continue();
            });
            await submit.press('Enter');
            await expect.poll(() => attempts).toBe(1);
            await expect(submit).toBeDisabled();
            await page.keyboard.press('Enter');
            expect(attempts).toBe(1);
            if (moveFocus) {
                await panel.focus();
                await expect(panel).toBeFocused();
            }
            release();
            await expect(dialog.getByRole('alert')).toContainText('All paired devices have been disconnected');
            await expect(submit).toHaveCount(0);
            await expect(moveFocus ? panel : close).toBeFocused();
            expect(attempts).toBe(1);
            expect((await guest.request.post('/api/session/claim', { data: { token } })).status()).toBe(403);
            expect(await (await request.get(`/api/game/validate?gameId=${id}`)).json()).toBe(true);
            await page.keyboard.press('Escape');
            await expect(dialog).toHaveCount(0);
        } finally {
            release();
            await guest.close();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}

for (const asNewPlayer of [false, true]) {
    for (const moveFocus of [false, true]) {
        test(`missing-game rejoin ${asNewPlayer ? 'as a new player' : 'normally'} ${moveFocus ? 'preserves deliberate focus' : 'focuses the game code after removing its button'}`, async ({ page, request }) => {
            await page.addInitScript(changeType => {
                const NativeWebSocket = window.WebSocket;
                window.WebSocket = class extends NativeWebSocket {
                    constructor(url: string | URL, protocols?: string | string[]) {
                        super(url, protocols);
                        this.addEventListener('message', event => {
                            const packet: unknown = JSON.parse(event.data);
                            if (!packet || typeof packet !== 'object' || !('type' in packet) || packet.type !== changeType || !('data' in packet)) return;
                            const data = packet.data;
                            if (!data || typeof data !== 'object' || !('game' in data)) return;
                            const game = data.game;
                            // Retain stale local state while the real validation request sees deletion.
                            if (game && typeof game === 'object' && 'deleted' in game && game.deleted) event.stopImmediatePropagation();
                        });
                    }
                };
            }, MessageType.BROADCAST_CHANGE);
            const id = await createGame(request);
            const nextId = await createGame(request);
            let release = () => {};
            try {
                await page.goto(`/${id}/players`);
                await expect(page.getByRole('combobox', { name: /^Color /u })).toHaveCount(1);
                await page.getByRole('button', { name: 'Menu', exact: true }).click();
                await page.getByRole('button', { name: 'Home', exact: true }).click();
                await page.getByRole('button', { name: 'Join Game', exact: true }).click();
                const dialog = page.getByRole('dialog', { name: 'Join game', exact: true });
                const submit = dialog.getByRole('button', { name: `Rejoin "${id}"${asNewPlayer ? ' as new player' : ''}`, exact: true });
                const code = dialog.getByRole('textbox', { name: 'Game Code', exact: true });
                const close = dialog.getByRole('button', { name: 'Close', exact: true });
                await expect(submit).toBeVisible();
                expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
                let attempts = 0;
                const gate = new Promise<void>(resolve => { release = resolve; });
                await page.route('**/api/game/validate?*', async route => {
                    if (new URL(route.request().url()).searchParams.get('gameId') !== id) {
                        await route.continue();
                        return;
                    }
                    attempts += 1;
                    const response = await route.fetch();
                    expect(await response.json()).toBe(false);
                    await gate;
                    await route.fulfill({ response });
                });
                await submit.press('Enter');
                await expect.poll(() => attempts).toBe(1);
                await expect(submit).toBeDisabled();
                await page.keyboard.press('Enter');
                expect(attempts).toBe(1);
                if (moveFocus) {
                    await close.focus();
                    await expect(close).toBeFocused();
                }
                release();
                await expect(submit).toHaveCount(0);
                await expect(moveFocus ? close : code).toBeFocused();
                expect(attempts).toBe(1);
                await expect(dialog.getByRole('alert')).toContainText(`Game ${id} is no longer available`);
                if (moveFocus) await code.focus();
                const unavailableCode = ['AAAA', 'AAAB', 'AAAC'].find(candidate => candidate !== id && candidate !== nextId);
                if (!unavailableCode) throw new Error('Expected a different unavailable code');
                expect(await (await request.get(`/api/game/validate?gameId=${unavailableCode}`)).json()).toBe(false);
                await page.keyboard.type(unavailableCode);
                await page.keyboard.press('Tab');
                const join = dialog.getByRole('button', { name: 'Join', exact: true });
                await expect(join).toBeFocused();
                await page.keyboard.press('Enter');
                await expect(dialog.getByText('Invalid Game Code', { exact: true })).toBeVisible();
                await expect(join).toBeFocused();
                await expect(submit).toHaveCount(0);
                await page.keyboard.press('Shift+Tab');
                await expect(code).toBeFocused();
                await page.keyboard.press('ControlOrMeta+A');
                await page.keyboard.type(nextId);
                await page.keyboard.press('Tab');
                await expect(dialog.getByRole('button', { name: 'Join', exact: true })).toBeFocused();
                await page.keyboard.press('Enter');
                await expect(dialog).toHaveCount(0);
                await expect(page.getByRole('textbox', { name: 'Enter Name', exact: true })).toBeVisible();
                await expect(page).toHaveURL(new RegExp(`/${nextId}(?:/status)?$`));
            } finally {
                release();
                for (const gameId of [id, nextId]) await request.post('/api/game/delete', { data: { id: gameId } });
            }
        });
    }
}
