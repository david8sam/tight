import { Faction } from 'common/Faction.js';

import FactionsTI4Base from './TI4.js';
import FactionsTI4ProphecyOfKings from './TI4ProphecyOfKings.js';

const _factions = [...FactionsTI4Base, ...FactionsTI4ProphecyOfKings] as const;

const _factionNames: readonly string[] = _factions.map(f => f.name);

const _factionsMap = _factions.reduce((a, f) => {
    a[f.name] = f;
    return a;
}, {} as Record<string, Faction>);

export function listFactions() {
    return _factions;
}

export function listFactionNames() {
    return _factionNames;
}

export function getFaction(name: string) {
    const faction = _factionsMap[name];
    return faction || null;
}
