import { test, expect } from '@playwright/test';
import { Game, StrategyCardIndex as Card } from '../../src/common/Game.js';
import { MessageType } from '../../src/common/message.js';

const owner = 'The Arborec';
const waiting = 'The Emirates of Hacan';

for (const [held, family, shownNames] of [
    [Card.DIPLOMACY, 'Diplomacy', ['Diplomacy', 'Diplomacy II']],
    [Card.DIPLOMACY_2, 'Diplomacy', ['Diplomacy', 'Diplomacy II']],
    [Card.CONSTRUCTION, 'Construction', ['Construction II']],
    [Card.CONSTRUCTION_2, 'Construction', ['Construction II']],
] as const) {
    test(`held ${family} ${held} stays visible and returns its actual card through every displayed variant`, async ({
        page,
        request,
    }) => {
        const created = await request.post('/api/game/create', { data: { numPlayers: 2 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        const returned: number[] = [];
        page.on('websocket', socket =>
            socket.on('framesent', ({ payload }) => {
                const frame = JSON.parse(payload.toString());
                const commands = Array.isArray(frame.data?.commands) ? frame.data.commands : [frame];
                for (const command of commands) {
                    if (command.type === MessageType.RETURN_STRATEGY_CARD) returned.push(command.data.strategyCard);
                }
            }),
        );
        try {
            const portable: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            portable.game.players = { Verifier: { id: 'Verifier' } };
            portable.game.factions.forEach((faction, index) =>
                Object.assign(faction, {
                    name: index ? waiting : owner,
                    color: index ? '#2962ff' : '#d50000',
                    playerIds: index ? [] : ['Verifier'],
                    strategyCard: index ? Card.NONE : held,
                }),
            );
            Object.assign(portable.game.status, { started: true, pickOrder: [owner, waiting], speaker: owner });
            expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
            expect((await request.post('/api/game/import', { data: portable })).ok()).toBe(true);
            await page.addInitScript(gameId => {
                sessionStorage.setItem('gameId', gameId);
                sessionStorage.setItem('playerId', 'Verifier');
            }, id);
            await page.goto(`/${id}/status`);
            for (const name of shownNames) {
                await expect(page.getByRole('button', { name: `Return ${name}`, exact: true })).toBeEnabled();
                await expect(page.getByRole('button', { name: `Take ${name}`, exact: true })).not.toBeVisible();
            }
            await page.getByText('Assign Cards', { exact: true }).click();
            const holder = page.getByRole('combobox', { name: `Strategy card for ${owner}`, exact: true });
            await expect(holder).toContainText(
                held === Card.DIPLOMACY || held === Card.CONSTRUCTION ? family : `${family} II`,
            );
            const other = page.getByRole('combobox', { name: `Strategy card for ${waiting}`, exact: true });
            await other.click();
            for (const name of [family, `${family} II`]) {
                await expect(page.getByRole('option', { name, exact: true })).toHaveCount(0);
            }
            await page.keyboard.press('Escape');
            await page.getByRole('button', { name: `Return ${family} II`, exact: true }).click();
            await expect(holder).toContainText('None');
            for (const name of shownNames)
                await expect(page.getByRole('button', { name: `Take ${name}`, exact: true })).toBeEnabled();
            const after: { game: Game } = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            expect(after.game.factions[0].strategyCard).toBe(Card.NONE);
            expect(after.game.factions[1].strategyCard).toBe(Card.NONE);
            expect(returned).toEqual([held]);
        } finally {
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
