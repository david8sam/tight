import { expect, test } from '@playwright/test';

for (const direction of ['expand', 'collapse'] as const) {
    test(`manual ${direction} of every faction section updates the bulk controls`, async ({ page }) => {
        await page.goto('/factions');
        await expect(page.getByRole('combobox', { name: /^Faction /u })).toContainText('The Arborec');
        const sections = page.getByRole('button', { name: /^(Starting Units|Starting Tech|Commodities|Abilities|Promissory Note|Faction Tech|Faction Units|Flagship|Mech|Leaders)$/u });
        await expect(sections).toHaveCount(10);
        const expand = page.getByRole('button', { name: 'Expand', exact: true });
        const collapse = page.getByRole('button', { name: 'Collapse', exact: true });
        if (direction === 'collapse') await expand.press('Enter');
        for (const section of await sections.all()) {
            await section.press('Enter');
            await expect(section).toHaveAttribute('aria-expanded', String(direction === 'expand'));
        }
        await expect(direction === 'expand' ? expand : collapse).toBeDisabled();
        const opposite = direction === 'expand' ? collapse : expand;
        await expect(opposite).toBeEnabled();
        await opposite.press('Enter');
        for (const section of await sections.all())
            await expect(section).toHaveAttribute('aria-expanded', String(direction !== 'expand'));
    });
}
