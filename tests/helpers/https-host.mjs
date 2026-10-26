import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export async function startHttpsHost() {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight HTTPS # 测试-'));
    const certificate = path.join(directory, 'localhost # certificate.pem');
    const key = path.join(directory, 'localhost # key.pem');
    await copyFile(new URL('../fixtures/tls/localhost-cert.pem', import.meta.url), certificate);
    await copyFile(new URL('../fixtures/tls/localhost-key.pem', import.meta.url), key);
    const server = spawn(process.execPath, ['build/server.js'], {
        cwd: new URL('../../', import.meta.url),
        env: {
            ...process.env,
            TIGHT_USE_HTTP: 'false',
            TIGHT_HOST: '127.0.0.1',
            TIGHT_DATA_DIR: directory,
            PORT: '0',
            SSL_TIGHT_KEY_PATH: key,
            SSL_TIGHT_CRT_PATH: certificate,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    const stop = async () => {
        if (server.exitCode === null && server.signalCode === null) {
            const stopped = once(server, 'exit');
            server.kill('SIGTERM');
            await stopped;
        }
        await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    };
    try {
        const claimUrl = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => finish(new Error(`HTTPS host readiness timeout: ${logs}`)), 10000);
            const exited = code => finish(new Error(`HTTPS host exited ${code}: ${logs}`));
            const failed = error => finish(error);
            const output = chunk => {
                logs += chunk;
                const match = logs.match(/Host access: (https:\/\/127\.0\.0\.1:\d+\/#host=[A-Za-z0-9_-]{43})/);
                if (match) finish(null, match[1]);
            };
            function finish(error, value) {
                clearTimeout(timeout);
                server.off('exit', exited);
                server.off('error', failed);
                server.stdout.off('data', output);
                server.stderr.off('data', output);
                if (error) reject(error);
                else resolve(value);
            }
            server.once('exit', exited);
            server.once('error', failed);
            server.stdout.on('data', output);
            server.stderr.on('data', output);
        });
        return { origin: new URL(claimUrl).origin, claimUrl, certificate, stop };
    } catch (error) {
        await stop();
        throw error;
    }
}
