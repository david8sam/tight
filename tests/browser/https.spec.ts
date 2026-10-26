import { test, expect } from '@playwright/test';
import { startHttpsHost } from '../helpers/https-host.mjs';

test('host setup, phone pairing, and reload use the configured HTTPS origin and WSS port', async ({ browser }) => {
    const host = await startHttpsHost();
    const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } });
    const phone = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
        const page = await context.newPage();
        const sockets: string[] = [];
        const errors: string[] = [];
        page.on('websocket', socket => sockets.push(socket.url()));
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(host.claimUrl);
        await page.getByRole('button', { name: 'Create Game', exact: true }).click();
        await page.getByRole('combobox', { name: 'Number of Players', exact: true }).click();
        await page.getByRole('option', { name: '1', exact: true }).click();
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Zoë & 李');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByRole('combobox', { name: /^Faction /u }).click();
        await page.getByRole('option', { name: 'The Arborec', exact: true }).click();
        await page.getByRole('combobox', { name: /^Color /u }).click();
        await page.getByRole('option', { name: 'RED', exact: true }).click();
        await page.getByRole('combobox', { name: /^Players \(none, one, or multiple\)/u }).click();
        await page.getByRole('option', { name: 'Zoë & 李', exact: true }).click();
        await page.getByRole('button', { name: 'Start', exact: true }).click();
        await expect(page.getByText('Turn: The Arborec', { exact: true })).toBeVisible();
        const id = new URL(page.url()).pathname.split('/')[1];
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        await page.getByRole('textbox', { name: 'Player name', exact: true }).fill('Phone & 東京');
        await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
        const invitation = await page.getByRole('textbox', { name: 'One-use invitation link', exact: true }).inputValue();
        expect(new URL(invitation).origin).toBe(host.origin);
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        const screen = await phone.newPage();
        screen.on('websocket', socket => sockets.push(socket.url()));
        screen.on('pageerror', error => errors.push(error.message));
        await screen.goto(invitation);
        await expect(screen.getByText('Round: 1', { exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('button', { name: /^Take leadership$/i })).toBeEnabled();
        await page.getByRole('button', { name: /^Take leadership$/i }).click();
        await expect(page.getByRole('button', { name: /^Return leadership$/i })).toBeEnabled();
        await screen.reload();
        await expect(screen.getByText('Round: 1', { exact: true })).toBeVisible();
        const exported = await context.request.get(`${host.origin}/api/game/export?gameId=${id}`);
        expect(exported.ok()).toBe(true);
        const data = await exported.json();
        expect(data.game.players['Zoë & 李']).toBeDefined();
        expect(data.game.players['Phone & 東京']).toBeDefined();
        expect(data.game.factions[0].strategyCard).toBe(1);
        expect(sockets.length).toBeGreaterThanOrEqual(4);
        for (const url of sockets) {
            const endpoint = new URL(url);
            expect(endpoint.protocol).toBe('wss:');
            expect(endpoint.host).toBe(new URL(host.origin).host);
            expect(endpoint.pathname).toBe('/socket');
        }
        expect(sockets.some(url => new URL(url).searchParams.get('playerId') === 'Zoë & 李')).toBe(true);
        expect(sockets.some(url => new URL(url).searchParams.get('playerId') === 'Phone & 東京')).toBe(true);
        expect(errors).toEqual([]);
    } finally {
        await context.close();
        await phone.close();
        await host.stop();
    }
});
