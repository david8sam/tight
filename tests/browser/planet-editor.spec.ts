import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { Game } from '../../src/common/Game.js';

test('planet editor restores and resets DMZ, names modifier controls, and saves keyboard edits', async ({ page, request }, testInfo) => {
    const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(created.ok()).toBe(true);
    const id: unknown = await created.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    try {
        const portable: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
        portable.game.players = { Host: { id: 'Host' } };
        Object.assign(portable.game.factions[0], {
            name: 'The Arborec', color: '#d50000', playerIds: ['Host'], planets: ['Mecatol Rex'],
        });
        Object.assign(portable.game.planets['Mecatol Rex'], {
            owner: 'The Arborec', refreshed: true, modifiers: { DMZ: true, resources: 2 },
        });
        Object.assign(portable.game.status, { started: true, pickOrder: ['The Arborec'], speaker: 'The Arborec' });
        expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
        expect((await request.post('/api/game/import', { data: portable })).ok()).toBe(true);
        await page.addInitScript(gameId => {
            sessionStorage.setItem('gameId', gameId);
            sessionStorage.setItem('playerId', 'Host');
        }, id);
        await page.goto(`/${id}/planets`);
        const row = page.getByRole('row').filter({ has: page.getByText('Mecatol Rex', { exact: true }) });
        const edit = row.getByRole('button', { name: /^Edit/ });
        await edit.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Edit planet', exact: true });
        const dmz = dialog.getByRole('row').filter({ hasText: 'DMZ' }).getByRole('checkbox');
        await expect(dmz).toBeChecked();
        await expect(dmz).toHaveAccessibleName('DMZ');
        const resources = dialog.getByRole('spinbutton', { name: 'resources modifier', exact: true });
        await expect(resources).toHaveValue('2');
        const initial = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        await testInfo.attach('Planet editor accessibility', { body: JSON.stringify(initial.violations), contentType: 'application/json' });
        expect(initial.violations).toEqual([]);
        await dialog.getByRole('button', { name: 'Reset', exact: true }).press('Enter');
        await expect(dmz).not.toBeChecked();
        await expect(resources).toHaveValue('0');
        await dialog.getByRole('banner').getByRole('button', { name: 'Save', exact: true }).press('Enter');
        await expect(dialog).toHaveCount(0);
        await expect(edit).toBeFocused();
        const saved = async () => {
            const value: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            const modifiers = value.game.planets['Mecatol Rex'].modifiers;
            return { DMZ: modifiers?.DMZ ?? false, resources: modifiers?.resources ?? 0 };
        };
        await expect.poll(saved).toEqual({ DMZ: false, resources: 0 });
        await edit.press('Enter');
        await expect(dmz).not.toBeChecked();
        await dmz.press('Space');
        await expect(dmz).toBeChecked();
        await dialog.getByRole('button', { name: 'Increase resources modifier', exact: true }).press('Enter');
        await expect(resources).toHaveValue('1');
        await dialog.getByRole('button', { name: 'Decrease resources modifier', exact: true }).press('Enter');
        await expect(resources).toHaveValue('0');
        await dialog.getByRole('button', { name: 'Increase resources modifier', exact: true }).press('Enter');
        await dialog.getByRole('banner').getByRole('button', { name: 'Save', exact: true }).press('Enter');
        await expect.poll(saved).toEqual({ DMZ: true, resources: 1 });
        await page.reload();
        await edit.press('Enter');
        await expect(dmz).toBeChecked();
        await expect(resources).toHaveValue('1');
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
        await testInfo.attach('Planet editor on phone viewport', { body: await page.screenshot(), contentType: 'image/png' });
        await dialog.getByRole('button', { name: 'Close', exact: true }).press('Enter');
        await expect(edit).toBeFocused();
        await page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }).press('Enter');
        await edit.press('Enter');
        const dark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(dark.violations).toEqual([]);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(edit).toBeFocused();
    } finally {
        await request.post('/api/game/delete', { data: { id } });
    }
});
