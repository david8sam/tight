import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { sessionSchema } from '../../src/common/session.js';

for (const role of ['player', 'spectator']) {
    for (const fault of ['session read', 'claim body']) {
        test(`an accepted ${role} invitation survives a failed ${fault} without another claim`, async ({ browser, request, baseURL }) => {
            const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
            expect(created.ok()).toBe(true);
            const id = z.string().parse(await created.json());
            const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
            try {
                const expected = role === 'player' ? { role, gameId: id, playerId: 'Patient phone' } : { role, gameId: id };
                const issued = await request.post('/api/session/invite', { data: expected });
                expect(issued.ok()).toBe(true);
                const { token } = z.object({ token: z.string() }).parse(await issued.json());
                const page = await guest.newPage();
                let claims = 0;
                let reads = 0;
                let rejectRepeatedClaims = false;
                await page.route('**/api/session/claim', async route => {
                    claims += 1;
                    if (rejectRepeatedClaims) {
                        await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
                        return;
                    }
                    const response = await route.fetch();
                    expect(response.ok()).toBe(true);
                    if (fault === 'claim body') await route.fulfill({ response, body: '{' });
                    else await route.fulfill({ response });
                });
                await page.route('**/api/session', async route => {
                    reads += 1;
                    if (fault === 'session read' && reads === 1) {
                        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                    } else await route.continue();
                });
                await page.goto('/#pair=' + token);
                await expect(page.getByRole('alert')).toBeVisible();
                expect(claims).toBe(1);
                expect(reads).toBe(fault === 'session read' ? 1 : 0);
                expect(new URL(page.url()).hash).toBe('');
                // The first successful response installed a real, durable device cookie.
                expect(sessionSchema.parse(await (await guest.request.get('/api/session')).json())).toEqual(expected);
                // An expired consumed receipt can reject a repeat POST while that cookie remains valid.
                rejectRepeatedClaims = true;
                await page.getByRole('button', { name: 'Try again', exact: true }).press('Enter');
                await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
                await expect(page.getByText(role === 'player' ? /^Playing as Patient phone\./u : 'Spectator, read only.')).toBeVisible();
                expect(claims).toBe(1);
                expect(reads).toBe(fault === 'session read' ? 2 : 1);
                expect((await guest.request.post('/api/game/create', { data: {} })).status()).toBe(403);
                await page.reload();
                await expect(page.getByText(role === 'player' ? /^Playing as Patient phone\./u : 'Spectator, read only.')).toBeVisible();
                expect(claims).toBe(1);
            } finally {
                await guest.close();
                await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}

for (const role of ['player', 'spectator']) {
    test(`a rejected ${role} claim is retried before reading the device session`, async ({ browser, request, baseURL }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        const guest = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        try {
            const expected = role === 'player' ? { role, gameId: id, playerId: 'Retry phone' } : { role, gameId: id };
            const issued = await request.post('/api/session/invite', { data: expected });
            expect(issued.ok()).toBe(true);
            const { token } = z.object({ token: z.string() }).parse(await issued.json());
            const page = await guest.newPage();
            let claims = 0;
            let reads = 0;
            await page.route('**/api/session/claim', async route => {
                claims += 1;
                if (claims === 1) await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                else await route.continue();
            });
            page.on('request', outgoing => {
                if (new URL(outgoing.url()).pathname === '/api/session') reads += 1;
            });
            await page.goto('/#pair=' + token);
            await expect(page.getByRole('alert')).toBeVisible();
            expect(claims).toBe(1);
            expect(reads).toBe(0);
            expect(sessionSchema.parse(await (await guest.request.get('/api/session')).json())).toEqual({ role: 'unpaired' });
            await page.getByRole('button', { name: 'Try again', exact: true }).press('Enter');
            await expect(page).toHaveURL(new RegExp(`/${id}/status$`));
            await expect(page.getByText(role === 'player' ? /^Playing as Retry phone\./u : 'Spectator, read only.')).toBeVisible();
            expect(claims).toBe(2);
            expect(reads).toBe(1);
            expect(sessionSchema.parse(await (await guest.request.get('/api/session')).json())).toEqual(expected);
        } finally {
            await guest.close();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
