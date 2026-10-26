import { expect, type APIRequestContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { z } from 'zod';
import { test } from '../helpers/isolated-browser-host.js';

async function createSavedGame(request: APIRequestContext, name: string, archived = false) {
    const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
    expect(created.ok()).toBe(true);
    const id = z.string().parse(await created.json());
    expect((await request.post('/api/game/rename', { data: { gameId: id, name } })).ok()).toBe(true);
    if (archived) expect((await request.post('/api/game/archive', { data: { gameId: id, archived } })).ok()).toBe(true);
    return id;
}

const cards = (page: Page) =>
    page.getByRole('article', { name: /^Saved game /u });

// All cases own a real host; filtering must never change its saved library.
test('search combines name/code matching with archive visibility and survives refresh without writes', async ({ page, request }) => {
    const saturday = await createSavedGame(request, 'Sat 银河');
    const wednesday = await createSavedGame(request, '周三');
    const archived = await createSavedGame(request, 'Sat 归档', true);
    const before: unknown = await (await request.get('/api/game/list')).json();
    let reads = 0;
    let writes = 0;
    page.on('request', request => {
        if (new URL(request.url()).pathname === '/api/game/list') reads += 1;
        if (request.method() !== 'GET') writes += 1;
    });
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Search saved games', exact: true });
    await expect(search).toBeVisible();
    await expect(cards(page)).toHaveCount(2);
    await search.fill(' SAT ');
    await expect(cards(page)).toHaveAttribute('aria-label', `Saved game ${saturday}`);
    await page.getByRole('checkbox', { name: 'Show archived games', exact: true }).check();
    await expect(cards(page)).toHaveCount(2);
    await search.fill(archived.toLowerCase());
    await expect(cards(page)).toHaveAttribute('aria-label', `Saved game ${archived}`);
    await page.getByRole('checkbox', { name: 'Show archived games', exact: true }).uncheck();
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByText('No saved games match your search.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search', exact: true }).press('Enter');
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();
    await expect(cards(page)).toHaveCount(2);
    expect(reads).toBe(1);
    expect(writes).toBe(0);
    await search.fill('周三');
    await page.getByRole('button', { name: 'Refresh saved games', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Refresh saved games', exact: true })).toBeEnabled();
    await expect(cards(page)).toHaveAttribute('aria-label', `Saved game ${wednesday}`);
    await expect(search).toHaveValue('周三');
    expect(reads).toBe(2);
    expect(writes).toBe(0);
    expect(await (await request.get('/api/game/list')).json()).toEqual(before);
});

test('name sorting has a stable code tie-break and last-played sorting restores the real host order', async ({ page, request }) => {
    const zulu = await createSavedGame(request, 'Zulu');
    const alpha = await createSavedGame(request, 'Alpha');
    const anotherAlpha = await createSavedGame(request, 'Alpha');
    const before = z.array(z.object({ id: z.string() })).parse(await (await request.get('/api/game/list')).json());
    await page.goto('/');
    const sort = page.getByRole('combobox', { name: /^Sort saved games /u });
    await expect(sort).toBeVisible();
    await expect(cards(page)).toHaveCount(3);
    expect(await cards(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label'))))
        .toEqual(before.map(game => `Saved game ${game.id}`));
    await sort.click();
    await page.getByRole('option', { name: 'Name', exact: true }).click();
    await expect(sort).toContainText('Name');
    const alphaCodes = [alpha, anotherAlpha].sort();
    expect(await cards(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label'))))
        .toEqual([...alphaCodes, zulu].map(id => `Saved game ${id}`));
    await page.getByRole('button', { name: 'Refresh saved games', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Refresh saved games', exact: true })).toBeEnabled();
    await expect(sort).toContainText('Name');
    expect(await cards(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label'))))
        .toEqual([...alphaCodes, zulu].map(id => `Saved game ${id}`));
    await sort.click();
    await page.getByRole('option', { name: 'Last played', exact: true }).click();
    await expect(sort).toContainText('Last played');
    expect(await cards(page).evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label'))))
        .toEqual(before.map(game => `Saved game ${game.id}`));
});

test('renaming the last search match preserves the saved name and recovers keyboard focus', async ({ page, request }) => {
    const id = await createSavedGame(request, 'Original campaign');
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Search saved games', exact: true });
    await expect(search).toBeVisible();
    await search.fill('Original');
    await cards(page).getByRole('button', { name: `Rename ${id}`, exact: true }).press('Enter');
    const input = page.getByRole('textbox', { name: 'Game name', exact: true });
    await input.fill('Renamed campaign');
    await input.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Saved games', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Clear search', exact: true }).press('Enter');
    await expect(cards(page).getByRole('heading', { name: 'Renamed campaign', exact: true })).toBeVisible();
    await expect(search).toBeFocused();
    const saved = z.array(z.object({ id: z.string(), name: z.string().nullable() })).parse(await (await request.get('/api/game/list')).json());
    expect(saved.find(game => game.id === id)?.name).toBe('Renamed campaign');
});

for (const theme of ['Light', 'Dark'] as const) {
    test(`search and empty results remain usable at phone width in ${theme} theme`, async ({ page, request }, testInfo) => {
        await createSavedGame(request, '银河 Saturday');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        const search = page.getByRole('searchbox', { name: 'Search saved games', exact: true });
        await expect(search).toBeVisible();
        if (theme === 'Dark') await page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }).click();
        await search.fill('银河');
        await expect(cards(page)).toHaveCount(1);
        await page.screenshot({ path: testInfo.outputPath('search-results.png'), fullPage: true, animations: 'disabled' });
        await search.fill('No matching game');
        await expect(page.getByText('No saved games match your search.', { exact: true })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath('empty-search.png'), fullPage: true, animations: 'disabled' });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(scan.violations).toEqual([]);
        await page.getByRole('button', { name: 'Clear search', exact: true }).press('Enter');
        await expect(search).toBeFocused();
        await expect(cards(page)).toHaveCount(1);
    });
}
