import { expect, test } from '@playwright/test';
import { Game } from '../../src/common/Game.js';
import { MessageType } from '../../src/common/message.js';

test('phone planet changes are acknowledged before navigation and survive reload', async ({ page, browser, request, baseURL }) => {
    const response = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(response.ok()).toBe(true);
    const id: unknown = await response.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    const guest = await browser.newContext({
        baseURL, viewport: { width: 390, height: 844 }, hasTouch: true,
        storageState: { cookies: [], origins: [] },
    });
    try {
        const portable: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
        portable.game.players = { Host: { id: 'Host' }, Phone: { id: 'Phone' } };
        Object.assign(portable.game.factions[0], {
            name: 'The Arborec', color: '#d50000', playerIds: ['Host', 'Phone'], planets: ['Mecatol Rex'],
        });
        Object.assign(portable.game.planets['Mecatol Rex'], { owner: 'The Arborec', refreshed: true });
        Object.assign(portable.game.status, { started: true, pickOrder: ['The Arborec'], speaker: 'The Arborec' });
        expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
        expect((await request.post('/api/game/import', { data: portable })).ok()).toBe(true);
        const invitation = await request.post('/api/session/invite', { data: { role: 'player', gameId: id, playerId: 'Phone' } });
        expect(invitation.ok()).toBe(true);
        const { token } = await invitation.json();
        expect((await guest.request.post('/api/session/claim', { data: { token } })).ok()).toBe(true);
        await page.addInitScript(gameId => {
            sessionStorage.setItem('gameId', gameId);
            sessionStorage.setItem('playerId', 'Host');
        }, id);
        const phone = await guest.newPage();
        let holding = true;
        let releaseAcknowledgment: (() => void) | undefined;
        await phone.routeWebSocket('**/socket*', socket => {
            const server = socket.connectToServer();
            server.onMessage(message => {
                const packet = JSON.parse(message.toString());
                if (holding && packet.type === MessageType.COMMAND_RESULT)
                    releaseAcknowledgment = () => socket.send(message);
                else socket.send(message);
            });
        });
        await page.goto(`/${id}/planets`);
        await phone.goto(`/${id}/planets`);
        const phoneRow = phone.getByRole('row').filter({ has: phone.getByText('Mecatol Rex', { exact: true }) });
        const hostRow = page.getByRole('row').filter({ has: page.getByText('Mecatol Rex', { exact: true }) });
        await expect(phoneRow).toBeVisible();
        await phone.clock.install();
        await phone.clock.pauseAt(new Date());
        await phoneRow.click();
        await expect(phoneRow).toHaveAttribute('aria-disabled', 'true');
        await expect(phone.getByRole('button', { name: 'Refresh All Planets', exact: true })).toBeDisabled();
        await phone.getByRole('button', { name: 'Menu', exact: true }).click();
        await phone.clock.runFor(400);
        await phone.getByRole('button', { name: 'Status', exact: true }).click();
        await expect(phone).toHaveURL(new RegExp(`/${id}/status$`));
        await phone.clock.runFor(2500);
        await expect(hostRow).toHaveClass(/Mui-selected/);
        const snapshot = async () => {
            const saved: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            return saved.game.planets['Mecatol Rex'].refreshed;
        };
        await expect.poll(snapshot).toBe(false);
        await expect.poll(() => Boolean(releaseAcknowledgment)).toBe(true);
        holding = false;
        releaseAcknowledgment!();
        await expect(phone.getByRole('status')).toHaveText('Saved');
        await phone.clock.resume();
        await phone.goto(`/${id}/planets`);
        await expect(phoneRow).toHaveClass(/Mui-selected/);
        await phone.getByRole('button', { name: 'Refresh All Planets', exact: true }).click();
        await expect.poll(snapshot).toBe(true);
        await expect(hostRow).not.toHaveClass(/Mui-selected/);
        await phone.getByRole('button', { name: 'Exhaust All Planets', exact: true }).click();
        await expect.poll(snapshot).toBe(false);
        await phone.reload();
        await expect(phoneRow).toHaveClass(/Mui-selected/);
    } finally {
        await guest.close();
        await request.post('/api/game/delete', { data: { id } });
    }
});
