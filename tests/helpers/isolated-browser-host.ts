import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test as base } from '@playwright/test';
import { z } from 'zod';

/** Burst journeys own a real backend and its unchanged request allowances. */
export const test = base.extend({
    baseURL: async ({}, use) => {
        const directory = await mkdtemp(path.join(tmpdir(), 'tight-isolated-browser-'));
        const child = fork(new URL('../browser/start-host.mjs', import.meta.url), [], {
            execArgv: [],
            env: { ...process.env, TIGHT_USE_HTTP: 'true', PORT: '0', TIGHT_DATA_DIR: directory },
            stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
        });
        let errors = '';
        child.stderr?.on('data', chunk => { errors = (errors + String(chunk)).slice(-4000); });
        try {
            const origin = await new Promise<string>((resolve, reject) => {
                const timer = setTimeout(() => finish(new Error(`Isolated host readiness timed out: ${errors}`)), 10000);
                const exited = () => finish(new Error(`Isolated host exited before readiness: ${errors}`));
                const failed = (error: Error) => finish(error);
                const ready = (message: unknown) => {
                    const result = z.object({ origin: z.url() }).safeParse(message);
                    if (result.success) finish(null, result.data.origin);
                    else finish(new Error('Invalid isolated host readiness message'));
                };
                function finish(error: Error | null, value?: string) {
                    clearTimeout(timer);
                    child.off('message', ready);
                    child.off('exit', exited);
                    child.off('error', failed);
                    if (error) reject(error);
                    else if (value) resolve(value);
                }
                child.once('message', ready);
                child.once('exit', exited);
                child.once('error', failed);
            });
            await use(origin);
        } finally {
            if (child.pid && child.exitCode === null && child.signalCode === null) {
                const stopped = once(child, 'exit');
                const force = setTimeout(() => child.kill('SIGKILL'), 5000);
                child.kill('SIGTERM');
                try { await stopped; } finally { clearTimeout(force); }
            }
            await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        }
    },
});
