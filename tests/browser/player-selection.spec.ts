import { expect, test, type APIRequestContext } from '@playwright/test';
import { z } from 'zod';

async function savedPlayers(request: APIRequestContext, id: string) {
    const response = await request.get(`/api/game/export?gameId=${id}`);
    expect(response.ok()).toBe(true);
    const value: unknown = await response.json();
    return Object.keys(z.object({ game: z.object({ players: z.record(z.string(), z.unknown()) }) }).parse(value).game.players);
}

test.afterEach(async ({ request }, testInfo) => {
    const id = testInfo.annotations.find(annotation => annotation.type === 'created-game')?.description;
    if (id) await request.post('/api/game/delete', { data: { id }, timeout: 5000 });
});

for (const scenario of ['blank new name', 'literal option name', 'new-name draft']) {
    test(`player selection distinguishes ${scenario} from an existing identity`, async ({ page, context, request }, testInfo) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id = z.string().parse(await created.json());
        testInfo.annotations.push({ type: 'created-game', description: id });
        const existing = scenario === 'literal option name' ? 'Create New Player' : 'Earlier host';
        await page.goto(`/${id}`);
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill(existing);
        await page.getByRole('button', { name: 'Continue', exact: true }).press('Enter');
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        const fresh = await context.newPage();
        await fresh.goto(`/${id}`);
        const dialog = fresh.getByRole('dialog', { name: 'Player', exact: true });
        const select = dialog.getByRole('combobox', { name: /^Select Player(?: |$)/u });
        const name = dialog.getByRole('textbox', { name: 'Enter Name', exact: true });
        const submit = dialog.getByRole('button', { name: 'Continue', exact: true });
        await select.press('Enter');
        await expect(fresh.getByRole('listbox')).toBeVisible();
        await fresh.keyboard.press('End');
        await expect(fresh.getByRole('listbox').getByRole('option').last()).toBeFocused();
        await fresh.keyboard.press('Enter');
        await expect(name).toHaveCount(0);
        await expect(submit).toBeEnabled();
        if (scenario === 'literal option name') {
            await fresh.keyboard.press('Tab');
            await expect(submit).toBeFocused();
            await fresh.keyboard.press('Enter');
        } else {
            await select.press('Enter');
            await expect(fresh.getByRole('listbox')).toBeVisible();
            await fresh.keyboard.press('Home');
            await expect(fresh.getByRole('listbox').getByRole('option').first()).toBeFocused();
            await fresh.keyboard.press('Enter');
            await expect(name).toHaveValue('');
            await expect(submit).toBeDisabled();
            await name.press('Enter');
            await expect(dialog).toBeVisible();
            expect(await savedPlayers(request, id)).toEqual([existing]);
            if (scenario === 'new-name draft') {
                await name.fill(existing);
                await expect(select).toContainText('Create New Player');
                await expect(name).toHaveValue(existing);
                await select.press('Enter');
                await expect(fresh.getByRole('listbox')).toBeVisible();
                await fresh.keyboard.press('End');
                await expect(fresh.getByRole('listbox').getByRole('option').last()).toBeFocused();
                await fresh.keyboard.press('Enter');
                await expect(name).toHaveCount(0);
                await select.press('Enter');
                await expect(fresh.getByRole('listbox')).toBeVisible();
                await fresh.keyboard.press('Home');
                await expect(fresh.getByRole('listbox').getByRole('option').first()).toBeFocused();
                await fresh.keyboard.press('Enter');
                await expect(name).toHaveValue('');
                await expect(submit).toBeDisabled();
            }
            await name.fill('Actual new host');
            await fresh.keyboard.press('Tab');
            await expect(submit).toBeFocused();
            await fresh.keyboard.press('Enter');
        }
        await expect(dialog).toHaveCount(0);
        await expect(fresh.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        const expected = scenario === 'literal option name' ? [existing] : [existing, 'Actual new host'];
        expect(await savedPlayers(request, id)).toEqual(expected);
        await fresh.reload();
        await expect(fresh.getByRole('dialog', { name: 'Player', exact: true })).toHaveCount(0);
        await expect(fresh.getByRole('combobox', { name: /^Faction /u })).toHaveCount(1);
        expect(await savedPlayers(request, id)).toEqual(expected);
    });
}
