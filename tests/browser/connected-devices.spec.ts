import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('host sees connected players and spectators, recovers failed reads, and stops closed-panel refreshes', async ({ page, browser, request, baseURL }, testInfo) => {
    const response = await request.post('/api/game/create', { data: { numPlayers: 2 } });
    expect(response.ok()).toBe(true);
    const id: unknown = await response.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    const player = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true });
    const spectator = await browser.newContext({ baseURL });
    let reads = 0;
    let fail = false;
    await page.route('**/api/session/connections?*', async route => {
        reads += 1;
        if (fail) await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        else await route.continue();
    });
    try {
        await page.goto(`/${id}/players`);
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        const panel = page.getByRole('button', { name: 'Connected devices', exact: true });
        await expect(panel).toHaveAttribute('aria-expanded', 'false');
        expect(reads).toBe(0);
        await panel.press('Enter');
        await expect(page.getByText('No paired players are connected.', { exact: true })).toBeVisible();
        await expect(page.getByText('Spectator devices connected: 0', { exact: true })).toBeVisible();
        await panel.click();
        await page.getByRole('textbox', { name: 'Player name', exact: true }).fill('Zoë phone');
        await page.getByRole('checkbox', { name: 'Allow table-wide editing', exact: true }).check();
        await page.getByRole('button', { name: 'Create invitation', exact: true }).click();
        const invitation = await page.getByRole('textbox', { name: 'One-use invitation link', exact: true }).inputValue();
        const phone = await player.newPage();
        await phone.goto(invitation);
        await expect(phone.getByText(/Table-wide public editing enabled/)).toBeVisible();
        await expect(phone.getByRole('button', { name: 'Pair a device', exact: true })).toHaveCount(0);
        const secondTab = await player.newPage();
        await secondTab.goto(`/${id}/players`);
        await expect(secondTab.getByText(/Table-wide public editing enabled/)).toBeVisible();
        const issued = await request.post('/api/session/invite', { data: { role: 'spectator', gameId: id } });
        expect(issued.ok()).toBe(true);
        const guestInvite: unknown = await issued.json();
        if (!guestInvite || typeof guestInvite !== 'object' || !('token' in guestInvite) || typeof guestInvite.token !== 'string') {
            throw new Error('Expected spectator invitation');
        }
        const viewer = await spectator.newPage();
        await viewer.goto('/#pair=' + guestInvite.token);
        await expect(viewer.getByText('Spectator, read only.', { exact: true })).toBeVisible();
        await panel.click();
        await expect(page.getByText('Players connected: 1', { exact: true })).toBeVisible();
        const roster = page.getByRole('list', { name: 'Connected players', exact: true });
        await expect(roster.getByText('Zoë phone', { exact: true })).toBeVisible();
        await expect(roster.getByText('Table-wide public editing', { exact: true })).toBeVisible();
        await expect(page.getByText('Spectator devices connected: 1', { exact: true })).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        await panel.scrollIntoViewIfNeeded();
        await expect(roster).toBeInViewport({ ratio: 1 });
        await expect(page.getByText('Spectator devices connected: 1', { exact: true })).toBeInViewport({ ratio: 1 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const screenshot = testInfo.outputPath('connected-devices.png');
        await page.screenshot({ path: screenshot });
        await testInfo.attach('Connected devices on a narrow host screen', { path: screenshot, contentType: 'image/png' });
        const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        await testInfo.attach('Connected devices accessibility', {
            body: JSON.stringify(accessibility.violations, null, 2), contentType: 'application/json',
        });
        expect(accessibility.violations).toEqual([]);
        const denied = await player.request.get('/api/session/connections?gameId=' + id);
        expect(denied.status()).toBe(403);
        await phone.close();
        await page.getByRole('button', { name: 'Refresh connected devices', exact: true }).click();
        await expect(page.getByText('Players connected: 1', { exact: true })).toBeVisible();
        await secondTab.close();
        await expect(page.getByText('No paired players are connected.', { exact: true })).toBeVisible({ timeout: 10000 });
        fail = true;
        await page.getByRole('button', { name: 'Refresh connected devices', exact: true }).click();
        await expect(page.getByRole('alert').filter({ hasText: 'Could not load connected devices' })).toBeVisible();
        await expect(page.getByText('Spectator devices connected: 1', { exact: true })).toHaveCount(0);
        fail = false;
        await page.getByRole('button', { name: 'Retry connected devices', exact: true }).click();
        await expect(page.getByText('Spectator devices connected: 1', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        const closedReads = reads;
        await page.clock.install();
        await page.clock.fastForward(15000);
        expect(reads).toBe(closedReads);
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        await expect(panel).toHaveAttribute('aria-expanded', 'false');
        await panel.click();
        await expect(page.getByText('Spectator devices connected: 1', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Disconnect paired devices', exact: true }).click();
        const refreshed = page.waitForRequest(request => request.url().includes('/api/session/connections?'), { timeout: 2000 });
        await page.getByRole('button', { name: 'Revoke device access', exact: true }).click();
        await refreshed;
        await expect(panel).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText('Spectator devices connected: 0', { exact: true })).toBeVisible();
    } finally {
        await player.close();
        await spectator.close();
        await request.post('/api/game/delete', { data: { id } });
    }
});

test('a collapsed panel aborts its pending read and cannot publish a late response', async ({ page, request }) => {
    const created = await request.post('/api/game/create', { data: {} });
    expect(created.ok()).toBe(true);
    const id: unknown = await created.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    let release = () => {};
    const held = new Promise<void>(resolve => { release = resolve; });
    let reads = 0;
    await page.route('**/api/session/connections?*', async route => {
        reads += 1;
        if (reads === 1) {
            await held;
            await route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ players: [{ playerId: 'Canceled response', tableEditing: true }], spectators: 0 }),
            });
        } else await route.continue();
    });
    try {
        await page.goto(`/${id}/players`);
        await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
        await page.clock.install();
        const panel = page.getByRole('button', { name: 'Connected devices', exact: true });
        await panel.click();
        await expect(page.getByRole('status').filter({ hasText: 'Loading connected devices' })).toBeVisible();
        await expect.poll(() => reads).toBe(1);
        await page.clock.fastForward(10000);
        expect(reads, 'slow reads do not overlap scheduled refreshes').toBe(1);
        const aborted = page.waitForEvent('requestfailed', {
            predicate: request => request.url().includes('/api/session/connections?'), timeout: 5000,
        });
        await panel.click();
        release();
        expect((await aborted).failure()?.errorText).toContain('ABORTED');
        await panel.click();
        await expect(page.getByText('No paired players are connected.', { exact: true })).toBeVisible();
        await expect(page.getByText('Canceled response', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('alert').filter({ hasText: 'Could not load connected devices' })).toHaveCount(0);
    } finally {
        release();
        await request.post('/api/game/delete', { data: { id } });
    }
});
