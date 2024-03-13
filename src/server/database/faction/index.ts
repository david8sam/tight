import FactionsTI4Base from './TI4.js';
import FactionsTI4ProphecyOfKings from './TI4ProphecyOfKings.js';

const _factions = [...FactionsTI4Base, ...FactionsTI4ProphecyOfKings] as const;

const _factionNames: readonly string[] = _factions.map(f => f.name);

export function listFactions() {
    return _factions;
}

export function listFactionNames() {
    return _factionNames;
}

export function getFaction(name: string) {
    const faction = _factions.find(f => f.name === name);
    return faction || null;
}
