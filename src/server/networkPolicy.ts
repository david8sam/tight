import { IncomingMessage } from 'node:http';
import { isIP } from 'node:net';
import { networkInterfaces } from 'node:os';

export type NetworkRejection = { status: 403 | 421 | 503; message: string };
export type VerifyNetworkRequest = (request: IncomingMessage) => NetworkRejection | null;

export function trustedHostnames(bindHost?: string): string[] {
    const loopback = ['localhost', '127.0.0.1', '::1'];
    if (bindHost && bindHost !== '0.0.0.0' && bindHost !== '::') {
        if ((isIP(bindHost) === 0 && bindHost.toLowerCase() !== 'localhost') || bindHost.includes('%')) {
            throw new Error('TIGHT_HOST must be an IP address or localhost');
        }
        return [...new Set([...loopback, bindHost.toLowerCase()])];
    }
    const addresses = Object.values(networkInterfaces())
        .flatMap(values => values || [])
        .map(value => value.address)
        .filter(address => isIP(address) !== 0 && !address.includes('%'));
    return [...new Set([...loopback, ...addresses])];
}

export function createNetworkPolicy(options: {
    hostnames: string[];
    port: number;
    protocol: 'http' | 'https';
}): VerifyNetworkRequest {
    const authorities = new Map<string, string>();
    for (const hostname of options.hostnames) {
        const host = hostname.includes(':') ? `[${hostname}]` : hostname;
        const authority = `${host}:${options.port}`;
        const url = new URL(`${options.protocol}://${authority}`);
        authorities.set(authority.toLowerCase(), url.origin);
        authorities.set(url.host.toLowerCase(), url.origin);
    }
    return request => {
        const counts = { host: 0, origin: 0 };
        for (let index = 0; index < request.rawHeaders.length; index += 2) {
            const name = request.rawHeaders[index].toLowerCase();
            if (name === 'host' || name === 'origin') counts[name] += 1;
        }
        const host = request.headers.host;
        const origin = request.headers.origin;
        if (counts.host !== 1 || typeof host !== 'string' || !authorities.has(host.toLowerCase())) {
            return { status: 421, message: 'Unexpected host address' };
        }
        if (counts.origin > 1 || (origin !== undefined && origin !== authorities.get(host.toLowerCase()))) {
            return { status: 403, message: 'Cross-origin requests are not allowed' };
        }
        return null;
    };
}
