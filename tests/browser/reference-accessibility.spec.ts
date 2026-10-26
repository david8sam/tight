import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
    test(`expanded faction reference has named fields and passes automated checks in ${theme} theme`, async ({ page }, testInfo) => {
        await page.goto('/factions');
        const faction = page.getByRole('combobox', { name: /^Faction /u });
        await expect(faction).toContainText('The Arborec');
        if (theme === 'dark') await page.getByRole('button', { name: 'Switch to Dark Theme', exact: true }).click();
        await page.getByRole('button', { name: 'Expand', exact: true }).press('Enter');
        await page.setViewportSize({ width: 390, height: 844 });
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        await testInfo.attach('Expanded faction reference accessibility', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
        expect(results.violations).toEqual([]);
        const commodities = page.getByRole('textbox', { name: 'Commodities', exact: true });
        await expect(commodities).toBeVisible();
        await expect(commodities).toHaveValue('3');
        await expect(commodities).toHaveAttribute('readonly', '');
    });
}
