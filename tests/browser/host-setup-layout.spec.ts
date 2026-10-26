import { expect, test, Page, APIRequestContext } from '@playwright/test';

async function openSetup(page: Page, request: APIRequestContext, slots: number) {
    const response = await request.post('/api/game/create', { data: { numPlayers: slots } });
    expect(response.ok()).toBe(true);
    const id: unknown = await response.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    await page.goto(`/${id}`);
    await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Setup host');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('combobox', { name: /^Faction /u })).toHaveCount(slots);
    await expect(page.getByRole('combobox', { name: /^Faction /u }).first()).toBeEnabled();
    return id;
}

async function expectOneScreen(page: Page, slots: number) {
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const setup = page.getByRole('table', { name: 'Faction setup', exact: true });
    await expect(setup.getByRole('row')).toHaveCount(slots);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('Missing viewport');
    for (const control of [...(await setup.getByRole('combobox').all()), ...(await setup.getByRole('button').all())]) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        if (!box) throw new Error('Missing setup control geometry');
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
        expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Pair a device', exact: true })).toBeInViewport();
}

for (const slots of [2, 6, 8]) {
    test(`desktop host can see all ${slots} setup slots and actions without scrolling`, async ({
        page,
        request,
    }, testInfo) => {
        await page.setViewportSize({ width: 1200, height: 850 });
        const id = await openSetup(page, request, slots);
        try {
            await expectOneScreen(page, slots);
            await page.screenshot({ path: testInfo.outputPath(`setup-${slots}-1200.png`) });
            await page.setViewportSize({ width: 1024, height: 660 });
            await expectOneScreen(page, slots);
            await page.setViewportSize({ width: 1280, height: 800 });
            await expectOneScreen(page, slots);
            if (slots === 8) {
                await page
                    .getByRole('combobox', { name: /^Faction /u })
                    .last()
                    .click();
                await page.getByRole('option', { name: 'The Arborec', exact: true }).click();
                await expect(page.getByRole('combobox', { name: /^Color /u }).last()).toBeEnabled();
                await page
                    .getByRole('combobox', { name: /^Color /u })
                    .last()
                    .click();
                await page.getByRole('option', { name: 'RED', exact: true }).click();
                await expect(
                    page.getByRole('combobox', { name: /^Players \(none, one, or multiple\)/u }).last(),
                ).toBeEnabled();
                await page
                    .getByRole('combobox', { name: /^Players \(none, one, or multiple\)/u })
                    .last()
                    .click();
                await page.getByRole('option', { name: 'Setup host', exact: true }).click();
                const position = page.getByRole('combobox', { name: 'Position for player slot 8', exact: true });
                await expect(position).toBeEnabled();
                await position.focus();
                await page.keyboard.press('Space');
                await page.keyboard.press('Home');
                await page.keyboard.press('Enter');
                await expect(page.getByRole('combobox', { name: /^Faction /u }).first()).toContainText('The Arborec');
                await expect(
                    page.getByRole('combobox', { name: /^Players \(none, one, or multiple\)/u }).first(),
                ).toContainText('Setup host');
                await expectOneScreen(page, slots);
                await page.screenshot({ path: testInfo.outputPath('setup-8-edited-1280.png') });
                const saved = await (await request.get(`/api/game/export?gameId=${id}`)).json();
                expect(saved.game.factions[0].name).toBe('The Arborec');
                expect(saved.game.factions[0].playerIds).toEqual(['Setup host']);
            }
        } finally {
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}

test('narrow setup keeps readable controls and scrolls to every slot without horizontal overflow', async ({
    page,
    request,
}) => {
    await page.setViewportSize({ width: 390, height: 500 });
    const id = await openSetup(page, request, 8);
    try {
        expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const last = page.getByRole('combobox', { name: /^Faction /u }).last();
        await last.scrollIntoViewIfNeeded();
        await expect(last).toBeInViewport();
        const box = await last.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
        await last.click();
        await page.getByRole('option', { name: 'The Emirates of Hacan', exact: true }).click();
        await expect(last).toContainText('The Emirates of Hacan');
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally {
        await request.post('/api/game/delete', { data: { id } });
    }
});
