import { Router } from 'express';

import initializeGameOperations from './game.js';
import initializeFactionOperations from './faction.js';
import initializeStrategyCardOperations from './strategy.js';
import initializePlanetOperations from './planet.js';

export default function initializeRouter() {
    const router = Router();
    initializeGameOperations(router);
    initializeFactionOperations(router);
    initializeStrategyCardOperations(router);
    initializePlanetOperations(router);
    return router;
}
