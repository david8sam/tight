import { expect } from '@playwright/test';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

for (const role of ['player', 'spectator'] as const) {
    for (const fault of ['healthy', 'write failure'] as const) {
        test(`${role} startup uses the authenticated identity despite an earlier name with ${fault} hints`, async ({ browser, request, baseURL }, testInfo) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const gameId = z.string().parse(await created.json());
            const expected = role === 'player' ? { role, gameId, playerId: 'Authenticated guest' } : { role, gameId };
            const invitation = await request.post('/api/session/invite', { data: expected });
            expect(invitation.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await invitation.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            const sockets: string[] = [];
            try {
                expect((await guest.request.post('/api/session/claim', { data: { token } })).ok()).toBe(true);
                await guest.addInitScript(({ fault }) => {
                    if (location.protocol !== 'http:') return;
                    sessionStorage.setItem('playerId', 'Earlier host name');
                    if (fault === 'write failure') {
                        const set = Storage.prototype.setItem;
                        Storage.prototype.setItem = function (key, value) {
                            if (this === window.sessionStorage) throw new DOMException('Hint quota exceeded', 'QuotaExceededError');
                            set.call(this, key, value);
                        };
                    }
                }, { fault });
                const page = await guest.newPage();
                page.on('websocket', socket => sockets.push(socket.url()));
                await page.goto(`/${gameId}/status`);
                await expect(page.getByText(role === 'player' ? /^Playing as Authenticated guest\./u : 'Spectator, read only.')).toBeVisible();
                expect(await (await guest.request.get('/api/session')).json()).toEqual(expected);
                expect((await guest.request.post('/api/game/create', { data: { numPlayers: 1 } })).status()).toBe(403);
                expect(sockets.length).toBeGreaterThan(0);
                for (const socket of sockets)
                    expect(new URL(socket).searchParams.get('playerId')).toBe(role === 'player' ? 'Authenticated guest' : null);
                await page.reload();
                await expect(page.getByText(role === 'player' ? /^Playing as Authenticated guest\./u : 'Spectator, read only.')).toBeVisible();
            } finally {
                await testInfo.attach('Guest startup WebSocket targets', { body: JSON.stringify(sockets), contentType: 'application/json' });
                await guest.close();
            }
        });
    }
}
