import { expect, type BrowserContext } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

type Fault = 'getter' | 'read' | 'write' | 'remove';
async function denyHints(context: BrowserContext, fault: Fault) {
    await context.addInitScript(fault => {
        if (fault === 'getter') {
            Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Tab storage denied', 'SecurityError'); } });
            return;
        }
        if (fault === 'remove') sessionStorage.setItem('playerId', 'Stale hint');
        const get = Storage.prototype.getItem;
        const set = Storage.prototype.setItem;
        const remove = Storage.prototype.removeItem;
        Storage.prototype.getItem = function (key) {
            if (fault === 'read' && this === window.sessionStorage) throw new DOMException('Tab reads denied', 'SecurityError');
            return get.call(this, key);
        };
        Storage.prototype.setItem = function (key, value) {
            if (fault === 'write' && this === window.sessionStorage) throw new DOMException('Tab quota exceeded', 'QuotaExceededError');
            set.call(this, key, value);
        };
        Storage.prototype.removeItem = function (key) {
            if (fault === 'remove' && this === window.sessionStorage) throw new DOMException('Tab removal denied', 'SecurityError');
            remove.call(this, key);
        };
    }, fault);
}

for (const role of ['player', 'spectator'] as const) {
    for (const fault of ['getter', 'read', 'write'] as const) {
        test(`${role} pairing and reload work when tab hints fail at ${fault}`, async ({ browser, request, baseURL }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            const expected = role === 'player' ? { role, gameId: id, playerId: 'Hint guest' } : { role, gameId: id };
            const issued = await request.post('/api/session/invite', { data: expected });
            expect(issued.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await issued.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            try {
                await denyHints(guest, fault);
                const page = await guest.newPage();
                const errors: string[] = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto('/#pair=' + token);
                const identity = page.getByText(role === 'player' ? /^Playing as Hint guest\./u : 'Spectator, read only.');
                await expect(identity).toBeVisible();
                expect(await (await guest.request.get('/api/session')).json()).toEqual(expected);
                expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
                await page.reload();
                await expect(identity).toBeVisible();
                await expect(page.getByRole('table', { name: 'Faction assignments', exact: true }).getByRole('row')).toHaveCount(1);
                expect(errors).toEqual([]);
            } finally {
                await guest.close();
            }
        });
    }
}

test('a spectator with failed hint removal keeps its authoritative read-only identity', async ({ browser, request, baseURL }) => {
    const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(created.ok()).toBe(true);
    const id = z.string().parse(await created.json());
    const issued = await request.post('/api/session/invite', { data: { role: 'spectator', gameId: id } });
    expect(issued.ok()).toBe(true);
    const { token } = z.object({ token: z.string() }).parse(await issued.json());
    const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
        await denyHints(guest, 'remove');
        const page = await guest.newPage();
        await page.goto('/#pair=' + token);
        await expect(page.getByText('Spectator, read only.')).toBeVisible();
        expect(await (await guest.request.get('/api/session')).json()).toEqual({ role: 'spectator', gameId: id });
        expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
        await page.reload();
        await expect(page.getByText('Spectator, read only.')).toBeVisible();
    } finally {
        await guest.close();
    }
});

for (const fault of ['getter', 'write'] as const) {
    test(`the host can join, change theme, and recover a saved game with ${fault} hint failure`, async ({ page, context, request }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        await denyHints(context, fault);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`/${id}`);
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Hint host');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        await page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Switch to Light Theme', exact: true })).toBeVisible();
        const saved = z.object({ game: z.object({ players: z.record(z.string(), z.unknown()) }) }).parse(await (await request.get(`/api/game/export?gameId=${id}`)).json());
        expect(Object.keys(saved.game.players)).toEqual(['Hint host']);
        await page.reload();
        await page.getByRole('combobox', { name: /^Select Player/u }).click();
        await page.getByRole('option', { name: 'Hint host', exact: true }).click();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        expect((await (await request.get('/api/session')).json()).role).toBe('host');
        expect(errors).toEqual([]);
    });
}

test('healthy tab storage still persists the chosen theme across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Switch to Light Theme', exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('theme'))).toBe('dark');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Switch to Light Theme', exact: true })).toBeVisible();
});
