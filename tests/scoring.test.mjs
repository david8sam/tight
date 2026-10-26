import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from './helpers/game-rules.mjs';

const { calculateVictoryPoints } = rules;

test('objective scores follow stable IDs after deletion/reordering, not array positions', () => {
    const game = {
        publicObjectives: [
            { id: 3, description: '', vp: 2 },
            { id: 1, description: '', vp: 1 },
        ],
        factions: [
            {
                name: 'The Arborec',
                publicObjectives: [false, true, true],
                secretObjectives: [{ cleared: true, objective: { vp: 1 } }],
                victoryPoints: 2,
            },
        ],
    };
    // Removed objective ID 2 is still checked in the old flags but earns no points.
    assert.equal(calculateVictoryPoints(game, 'The Arborec'), 5);
});
