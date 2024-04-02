import { Response, Router } from 'express';

import {
    FactionGetParams,
    FactionGetResults,
    FactionListNamesResults,
    FactionListResults,
    NoParams,
} from 'common/api.js';
import { Faction } from 'common/Faction.js';

import { getFaction, listFactionNames, listFactions } from '../database/faction/index.js';

import { GetRequest } from './types.js';

export default function initializeFactionOperations(router: Router) {
    router.get('/faction/list', (req: GetRequest<NoParams>, res: Response<FactionListResults>): void => {
        const factions = listFactions();
        res.status(200).json(factions as Faction[]);
    });

    router.get('/faction/list-names', (req: GetRequest<NoParams>, res: Response<FactionListNamesResults>): void => {
        const names = listFactionNames();
        res.status(200).json(names as string[]);
    });

    router.get('/faction/get-faction', (req: GetRequest<FactionGetParams>, res: Response<FactionGetResults>): void => {
        const names = req.query.name.split(',');
        const factions: Faction[] = [];
        names.forEach(n => {
            const faction = getFaction(n);
            if (faction) {
                factions.push(faction);
            }
        });

        res.status(200).json(factions);
    });
}
