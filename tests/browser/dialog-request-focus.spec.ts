import { expect, test } from '@playwright/test';

for (const kind of ['create', 'join', 'restart', 'invite'] as const) {
    for (const moveFocus of [false, true]) {
        test(`${kind} request errors ${moveFocus ? 'preserve deliberate focus' : 'restore the keyboard submit control'}`, async ({ page, request }) => {
            let id: string | undefined;
            let release = () => {};
            try {
                if (kind !== 'create') {
                    const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
                    expect(created.ok()).toBe(true);
                    const code: unknown = await created.json();
                    if (typeof code !== 'string') throw new Error('Expected game code');
                    id = code;
                }
                await page.goto(kind === 'create' || kind === 'join' ? '/' : `/${id}/players`);
                if (kind === 'create') await page.getByRole('button', { name: 'Create Game', exact: true }).click();
                if (kind === 'join') await page.getByRole('button', { name: 'Join Game', exact: true }).click();
                if (kind === 'restart') {
                    await page.getByRole('button', { name: 'Game Info', exact: true }).click();
                    await page.getByRole('button', { name: 'Restart Game...', exact: true }).click();
                }
                if (kind === 'invite') await page.getByRole('button', { name: 'Pair a device', exact: true }).click();
                const dialogName = kind === 'create' ? 'Create new game'
                    : kind === 'join' ? 'Join game'
                    : kind === 'restart' ? 'Restart game' : `Pair a device with game ${id}`;
                const dialog = page.getByRole('dialog', { name: dialogName, exact: true });
                await expect(dialog).toBeVisible();
                if (kind === 'join') await dialog.getByRole('textbox', { name: 'Game Code', exact: true }).fill(id || '');
                if (kind === 'invite') await dialog.getByRole('textbox', { name: 'Player name', exact: true }).fill('Keyboard guest');
                const name = kind === 'create' ? /^Save$/u
                    : kind === 'join' ? /^(Join|Joining game)$/u
                    : kind === 'restart' ? /Restart Game$/u : /^Create invitation$/u;
                const submit = dialog.getByRole('button', { name });
                const close = dialog.getByRole('button', { name: 'Close', exact: true });
                const routePattern = kind === 'create' ? '**/api/game/create'
                    : kind === 'join' ? '**/api/game/validate?*'
                    : kind === 'restart' ? '**/api/game/restart' : '**/api/session/invite';
                let attempts = 0;
                const gate = new Promise<void>(resolve => { release = resolve; });
                await page.route(routePattern, async route => {
                    attempts += 1;
                    await gate;
                    await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
                });
                await submit.press('Enter');
                await expect.poll(() => attempts).toBe(1);
                const pendingSubmit = kind === 'join'
                    ? dialog.getByRole('button').filter({ has: page.getByRole('progressbar', { name: 'Joining game', exact: true }) })
                    : submit;
                await expect(pendingSubmit).toBeDisabled();
                await expect(submit).toBeDisabled();
                await page.keyboard.press('Enter');
                expect(attempts).toBe(1);
                if (moveFocus) {
                    await close.focus();
                    await expect(close).toBeFocused();
                }
                release();
                const message = kind === 'create' ? /Could not create the game/u
                    : kind === 'join' ? /Could not reach the host/u
                    : kind === 'restart' ? /Could not restart the game/u : /Could not update device access/u;
                await expect(dialog.getByText(message)).toBeVisible();
                await expect(submit).toBeEnabled();
                await expect(moveFocus ? close : submit).toBeFocused();
                expect(attempts).toBe(1);
                if (kind === 'join') await expect(dialog.getByRole('textbox', { name: 'Game Code', exact: true })).toHaveValue(id || '');
                if (kind === 'invite') await expect(dialog.getByRole('textbox', { name: 'Player name', exact: true })).toHaveValue('Keyboard guest');
                await page.keyboard.press('Escape');
                await expect(dialog).toHaveCount(0);
            } finally {
                release();
                if (id) await request.post('/api/game/delete', { data: { id } });
            }
        });
    }
}
