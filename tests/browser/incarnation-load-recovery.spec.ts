import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { FactionColor } from '../../src/common/colors.js';
import { MessageType } from '../../src/common/message.js';

for (const fault of ['none', 'before', 'after'] as const) {
    const throws = fault !== 'none';
    test(`an incarnation refresh ${throws ? `recovers a send exception ${fault} forwarding` : 'loads normally'} after a missed recreation broadcast`, async ({ page, request }) => {
        await page.addInitScript(({ changeType, initializeType, loadType, fault }) => {
            const NativeWebSocket = window.WebSocket;
            const connections: string[] = [];
            let initialIncarnation: unknown;
            Reflect.set(window, 'incarnationConnections', connections);
            Reflect.set(window, 'incarnationLoads', 0);
            window.WebSocket = class extends NativeWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    connections.push(String(url));
                    let failed = false;
                    const send = this.send.bind(this);
                    const close = this.close.bind(this);
                    this.send = data => {
                        if (typeof data === 'string' && Reflect.get(window, 'incarnationFaultArmed')) {
                            const packet: unknown = JSON.parse(data);
                            if (packet && typeof packet === 'object' && 'type' in packet && packet.type === loadType) {
                                Reflect.set(window, 'incarnationLoads', Number(Reflect.get(window, 'incarnationLoads')) + 1);
                                Reflect.set(window, 'incarnationFaultArmed', false);
                                if (fault !== 'none') {
                                    if (fault === 'after') send(data);
                                    failed = true;
                                    throw new DOMException('Simulated incarnation-read send failure', 'InvalidStateError');
                                }
                            }
                        }
                        send(data);
                    };
                    this.close = (code, reason) => {
                        if (failed) {
                            Reflect.set(window, 'incarnationCloseHeld', true);
                            return;
                        }
                        close(code, reason);
                    };
                    this.addEventListener('message', event => {
                        const packet: unknown = JSON.parse(event.data);
                        if (!packet || typeof packet !== 'object' || !('type' in packet) || !('data' in packet)) return;
                        const data = packet.data;
                        if (!data || typeof data !== 'object') return;
                        const version = 'gameVersion' in data ? data.gameVersion : null;
                        const incarnation = version && typeof version === 'object' && 'incarnation' in version
                            ? version.incarnation : null;
                        if (packet.type === initializeType && initialIncarnation === undefined) initialIncarnation = incarnation;
                        if (!Reflect.get(window, 'missRecreation') || packet.type !== changeType || !('game' in data)) return;
                        const game = data.game;
                        if (!game || typeof game !== 'object') return;
                        if ('created' in game && incarnation !== initialIncarnation) Reflect.set(window, 'recreationMissed', true);
                        if ('created' in game || 'deleted' in game) event.stopImmediatePropagation();
                    });
                }
            };
        }, { changeType: MessageType.BROADCAST_CHANGE, initializeType: MessageType.BROADCAST_INITIALIZE, loadType: MessageType.GAME_LOAD, fault });
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        const helper = await page.context().newPage();
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
            await page.goto(`/${id}/players`);
            const color = page.getByRole('combobox', { name: /^Color /u }).first();
            await expect(color).toContainText('None');
            const exported: unknown = await (await request.get(`/api/game/export?gameId=${id}`)).json();
            await page.clock.install();
            await page.evaluate(() => Reflect.set(window, 'missRecreation', true));
            expect((await request.post('/api/game/delete', { data: { id } })).ok()).toBe(true);
            expect((await request.post('/api/game/import', { data: exported })).ok()).toBe(true);
            await expect.poll(() => page.evaluate(() => Reflect.get(window, 'recreationMissed'))).toBe(true);
            await page.evaluate(() => Reflect.set(window, 'incarnationFaultArmed', true));
            await helper.goto(`/${id}/players`);
            await helper.getByRole('combobox', { name: /^Color /u }).first().click();
            await helper.getByRole('option', { name: 'RED', exact: true }).click();
            await expect(helper.getByRole('status')).toHaveText('Saved');
            await expect.poll(() => page.evaluate(() => Reflect.get(window, 'incarnationLoads'))).toBe(1);
            if (throws) {
                expect(await page.evaluate(() => Reflect.get(window, 'incarnationCloseHeld'))).toBe(true);
                await page.clock.fastForward(3001);
                await expect.poll(() => page.evaluate(() => Reflect.get(window, 'incarnationConnections').length)).toBe(2);
                const endpoint: unknown = await page.evaluate(() => Reflect.get(window, 'incarnationConnections')[1]);
                if (typeof endpoint !== 'string') throw new Error('Expected replacement socket URL');
                expect(new URL(endpoint).searchParams.get('gameId')).toBe(id);
            }
            await expect(color).toContainText('RED');
            await expect(page.getByText('The host sent an unsupported reply. Reload this page.', { exact: true })).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).toHaveCount(0);
            await color.click();
            await page.getByRole('option', { name: 'BLUE', exact: true }).click();
            await expect(page.getByRole('status')).toHaveText('Saved');
            const saved = z.object({ game: z.object({ factions: z.array(z.object({ color: z.string() })) }) })
                .parse(await (await request.get(`/api/game/export?gameId=${id}`)).json());
            expect(saved.game.factions[0].color).toBe(FactionColor.BLUE);
            await page.clock.fastForward(30000);
            expect(await page.evaluate(() => Reflect.get(window, 'incarnationConnections').length)).toBe(throws ? 2 : 1);
            expect(errors).toEqual([]);
        } finally {
            await helper.close();
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
