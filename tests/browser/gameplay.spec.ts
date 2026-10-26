import { expect, test } from '@playwright/test';
import { Game, Phase, StrategyCardIndex } from '../../src/common/Game.js';

test('host and phone synchronize turns, scoring, round reset and final results', async ({ page, browser, request, baseURL }, testInfo) => {
    const created = await request.post('/api/game/create', {
        data: { numPlayers: 1, numRounds: 2, publicObjectives: [{ id: 1, description: 'Journey objective', vp: 1 }] },
    });
    expect(created.ok()).toBe(true);
    const id: unknown = await created.json();
    if (typeof id !== 'string') throw new Error('Expected game code');
    const guest = await browser.newContext({
        baseURL, viewport: { width: 390, height: 844 }, hasTouch: true,
        storageState: { cookies: [], origins: [] },
    });
    try {
        const portable: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
        portable.game.players = { Host: { id: 'Host' }, Phone: { id: 'Phone' } };
        Object.assign(portable.game.factions[0], { name: 'The Arborec', color: '#d50000', playerIds: ['Phone'] });
        Object.assign(portable.game.status, { started: true, pickOrder: ['The Arborec'], speaker: 'The Arborec' });
        expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
        expect((await request.post('/api/game/import', { data: portable })).ok()).toBe(true);
        const invitation = await request.post('/api/session/invite', { data: { role: 'player', gameId: id, playerId: 'Phone' } });
        expect(invitation.ok()).toBe(true);
        const { token } = await invitation.json();
        expect((await guest.request.post('/api/session/claim', { data: { token } })).ok()).toBe(true);
        await page.addInitScript(gameId => {
            sessionStorage.setItem('gameId', gameId);
            sessionStorage.setItem('playerId', 'Host');
        }, id);
        const phone = await guest.newPage();
        await page.goto(`/${id}/status`);
        await phone.goto('/');
        for (const round of [1, 2]) {
            await expect(phone.getByText(`Round: ${round}`, { exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Take Leadership', exact: true }).click();
            await expect(phone.getByRole('button', { name: 'Return Leadership', exact: true })).toBeEnabled();
            await page.getByRole('button', { name: 'Next phase: ACTION', exact: true }).click();
            await phone.getByRole('button', { name: 'FLIP', exact: true }).click();
            await expect(page.getByRole('button', { name: 'UNFLIP', exact: true })).toBeVisible();
            await expect(phone.getByRole('button', { name: 'DONE', exact: true })).toBeDisabled();
            await page.getByRole('button', { name: 'DONE', exact: true }).click();
            await expect(phone.getByText('Turn: END', { exact: true })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Next Turn', exact: true })).toBeEnabled();
            await page.getByRole('button', { name: 'Next Turn', exact: true }).click();
            await expect(phone.getByText('Turn:', { exact: true }).locator('..')).toContainText('The Arborec (Phone)');
            await phone.getByRole('button', { name: 'PASS', exact: true }).click();
            await expect(page.getByRole('button', { name: 'UNPASS', exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Next phase: STATUS', exact: true }).click();
            await phone.getByRole('button', { name: `${round === 1 ? 0 : 1} Victory Points`, exact: true }).click();
            const score = phone.getByRole('checkbox', { name: 'Score public objective 1', exact: true });
            if (round === 1) await score.click();
            await expect(score).toBeChecked();
            await expect(page.getByRole('button', { name: '1 Victory Points', exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Next phase: AGENDA', exact: true }).click();
            if (round === 1) {
                await page.screenshot({ path: testInfo.outputPath('next-round-action.png') });
                await page.getByRole('button', { name: 'Start Next Round', exact: true }).click();
                await expect(phone.getByText('Round: 2', { exact: true })).toBeVisible();
                const saved: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
                expect(saved.game.status.phase).toBe(Phase.STRATEGY);
                expect(saved.game.factions[0]).toMatchObject({
                    strategyCard: StrategyCardIndex.NONE, passed: false, stragetyCardFlipped: false,
                    publicObjectives: [true],
                });
            }
        }
        await page.getByRole('button', { name: 'End Game', exact: true }).click();
        for (const client of [page, phone]) {
            await expect(client).toHaveURL(new RegExp(`/${id}/results$`));
            await expect(client.getByText('Our New Space Emperor is', { exact: true })).toBeVisible();
            await expect(client.getByRole('button', { name: '1 Victory Points', exact: true })).toBeVisible();
        }
        await phone.screenshot({ path: testInfo.outputPath('phone-results.png'), fullPage: true });
        await phone.reload();
        await expect(phone.getByText('Our New Space Emperor is', { exact: true })).toBeVisible();
        const saved: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
        expect(saved.game.status).toMatchObject({ ended: true, round: 2 });
    } finally {
        await guest.close();
        await request.post('/api/game/delete', { data: { id } });
    }
});
