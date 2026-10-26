import { z } from 'zod';
import { savedGameNameSchema, SavedGameSummary } from 'common/savedGames.js';
import { savedGameSchema } from '../savedGameSchema.js';
import { Response, Router } from 'express';

import {
    GameCreateParams,
    GameCreateResult,
    GameDeleteParams,
    GameDeleteResult,
    GameListPlayersParams,
    GameListPlayersResult,
    GameRestartParams,
    GameRestartResult,
    GameValidateParams,
    GameValidateResult,
} from 'common/api.js';

import { createGame, getGame, restartGame, importGame, listSavedGames, organizeSavedGame } from '../database/game.js';

import { deleteGameAndNotify, markGameDirty } from '../dirty.js';
import { PostRequest, GetRequest } from './types.js';

import { gameCreateSchema, gameRestartSchema, gameDeleteSchema, gameQuerySchema } from '../commandSchemas.js';
import { parseRequest } from './validation.js';

const exportSchema = z
    .object({ format: z.literal('tight-game'), version: z.literal(1), game: savedGameSchema })
    .strict();

export default function initializeGameOperations(router: Router) {
    router.get('/game/list', (_req, res: Response<SavedGameSummary[]>) => {
        res.json(listSavedGames());
    });
    const renameSchema = gameQuerySchema.extend({ name: savedGameNameSchema }).strict();
    const archiveSchema = gameQuerySchema.extend({ archived: z.boolean() }).strict();
    router.post('/game/rename', (req, res) => {
        const parsed = parseRequest(renameSchema, req.body, res);
        if (!parsed.success) return;
        if (!organizeSavedGame(parsed.data.gameId, { name: parsed.data.name })) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        res.json({ saved: true });
    });
    router.post('/game/archive', (req, res) => {
        const parsed = parseRequest(archiveSchema, req.body, res);
        if (!parsed.success) return;
        if (!organizeSavedGame(parsed.data.gameId, { archived: parsed.data.archived })) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        res.json({ saved: true });
    });
    router.get('/game/export', (req, res) => {
        const parsed = parseRequest(gameQuerySchema, req.query, res);
        if (!parsed.success) return;
        const game = getGame(parsed.data.gameId);
        if (!game) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        res.attachment(`tight-${game.id}.json`).json({ format: 'tight-game', version: 1, game });
    });
    router.post('/game/import', (req, res) => {
        const parsed = parseRequest(exportSchema, req.body, res);
        if (!parsed.success) return;
        const game = parsed.data.game;
        if (getGame(game.id)) {
            res.status(409).json({ error: 'Game already exists' });
            return;
        }
        importGame(game);
        markGameDirty(game.id, { created: true });
        res.json(game.id);
    });
    router.post('/game/create', (req: PostRequest<GameCreateParams>, res: Response<GameCreateResult>): void => {
        const parsed = parseRequest(gameCreateSchema, req.body, res);
        if (!parsed.success) return;
        const game = createGame(parsed.data);
        markGameDirty(game.id, { created: true });
        res.status(200).json(game.id);
    });

    router.post(
        '/game/restart',
        (req: PostRequest<GameRestartParams>, res: Response<GameRestartResult | { error: string }>): void => {
            const parsed = parseRequest(gameRestartSchema, req.body, res);
            if (!parsed.success) return;
            const game = restartGame(parsed.data);
            if (game) {
                // respond with success
                res.status(200).json(game.id);

                // broadcast new game state to all clients
                markGameDirty(game.id, { created: true });
            } else {
                // respond with invalid params error
                res.status(404).json({ error: 'Game not found' });
            }
        },
    );

    router.post('/game/delete', (req: PostRequest<GameDeleteParams>, res: Response<GameDeleteResult>): void => {
        const parsed = parseRequest(gameDeleteSchema, req.body, res);
        if (!parsed.success) return;
        const response = deleteGameAndNotify(parsed.data.id);
        res.status(200).json(response);
    });

    router.get('/game/validate', (req: GetRequest<GameValidateParams>, res: Response<GameValidateResult>): void => {
        const parsed = parseRequest(gameQuerySchema, req.query, res);
        if (!parsed.success) return;
        const game = getGame(parsed.data.gameId);
        res.status(200).json(Boolean(game));
    });

    router.get(
        '/game/list-players',
        (req: GetRequest<GameListPlayersParams>, res: Response<GameListPlayersResult>): void => {
            const parsed = parseRequest(gameQuerySchema, req.query, res);
            if (!parsed.success) return;
            const game = getGame(parsed.data.gameId);
            const players = game ? Object.keys(game.players) : [];
            res.status(200).json(players);
        },
    );
}
