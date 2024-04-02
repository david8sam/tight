import { Response, Router } from 'express';

import { NoParams, StrategyCardListResults } from 'common/api.js';
import { StrategyCard } from 'common/Game.js';

import { listCards } from '../database/strategy.js';

import { GetRequest } from './types.js';

export default function initializeStrategyCardOperations(router: Router) {
    router.get('/strategy-card/list', (req: GetRequest<NoParams>, res: Response<StrategyCardListResults>): void => {
        const cards = listCards();
        res.status(200).json(cards as StrategyCard[]);
    });
}
