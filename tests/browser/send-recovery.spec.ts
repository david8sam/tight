import { expect, test } from '@playwright/test';
import { z } from 'zod';
import { MessageType } from '../../src/common/message.js';
import { commandResultSchema } from '../../src/common/commandResult.js';
import { gameVersionSchema } from '../../src/common/gameVersion.js';

for (const { forwarded, failures } of [{ forwarded: false, failures: 1 }, { forwarded: true, failures: 1 }, { forwarded: false, failures: 3 }]) {
    const scenario = failures === 3
        ? 'repeated command send failures stop until explicit recovery'
        : `a command send failure ${forwarded ? 'after' : 'before'} forwarding recovers automatically`;
    test(`${scenario} without changing command identity`, async ({ page, request }) => {
        await page.addInitScript(({ batchType, resultType, forwarded, failures }) => {
            const NativeWebSocket = window.WebSocket;
            const faultSockets = new Set<WebSocket>();
            let remaining = failures;
            const frames: string[] = [];
            const results: unknown[] = [];
            Reflect.set(window, 'sendFrames', frames);
            Reflect.set(window, 'sendResults', results);
            Reflect.set(window, 'sendConnections', 0);
            window.WebSocket = class extends NativeWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    Reflect.set(window, 'sendConnections', Number(Reflect.get(window, 'sendConnections')) + 1);
                    const send = this.send.bind(this);
                    const close = this.close.bind(this);
                    this.send = data => {
                        if (typeof data === 'string' && Reflect.get(window, 'sendFaultArmed')) {
                            const packet: unknown = JSON.parse(data);
                            if (packet && typeof packet === 'object' && 'type' in packet && packet.type === batchType) {
                                frames.push(data);
                                if (remaining > 0) {
                                    remaining -= 1;
                                    faultSockets.add(this);
                                    if (forwarded) send(data);
                                    throw new DOMException('Simulated command transport failure', 'InvalidStateError');
                                }
                            }
                        }
                        send(data);
                    };
                    this.close = (code, reason) => {
                        if (faultSockets.has(this)) {
                            Reflect.set(window, 'sendClosesHeld', faultSockets.size);
                            return;
                        }
                        close(code, reason);
                    };
                    this.addEventListener('message', event => {
                        if (!Reflect.get(window, 'sendFaultArmed')) return;
                        const packet: unknown = JSON.parse(event.data);
                        if (packet && typeof packet === 'object' && 'type' in packet && packet.type === resultType && 'data' in packet) {
                            results.push(packet.data);
                        }
                    });
                }
            };
        }, { batchType: MessageType.COMMAND_BATCH, resultType: MessageType.COMMAND_RESULT, forwarded, failures });
        const created = await request.post('/api/game/create', { data: { numPlayers: 1 } });
        expect(created.ok()).toBe(true);
        const id: unknown = await created.json();
        if (typeof id !== 'string') throw new Error('Expected game code');
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
            await page.goto(`/${id}`);
            await page.getByRole('textbox', { name: 'Enter Name', exact: true }).fill('Send recovery host');
            await page.getByRole('button', { name: 'Continue', exact: true }).click();
            const faction = page.getByRole('combobox', { name: /^Faction /u }).first();
            await expect(faction).toBeEnabled();
            await expect(page.getByRole('status')).toHaveText('Saved');
            await page.clock.install();
            await page.evaluate(() => Reflect.set(window, 'sendFaultArmed', true));
            await faction.click();
            await page.getByRole('option', { name: 'The Arborec', exact: true }).click();
            for (let attempt = 1; attempt <= failures; attempt += 1) {
                await expect.poll(() => page.evaluate(() => Reflect.get(window, 'sendClosesHeld'))).toBe(attempt);
                await expect(page.getByRole('status')).toHaveText('Unconfirmed');
                if (forwarded) await expect.poll(() => page.evaluate(() => Reflect.get(window, 'sendResults').length)).toBe(1);
                await page.clock.fastForward(3001);
                await expect.poll(() => page.evaluate(() => Reflect.get(window, 'sendConnections'))).toBe(attempt + 1);
            }
            if (failures === 3) {
                await expect(page.getByRole('status')).toHaveText('Unconfirmed');
                await expect(faction).toContainText('None');
                await page.clock.fastForward(60000);
                expect(await page.evaluate(() => Reflect.get(window, 'sendFrames').length)).toBe(3);
                expect(await page.evaluate(() => Reflect.get(window, 'sendConnections'))).toBe(4);
                await page.getByRole('button', { name: 'Check last change', exact: true }).click();
            }
            await expect(page.getByRole('status')).toHaveText('Saved');
            await expect(faction).toContainText('The Arborec');
            await expect(faction).toBeEnabled();
            const frames = z.array(z.string()).parse(await page.evaluate(() => Reflect.get(window, 'sendFrames')));
            expect(frames).toHaveLength(failures + 1);
            expect(new Set(frames).size).toBe(1);
            const command = z.object({ id: z.string(), baseVersion: gameVersionSchema }).parse(JSON.parse(frames[0]));
            const results = z.array(commandResultSchema).parse(await page.evaluate(() => Reflect.get(window, 'sendResults')));
            expect(results.map(result => result.status)).toEqual(forwarded ? ['saved', 'duplicate'] : ['saved']);
            expect(results.every(result => result.id === command.id && result.version?.revision === command.baseVersion.revision + 1)).toBe(true);
            await page.clock.fastForward(60000);
            expect(await page.evaluate(() => Reflect.get(window, 'sendConnections'))).toBe(failures + 1);
            expect(await page.evaluate(() => Reflect.get(window, 'sendFrames').length)).toBe(failures + 1);
            expect(errors).toEqual([]);
        } finally {
            await request.post('/api/game/delete', { data: { id } });
        }
    });
}
