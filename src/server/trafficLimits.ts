import type { IncomingMessage } from 'node:http';
import type { RequestHandler } from 'express';

/** Token buckets expire only when full, so reconnecting cannot reset a depleted peer's allowance. */
export class RateLimit {
    private readonly peers = new Map<string, { tokens: number; updated: number }>();
    constructor(
        private readonly capacity: number,
        private readonly refillPerSecond: number,
        private readonly maxPeers: number,
        private readonly now: () => number = () => performance.now(),
    ) {}

    /** Zero means accepted; otherwise return the whole seconds until another attempt is allowed. */
    consume(peer: string, cost = 1): number {
        const now = this.now();
        let bucket = this.peers.get(peer);
        if (!bucket) {
            for (const [key, value] of this.peers) {
                if (now - value.updated >= (this.capacity / this.refillPerSecond) * 1000) this.peers.delete(key);
            }
            if (this.peers.size >= this.maxPeers) return Math.ceil(this.capacity / this.refillPerSecond);
            bucket = { tokens: this.capacity, updated: now };
            this.peers.set(peer, bucket);
        }
        bucket.tokens = Math.min(
            this.capacity,
            bucket.tokens + (Math.max(0, now - bucket.updated) / 1000) * this.refillPerSecond,
        );
        bucket.updated = Math.max(now, bucket.updated);
        if (bucket.tokens < cost) return Math.ceil((cost - bucket.tokens) / this.refillPerSecond);
        bucket.tokens -= cost;
        return 0;
    }
}

export function peerAddress(request: IncomingMessage): string {
    // A browser-provided Forwarded/X-Forwarded-For header must never select the allowance.
    return (request.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
}

export function requestLimiter(): RequestHandler {
    const apiRequests = new RateLimit(120, 10, 256);
    const pageRequests = new RateLimit(120, 10, 256);
    const claims = new RateLimit(30, 0.5, 256);
    return (req, res, next) => {
        const peer = peerAddress(req);
        // Loading pages and chunks must not spend the allowance for game/session operations.
        const requests = /^\/api(?:\/|$)/i.test(req.path) ? apiRequests : pageRequests;
        const wait =
            requests.consume(peer) ||
            (req.method === 'POST' && /^\/api\/session\/(claim|host)\/?$/i.test(req.path) ? claims.consume(peer) : 0);
        if (wait) {
            res.setHeader('Retry-After', String(wait));
            res.setHeader('Cache-Control', 'no-store');
            res.status(429).json({ error: 'Too many requests from this device. Wait a moment and try again.' });
        } else next();
    };
}
