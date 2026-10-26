import { expect, test } from '@playwright/test';

test('failed handshakes back off, stop at the limit, and allow immediate manual recovery', async ({ page }) => {
    await page.addInitScript(() => {
        const NativeWebSocket = window.WebSocket;
        Reflect.set(window, 'connectionAttempts', 0);
        window.WebSocket = class extends NativeWebSocket {
            constructor(url: string | URL, protocols?: string | string[]) {
                // Use a real refused connection to fail before the open event.
                super(Reflect.get(window, 'refuseConnection') ? 'ws://127.0.0.1:1/socket' : url, protocols);
                Reflect.set(window, 'connectionAttempts', Reflect.get(window, 'connectionAttempts') + 1);
                Reflect.set(window, 'testGameSocket', this);
            }
        };
    });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'testGameSocket')?.readyState)).toBe(1);
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.evaluate(() => {
        Reflect.set(window, 'refuseConnection', true);
        const socket = Reflect.get(window, 'testGameSocket');
        if (!(socket instanceof WebSocket)) throw new Error('Missing game socket');
        socket.close();
        return new Promise<void>(resolve => socket.addEventListener('close', () => resolve(), { once: true }));
    });
    let attempts = 1;
    for (const delay of [3000, 3000, 6000, 12000, 24000]) {
        await page.clock.runFor(delay - 1);
        expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(attempts);
        await page.clock.runFor(1);
        attempts += 1;
        await expect.poll(() => page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(attempts);
        await expect.poll(() => page.evaluate(() => Reflect.get(window, 'testGameSocket')?.readyState)).toBe(3);
    }
    await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).toBeVisible();
    await page.clock.runFor(60000);
    expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(6);
    await page.evaluate(() => Reflect.set(window, 'refuseConnection', false));
    await page.getByRole('button', { name: 'Reconnect', exact: true }).click();
    await expect.poll(() => page.evaluate(() => Reflect.get(window, 'testGameSocket')?.readyState)).toBe(1);
    expect(await page.evaluate(() => Reflect.get(window, 'connectionAttempts'))).toBe(7);
    await expect(page.getByRole('button', { name: 'Reconnect', exact: true })).not.toBeVisible();
});
