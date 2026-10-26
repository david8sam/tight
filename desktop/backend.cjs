const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { errorCode } = require('./diagnostics.cjs');

(async () => {
    const { startBackend, defaultDataDirectory } = await import(
        pathToFileURL(path.join(__dirname, '../build/desktop-backend.js')).href
    );
    const backend = await startBackend({
        port: 0,
        host: '127.0.0.1',
        dataDirectory: defaultDataDirectory(),
        onStorageWriteError: error =>
            process.parentPort.postMessage({ type: 'diagnostic', event: 'storage.write-failed', code: errorCode(error) }),
    });
    process.parentPort.on('message', async event => {
        const message = event.data;
        if (
            message?.type === 'hosting' &&
            Number.isSafeInteger(message.id) &&
            message.id > 0 &&
            typeof message.change === 'boolean'
        ) {
            try {
                if (message.address !== null && (typeof message.address !== 'string' || message.address.length > 64))
                    throw new Error('Invalid network selection.');
                const value = message.change ? await backend.setLanHost(message.address) : backend.getHosting();
                process.parentPort.postMessage({ type: 'hosting', id: message.id, value });
            } catch (error) {
                const detail =
                    error?.code === 'EADDRINUSE'
                        ? 'That network port is already in use. Choose another network or restart TIGHT.'
                        : error instanceof Error
                          ? error.message
                          : 'Could not change Wi-Fi sharing.';
                process.parentPort.postMessage({
                    type: 'hosting',
                    id: message.id,
                    error: detail,
                    code: errorCode(error),
                });
            }
        }
        if (message?.type === 'diagnostics' && Number.isSafeInteger(message.id) && message.id > 0) {
            try {
                process.parentPort.postMessage({
                    type: 'diagnostics',
                    id: message.id,
                    value: {
                        ...backend.getDiagnostics(),
                        sharing: backend.getHosting().mode,
                        adapters: backend.getHosting().interfaces.length,
                    },
                });
            } catch {
                process.parentPort.postMessage({
                    type: 'diagnostics',
                    id: message.id,
                    error: 'Could not read host status.',
                });
            }
        }
        if (message?.type === 'stop') {
            try {
                await backend.stop();
                process.exit(0);
            } catch (error) {
                console.error('Could not stop backend', error);
                process.exit(1);
            }
        }
    });
    process.parentPort.postMessage({
        type: 'ready',
        protocolVersion: 2,
        origin: backend.origin,
        hostToken: backend.hostToken,
    });
})().catch(error => {
    process.parentPort.postMessage({ type: 'diagnostic', event: 'backend.start-failed', code: errorCode(error) });
    console.error('Could not start backend', error);
    process.exit(1);
});
