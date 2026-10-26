import { expect } from '@playwright/test';
import { test } from '../helpers/isolated-browser-host.js';

for (const action of ['start', 'stop'] as const) {
    for (const outcome of ['failure', 'failure with moved focus', 'success'] as const) {
        test(`Wi-Fi ${action} preserves keyboard recovery after ${outcome}`, async ({ page }) => {
            await page.addInitScript(initialMode => {
                const hosting = { mode: initialMode, address: '192.168.1.10', port: 18743,
                    interfaces: [{ name: 'Wi-Fi', address: '192.168.1.10' }] };
                window.tightDesktop = { getHosting: async () => hosting, setHosting: async () => hosting };
            }, action === 'start' ? 'local' : 'lan');
            await page.goto('/');
            await page.getByRole('button', { name: 'Wi-Fi sharing', exact: true }).click();
            const dialog = page.getByRole('dialog', { name: 'Share TIGHT over Wi-Fi', exact: true });
            await dialog.getByRole('combobox', { name: /^Wi-Fi or Ethernet network/u }).click();
            await page.getByRole('option', { name: 'Wi-Fi (192.168.1.10)', exact: true }).click();
            await page.evaluate(() => {
                const api = window.tightDesktop;
                if (!api) throw new Error('Missing native test bridge');
                document.documentElement.dataset.sharingCalls = '0';
                api.setHosting = address => new Promise((resolve, reject) => {
                    const root = document.documentElement;
                    root.dataset.sharingCalls = String(Number(root.dataset.sharingCalls) + 1);
                    window.addEventListener('finish-sharing-test', event => {
                        if (event instanceof CustomEvent && event.detail === 'failure') reject(new Error('Native bind failed'));
                        else resolve({ mode: address ? 'lan' : 'local', ...(address ? { address } : {}), port: 18743,
                            interfaces: [{ name: 'Wi-Fi', address: '192.168.1.10' }] });
                    }, { once: true });
                });
            });
            const submit = dialog.getByRole('button', { name: action === 'start' ? 'Start sharing on this network' : 'Stop Wi-Fi sharing', exact: true });
            const close = dialog.getByRole('button', { name: 'Close', exact: true });
            await submit.press('Enter');
            await expect.poll(() => page.evaluate(() => document.documentElement.dataset.sharingCalls)).toBe('1');
            await expect(submit).toBeDisabled();
            if (outcome !== 'success') {
                // Keep the activating control focusable, while blocking duplicate requests.
                await expect(submit).toBeFocused();
                await submit.press('Enter');
                await submit.press('Space');
            }
            expect(await page.evaluate(() => document.documentElement.dataset.sharingCalls)).toBe('1');
            if (outcome === 'failure with moved focus') {
                await close.focus();
                await expect(close).toBeFocused();
                await close.press('Enter');
                await expect(dialog).toBeVisible();
            }
            await page.evaluate(result => window.dispatchEvent(new CustomEvent('finish-sharing-test', { detail: result })), outcome === 'success' ? 'success' : 'failure');
            if (outcome !== 'success') {
                await expect(dialog.getByRole('alert')).toContainText('Could not update Wi-Fi sharing');
                await expect(submit).toBeEnabled();
                await expect(outcome === 'failure with moved focus' ? close : submit).toBeFocused();
                await submit.press('Enter');
                await expect.poll(() => page.evaluate(() => document.documentElement.dataset.sharingCalls)).toBe('2');
                await expect(submit).toBeFocused();
                await page.evaluate(() => window.dispatchEvent(new CustomEvent('finish-sharing-test', { detail: 'success' })));
            }
            if (action === 'stop') {
                await expect(submit).toHaveCount(0);
                await expect(dialog.getByText('Local only. Other devices cannot connect yet.')).toBeVisible();
                await expect(close).toBeFocused();
            } else {
                await expect(dialog.getByRole('textbox', { name: 'Lobby address', exact: true })).toHaveValue('http://192.168.1.10:18743');
                await expect(submit).toBeEnabled();
                await expect(submit).toBeFocused();
            }
            expect(await page.evaluate(() => document.documentElement.dataset.sharingCalls)).toBe(outcome === 'success' ? '1' : '2');
            await close.press('Enter');
            await expect(dialog).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'Wi-Fi sharing', exact: true })).toBeFocused();
        });
    }
}
