import AxeBuilder from '@axe-core/playwright';
import { expect, test, Locator } from '@playwright/test';

test('setup controls support names and keyboard input; core screens meet automated accessibility checks', async ({
    page,
    request,
}, testInfo) => {
    const press = async (button: Locator) => {
        await expect(button).toBeEnabled();
        await button.press('Enter');
    };
    const tabTo = async (target: Locator) => {
        // A closing select still owns focus until its transition unmounts the menu.
        await expect(page.getByRole('listbox', { includeHidden: true })).toHaveCount(0);
        await expect(target).toBeVisible();
        await expect(target).toBeEnabled();
        for (let attempt = 0; attempt < 50; attempt++) {
            if (await target.evaluate(element => element === document.activeElement)) return;
            await page.keyboard.press('Tab');
        }
        await expect(target).toBeFocused();
    };
    const violations: { screen: string; id: string; impact: string | null | undefined; nodes: string[] }[] = [];
    const scan = async (screen: string) => {
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        violations.push(
            ...results.violations.map(item => ({
                screen,
                id: item.id,
                impact: item.impact,
                nodes: item.nodes.map(node => `${node.target.join(' ')} ${node.failureSummary} ${node.html}`),
            })),
        );
    };
    let id: string | undefined;
    try {
        await page.goto('/');
        const create = page.getByRole('button', { name: 'Create Game', exact: true });
        await expect(create).toBeVisible();
        await scan('home');
        await tabTo(create);
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Create new game', exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('..')).toHaveCSS('opacity', '1');
        await scan('new game');
        const count = dialog.getByRole('combobox', { name: 'Number of Players', exact: true });
        await tabTo(count);
        await page.keyboard.press('Enter');
        await page.keyboard.press('Home');
        await page.keyboard.press('Enter');
        await expect(count).toContainText('1');
        await press(dialog.getByRole('button', { name: 'Close', exact: true }));
        await expect(create).toBeFocused();
        await create.press('Enter');
        await tabTo(page.getByRole('combobox', { name: 'Number of Players', exact: true }));
        await page.keyboard.press('Enter');
        await page.keyboard.press('Home');
        await page.keyboard.press('Enter');
        await press(page.getByRole('button', { name: 'Save', exact: true }));
        await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Keyboard host');
        id = new URL(page.url()).pathname.split('/')[1];
        await press(page.getByRole('button', { name: 'Continue', exact: true }));
        const faction = page.getByRole('combobox', { name: /^Faction /u });
        await expect(faction).toBeVisible();
        await tabTo(faction);
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(faction).toContainText('The Arborec');
        const color = page.getByRole('combobox', { name: /^Color /u });
        await tabTo(color);
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(color).toContainText('RED');
        const players = page.getByRole('combobox', { name: /^Players \(none, one, or multiple\)/u });
        await tabTo(players);
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await expect(players).toContainText('Keyboard host');
        await scan('setup');
        await press(page.getByRole('button', { name: 'Start', exact: true }));
        await expect(page.getByText('Turn: The Arborec', { exact: true })).toBeVisible();
        await scan('game');
        await page.screenshot({ path: testInfo.outputPath('game.png'), fullPage: true });
        await press(page.getByRole('button', { name: /^Take leadership$/i }));
        await expect(page.getByRole('button', { name: /^Return leadership$/i })).toBeVisible();
        await press(page.getByRole('button', { name: 'Next phase: ACTION', exact: true }));
        await scan('action');
        await press(page.getByRole('button', { name: 'FLIP', exact: true }));
        await press(page.getByRole('button', { name: 'PASS', exact: true }));
        await press(page.getByRole('button', { name: 'Next phase: STATUS', exact: true }));
        await press(page.getByRole('button', { name: '0 Victory Points', exact: true }));
        await scan('scoring');
        const score = page.getByRole('checkbox', { name: 'Score public objective 1', exact: true });
        await tabTo(score);
        await page.keyboard.press('Space');
        await expect(score).toBeChecked();
        await press(page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }));
        await scan('scoring in dark theme');
        await page.setViewportSize({ width: 390, height: 844 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await scan('phone-width scoring');
        await page.goto('/no-such-route/extra');
        await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
        await press(page.getByRole('button', { name: 'Go to Home page', exact: true }));
        await expect(create).toBeVisible();
        await testInfo.attach('accessibility-results', {
            body: JSON.stringify(violations, null, 2),
            contentType: 'application/json',
        });
        expect(violations).toEqual([]);
    } finally {
        if (id && testInfo.status !== 'timedOut') await request.post('/api/game/delete', { data: { id } });
    }
});
