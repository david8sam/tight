import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { guestSessionSchema } from 'common/session.js';
import { GameConnections } from 'common/gameConnections.js';
import { getGame } from '../database/game.js';
import { AccessSessions, mayReadGame, SESSION_COOKIE } from '../accessSessions.js';
import { gameQuerySchema } from '../commandSchemas.js';
import { parseRequest } from './validation.js';

const claimSchema = z.object({ token: z.string().max(128) }).strict();
function setCookie(req: Request, res: Response, token: string) {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: req.secure,
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000,
    });
}

export function sessionRouter(sessions: AccessSessions, connections: (gameId: string) => GameConnections) {
    const router = Router();
    router.use('/session', (_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        next();
    });
    router.get('/session', (req, res) => res.json(sessions.resolve(sessions.token(req))));
    router.get('/session/connections', (req, res) => {
        if (sessions.resolve(sessions.token(req)).role !== 'host') {
            res.status(403).json({ error: 'Only the host can view connected devices.' });
            return;
        }
        const parsed = parseRequest(gameQuerySchema, req.query, res);
        if (!parsed.success) return;
        if (!getGame(parsed.data.gameId)) {
            res.status(404).json({ error: 'Game not found.' });
            return;
        }
        res.json(connections(parsed.data.gameId));
    });
    router.post('/session/host', (req, res) => {
        const parsed = parseRequest(claimSchema, req.body, res);
        if (!parsed.success) return;
        const token = sessions.claimHost(parsed.data.token, sessions.token(req));
        if (!token) {
            res.status(403).json({ error: 'This host link is invalid or has already been used.' });
            return;
        }
        setCookie(req, res, token);
        res.json({ role: 'host' });
    });
    router.post('/session/invite', (req, res) => {
        if (sessions.resolve(sessions.token(req)).role !== 'host') {
            res.status(403).json({ error: 'Only the host can pair a device.' });
            return;
        }
        const parsed = parseRequest(guestSessionSchema, req.body, res);
        if (!parsed.success) return;
        const invite = sessions.invite(parsed.data);
        if (!invite) {
            res.status(409).json({ error: 'Could not create an invitation. Check the game and try again.' });
            return;
        }
        res.json(invite);
    });
    router.post('/session/revoke', (req, res) => {
        if (sessions.resolve(sessions.token(req)).role !== 'host') {
            res.status(403).json({ error: 'Only the host can revoke access.' });
            return;
        }
        const parsed = parseRequest(gameQuerySchema, req.body, res);
        if (!parsed.success) return;
        sessions.revoke(parsed.data.gameId);
        res.json({ revoked: true });
    });
    router.post('/session/claim', (req, res) => {
        const parsed = parseRequest(claimSchema, req.body, res);
        if (!parsed.success) return;
        const claimed = sessions.claimInvite(parsed.data.token, sessions.token(req));
        if (!claimed) {
            res.status(403).json({
                error: 'This invitation expired or has already been used. Ask the host for a new one.',
            });
            return;
        }
        setCookie(req, res, claimed.token);
        res.json(claimed.session);
    });
    return router;
}

export function authorizeHttp(sessions: AccessSessions) {
    return (req: Request, res: Response, next: NextFunction) => {
        const pathname = req.path.toLowerCase();
        if (!pathname.startsWith('/game/')) {
            next();
            return;
        }
        const session = sessions.resolve(sessions.token(req));
        if (session.role === 'host') {
            next();
            return;
        }
        if (
            req.method === 'GET' &&
            (pathname === '/game/validate' || pathname === '/game/list-players') &&
            typeof req.query.gameId === 'string' &&
            mayReadGame(session, req.query.gameId)
        ) {
            next();
            return;
        }
        res.status(session.role === 'unpaired' ? 401 : 403).json({ error: 'This operation requires host permission.' });
    };
}
