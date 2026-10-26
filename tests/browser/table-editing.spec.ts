import { expect, test } from '@playwright/test';
import { Game, StrategyCardIndex as Card } from '../../src/common/Game.js';

const first = 'The Arborec';
const second = 'The Emirates of Hacan';

test('host explicitly grants public table editing while private and host controls stay restricted', async ({ page, browser, request, baseURL }) => {
    const created = await request.post('/api/game/create', { data: { numPlayers: 2 } });
    expect(created.ok()).toBe(true);
    const id: unknown = await created.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    const guest = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
        const portable: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
        portable.game.players = { Host: { id: 'Host' } };
        portable.game.factions.forEach((faction, index) => Object.assign(faction, {
            name: index ? second : first, color: index ? '#2962ff' : '#d50000',
            playerIds: ['Host'], strategyCard: Card.NONE,
            secretObjectives: Array.from({ length: 3 }, (_, secretIndex) => ({ cleared: false, objective: { id: -secretIndex - 1, description: 'Host private objective', vp: 1 } })),
        }));
        Object.assign(portable.game.status, { started: true, pickOrder: [first, second], speaker: first });
        expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
        const imported = await request.post('/api/game/import', { data: portable });
        expect(imported.ok(), await imported.text()).toBe(true);
        await page.addInitScript(gameId => {
            sessionStorage.setItem('gameId', gameId);
            sessionStorage.setItem('playerId', 'Host');
        }, id);
        await page.goto(`/${id}/status`);
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        await page.getByRole('textbox', { name: 'Player name', exact: true }).fill('Table helper');
        const grant = page.getByRole('checkbox', { name: 'Allow table-wide editing', exact: true });
        await expect(grant).not.toBeChecked();
        await expect(page.getByText(/To remove this permission or recover a lost device/)).toBeVisible();
        await grant.check();
        await page.getByRole('textbox', { name: 'Player name', exact: true }).fill('Replacement helper');
        await expect(grant).not.toBeChecked();
        await grant.check();
        await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
        await expect(page.getByRole('textbox', { name: 'One-use invitation link', exact: true })).toBeVisible();
        await grant.uncheck();
        await expect(page.getByRole('textbox', { name: 'One-use invitation link', exact: true })).toHaveCount(0);
        await grant.check();
        await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
        const invitation = await page.getByRole('textbox', { name: 'One-use invitation link', exact: true }).inputValue();
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        await expect(grant).not.toBeChecked();
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        const phone = await guest.newPage();
        await phone.goto(invitation);
        await expect(phone.getByText(/Table-wide public editing enabled/)).toBeVisible();
        await expect(phone.getByRole('button', { name: 'Pair a device', exact: true })).not.toBeVisible();
        await expect(phone.getByRole('button', { name: /Restart/i })).not.toBeVisible();
        await phone.getByText('Assign Cards', { exact: true }).click();
        for (const [faction, card] of [[first, 'Leadership'], [second, 'Trade']]) {
            await phone.getByRole('combobox', { name: `Strategy card for ${faction}`, exact: true }).click();
            await phone.getByRole('option', { name: card, exact: true }).click();
        }
        await expect(phone.getByRole('button', { name: 'Next phase: ACTION', exact: true })).toBeEnabled();
        await phone.getByRole('button', { name: 'Next phase: ACTION', exact: true }).click();
        await expect(phone.getByRole('button', { name: 'ACTION phase details', exact: true })).toBeVisible();
        await phone.getByRole('button', { name: 'Menu', exact: true }).click();
        await phone.getByText('My Planets', { exact: true }).click();
        await phone.getByRole('combobox', { name: /^My Factions/u }).click();
        await expect(phone.getByRole('option', { name: first, exact: true })).toBeVisible();
        await phone.getByRole('option', { name: second, exact: true }).click();
        await expect(phone.getByRole('button', { name: 'Add/Remove Planets', exact: true })).toBeEnabled();
        await phone.reload();
        await expect(phone.getByRole('combobox', { name: /^My Factions/u })).toBeVisible();
        await expect(phone.getByRole('button', { name: 'Add/Remove Planets', exact: true })).toBeEnabled();
        await phone.goto(`/${id}/players`);
        await expect(phone.getByRole('table', { name: 'Faction assignments', exact: true })).toBeVisible();
        await expect(phone.getByRole('combobox', { name: /^Players \(none, one, or multiple\)/ })).toHaveCount(0);
        expect((await guest.request.post('/api/game/export?gameId=' + id)).status()).toBe(403);
        const snapshot: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
        expect(snapshot.game.factions.map(faction => faction.strategyCard)).toEqual([Card.LEADERSHIP, Card.TRADE]);
        expect(snapshot.game.status.phase).toBe(1);
        expect(snapshot.game.status.ended).toBe(false);
        expect(snapshot.game.factions[1].secretObjectives[0].objective.description).toBe('Host private objective');
        await phone.reload();
        await expect(phone.getByText(/Table-wide public editing enabled/)).toBeVisible();
    } finally {
        await guest.close();
        await request.post('/api/game/delete', { data: { id } });
    }
});
