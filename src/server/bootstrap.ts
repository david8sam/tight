export { GameStore } from './database/GameStore.js';
import { requestLimiter } from './trafficLimits.js';
import { Hosting } from 'common/hosting.js';
import { lanInterfaces } from './lanInterfaces.js';
import { AccessSessions } from './accessSessions.js';
import { sessionRouter, authorizeHttp } from './rest-api/session.js';
import express, { NextFunction, Request, Response } from 'express';
import http, { type Server as HttpServer } from 'http';
import https, { type Server as HttpsServer } from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

import { dataDirectory as defaultDataDirectory, StorageError } from './database/GameStore.js';
import initializeWebSocketServer from './WebSocketServer.js';
import { cert, key } from './certs.js';
import initializeRouter from './rest-api/router.js';
import { createNetworkPolicy, trustedHostnames, VerifyNetworkRequest } from './networkPolicy.js';
import { setDirty } from './dirty.js';
import { initializeGameStorage, closeGameStorage } from './database/game.js';
export { defaultDataDirectory };

export interface BackendOptions {
    port: number;
    host?: string;
    dataDirectory: string;
    hostToken?: string;
    onStorageWriteError?: (error: unknown) => void;
}

export async function startBackend(options: BackendOptions) {
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535)
        throw new Error('Invalid server port');
    const hostnames = trustedHostnames(options.host);
    const sessions = new AccessSessions(options.hostToken);
    initializeGameStorage(options.dataDirectory, options.onStorageWriteError);
    setDirty(false);
    try {
        const dirname = path.dirname(fileURLToPath(import.meta.url));

        let verifyRequest: VerifyNetworkRequest = () => ({ status: 503, message: 'Host is starting' });
        const app = express();
        app.use((req: Request, res: Response, next: NextFunction) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
            res.setHeader('Referrer-Policy', 'no-referrer');
            const rejection = verifyRequest(req);
            if (rejection) res.status(rejection.status).json({ error: rejection.message });
            else next();
        });
        app.use(requestLimiter());
        let port = options.port;
        const distDir = path.join(dirname, '../dist');
        const html = path.join(distDir, 'index.html');

        const publicPath = express.static(distDir, {
            setHeaders: (res, filename) => {
                if (/\.[a-f0-9]{20}(?:\.chunk)?\.js$/.test(filename)) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            },
        });
        app.use(publicPath);
        app.use('/api', authorizeHttp(sessions));
        app.use('/api/game/import', express.json({ limit: '1mb' }));
        app.use(express.json({ limit: '64kb' }));
        app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 100 }));

        app.use('/api', sessionRouter(sessions, gameId => sockets.getGameConnections(gameId)));
        app.use('/api', initializeRouter());
        app.use('/api', (_req: Request, res: Response) => {
            res.status(404).json({ error: 'API operation not found' });
        });

        app.get('*', (req: Request, res: Response) => {
            res.sendFile(html);
        });

        app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
            if (res.headersSent) {
                next(error);
                return;
            }
            const parserType = typeof error === 'object' && error !== null && 'type' in error ? error.type : null;
            if (error instanceof StorageError) {
                console.error('Game storage failed', error.cause);
                res.status(503).json({ error: 'Could not save game. Try again after checking host storage.' });
            } else if (parserType === 'entity.too.large') {
                res.status(413).json({ error: 'Request too large' });
            } else if (parserType === 'entity.parse.failed') {
                res.status(400).json({ error: 'Invalid JSON body' });
            } else {
                console.error('Unhandled request error', error instanceof Error ? error.stack : 'Unknown error');
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        let protocol: 'http' | 'https' = 'http';
        let server: HttpServer | HttpsServer;
        if (key && cert) {
            server = https.createServer({ key, cert }, app);
            protocol = 'https';
            if (port === 80) {
                port = 443;
            }
        } else {
            server = http.createServer(app);
        }

        const limitListener = (listener: HttpServer | HttpsServer) => {
            listener.maxConnections = 256;
            listener.headersTimeout = 10000;
            listener.requestTimeout = 15000;
            listener.keepAliveTimeout = 5000;
            listener.maxRequestsPerSocket = 1000;
        };
        limitListener(server);
        const sockets = initializeWebSocketServer(server, request => verifyRequest(request), sessions);
        let lan: { address: string; server: HttpServer | HttpsServer } | null = null;
        let stopping = false;
        let changes = Promise.resolve();
        const closeListener = (listener: HttpServer | HttpsServer) =>
            new Promise<void>((resolve, reject) => {
                if (!listener.listening) {
                    resolve();
                    return;
                }
                listener.close(error => (error ? reject(error) : resolve()));
                listener.closeAllConnections();
            });
        let stopPromise: Promise<void> | undefined;
        const stop = () => {
            stopping = true;
            return (stopPromise ??= (async () => {
                await changes;
                if (lan) {
                    sockets.detach(lan.server);
                    await closeListener(lan.server);
                    lan = null;
                }
                await sockets.stop();
                await closeListener(server);
                setDirty(false);
                closeGameStorage();
            })());
        };
        try {
            await new Promise<void>((resolve, reject) => {
                server.once('error', reject);
                server.listen(port, options.host, () => {
                    server.off('error', reject);
                    resolve();
                });
            });
        } catch (error) {
            await sockets.stop();
            throw error;
        }
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected TCP server address');
        const refreshPolicy = () => {
            verifyRequest = createNetworkPolicy({
                hostnames: [...hostnames, ...(lan ? [lan.address] : [])],
                protocol,
                port: address.port,
            });
        };
        refreshPolicy();
        const getHosting = (): Hosting => {
            const base = { port: address.port, interfaces: lanInterfaces() };
            return lan ? { ...base, mode: 'lan', address: lan.address } : { ...base, mode: 'local' };
        };
        const setLanHost = (selected: string | null): Promise<Hosting> => {
            const operation = changes.then(async () => {
                if (stopping) throw new Error('The host is stopping.');
                if (options.host !== '127.0.0.1')
                    throw new Error('Managed Wi-Fi sharing requires the desktop loopback listener.');
                if (selected !== null && !lanInterfaces().some(adapter => adapter.address === selected))
                    throw new Error('That private network is no longer available. Refresh the network list.');
                if ((lan?.address || null) === selected) return getHosting();
                let replacement: typeof lan = null;
                if (selected !== null) {
                    const listener = key && cert ? https.createServer({ key, cert }, app) : http.createServer(app);
                    limitListener(listener);
                    sockets.attach(listener);
                    try {
                        await new Promise<void>((resolve, reject) => {
                            listener.once('error', reject);
                            listener.listen(address.port, selected, () => {
                                listener.off('error', reject);
                                resolve();
                            });
                        });
                        listener.on('error', error => console.error('Wi-Fi listener failed', error));
                        replacement = { address: selected, server: listener };
                    } catch (error) {
                        sockets.detach(listener);
                        await closeListener(listener);
                        throw error;
                    }
                }
                const previous = lan;
                lan = replacement;
                refreshPolicy();
                if (previous) {
                    sockets.detach(previous.server);
                    await closeListener(previous.server);
                }
                return getHosting();
            });
            changes = operation.then(
                () => {},
                () => {},
            );
            return operation;
        };
        const originHost =
            options.host && options.host !== '0.0.0.0' && options.host !== '::' ? options.host : '127.0.0.1';
        const authority = originHost.includes(':') ? `[${originHost}]` : originHost;
        return {
            origin: `${protocol}://${authority}:${address.port}`,
            port: address.port,
            stop,
            getHosting,
            getDiagnostics: () => ({
                storage: stopping ? 'closed' as const : 'open' as const,
                ...sockets.getConnections(),
            }),
            setLanHost,
            hostToken: sessions.hostToken,
            hostClaimToken: sessions.hostClaimToken,
        };
    } catch (error) {
        closeGameStorage();
        throw error;
    }
}
