import chalk from 'chalk';
import { networkInterfaces } from 'node:os';
import { startBackend, defaultDataDirectory } from './bootstrap.js';

try {
    const backend = await startBackend({
        port: process.env.PORT === undefined ? 80 : Number(process.env.PORT),
        host: process.env.TIGHT_HOST,
        dataDirectory: defaultDataDirectory(),
    });
    console.log(`Host access: ${backend.origin}/#host=${backend.hostClaimToken}`);
    const protocol = new URL(backend.origin).protocol;
    const bindHost = process.env.TIGHT_HOST;
    const localAddress = Object.values(networkInterfaces())
        .flatMap(values => values || [])
        .find(value => value.family === 'IPv4' && !value.internal)?.address || '127.0.0.1';
    const address =
        bindHost && bindHost !== '0.0.0.0' && bindHost !== '::'
            ? backend.origin
            : `${protocol}//${localAddress}:${backend.port}/`;
    console.log(`Server listening on port: ${backend.port}`);
    console.log(`Server running on: ${chalk.cyanBright(address)}`);
    const shutdown = () => {
        void backend.stop().then(
            () => process.exit(0),
            error => {
                console.error(error);
                process.exit(1);
            },
        );
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
} catch (error) {
    console.error('Could not start TIGHT backend', error);
    process.exitCode = 1;
}
