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

import { createGame, deleteGame, getGame, restartGame } from '../database/game.js';

import { markGameDirty } from '../dirty.js';
import { PostRequest, GetRequest } from './types.js';

export default function initializeGameOperations(router: Router) {
    router.post('/game/create', (req: PostRequest<GameCreateParams>, res: Response<GameCreateResult>): void => {
        const game = createGame(req.body);
        res.status(200).json(game.id);
    });

    router.post('/game/restart', (req: PostRequest<GameRestartParams>, res: Response<GameRestartResult>): void => {
        const game = restartGame(req.body);
        if (game) {
            // respond with success
            res.status(200).json(game.id);

            // broadcast new game state to all clients
            markGameDirty(game.id, { created: true });
        } else {
            // respond with invalid params error
            res.status(422).send();
        }
    });

    router.post('/game/delete', (req: PostRequest<GameDeleteParams>, res: Response<GameDeleteResult>): void => {
        const response = deleteGame(req.body.id);
        res.status(200).json(response);
    });

    router.get('/game/validate', (req: GetRequest<GameValidateParams>, res: Response<GameValidateResult>): void => {
        const game = getGame(req.query.gameId);
        res.status(200).json(Boolean(game));
    });

    router.get(
        '/game/list-players',
        (req: GetRequest<GameListPlayersParams>, res: Response<GameListPlayersResult>): void => {
            const game = getGame(req.query.gameId);
            const players = game ? Object.keys(game.players) : [];
            res.status(200).json(players);
        },
    );
}
