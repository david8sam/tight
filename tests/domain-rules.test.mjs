import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from './helpers/game-rules.mjs';

const {
    Phase,
    StrategyCardIndex: Card,
    getFactionOrder,
    getFactionTurn,
    getNextFaction,
    buildStrategyCardOwners,
    strategyCardHasOwner,
    getStrategyCardOwner,
    calculateVictoryPoints,
} = rules;
const faction = (name, strategyCard = Card.NONE, fields = {}) => ({
    name,
    strategyCard,
    hasNaaluZeroToken: false,
    passed: false,
    ...fields,
});
const names = factions => factions.map(entry => entry.name);

test('initiative order puts all chosen cards before unchosen cards without changing seat order', () => {
    const factions = [
        faction('Imperial', Card.IMPERIAL),
        faction('Waiting A'),
        faction('Leadership', Card.LEADERSHIP),
        faction('Waiting B'),
        faction('Trade', Card.TRADE),
    ];
    const game = { factions };
    assert.deepEqual(names(getFactionOrder(game)), ['Leadership', 'Trade', 'Imperial', 'Waiting A', 'Waiting B']);
    assert.deepEqual(names(game.factions), ['Imperial', 'Waiting A', 'Leadership', 'Waiting B', 'Trade']);
    assert.deepEqual(names(getFactionOrder({ factions: factions.toReversed() })), [
        'Leadership',
        'Trade',
        'Imperial',
        'Waiting B',
        'Waiting A',
    ]);
});

test('Naalu zero token overrides initiative only when requested and follows its current holder', () => {
    const factions = [
        faction('The Naalu Collective', Card.IMPERIAL, { hasNaaluZeroToken: true }),
        faction('Leadership', Card.LEADERSHIP),
        faction('Trade', Card.TRADE),
    ];
    assert.deepEqual(names(getFactionOrder({ factions })), ['The Naalu Collective', 'Leadership', 'Trade']);
    assert.deepEqual(names(getFactionOrder({ factions }, false)), ['Leadership', 'Trade', 'The Naalu Collective']);
    factions[0].hasNaaluZeroToken = false;
    factions[2].hasNaaluZeroToken = true;
    assert.deepEqual(names(getFactionOrder({ factions })), ['Trade', 'Leadership', 'The Naalu Collective']);
});

for (const [base, alternate] of [
    [Card.DIPLOMACY, Card.DIPLOMACY_2],
    [Card.CONSTRUCTION, Card.CONSTRUCTION_2],
]) {
    test(`strategy card ${base} and alternate ${alternate} share ownership in both directions`, () => {
        for (const held of [base, alternate]) {
            const owners = buildStrategyCardOwners({ factions: [faction('Owner', held), faction('Waiting')] });
            assert.equal(owners[held], 'Owner');
            assert.deepEqual(getStrategyCardOwner(owners, base), { owner: 'Owner', card: held });
            assert.deepEqual(getStrategyCardOwner(owners, alternate), { owner: 'Owner', card: held });
            assert.equal(getStrategyCardOwner(owners, Card.TRADE), null);
            assert.equal(getStrategyCardOwner(owners, Card.NONE), null);
            assert.equal(strategyCardHasOwner(owners, base), true);
            assert.equal(strategyCardHasOwner(owners, alternate), true);
            assert.equal(strategyCardHasOwner(owners, Card.TRADE), false);
            assert.equal(strategyCardHasOwner(owners, Card.NONE), false);
        }
    });
}

test('ownership resolves an exact card first when a legacy save contains both family versions', () => {
    const owners = buildStrategyCardOwners({
        factions: [
            faction('Base owner', Card.CONSTRUCTION),
            faction('Expansion owner', Card.CONSTRUCTION_2),
            faction('Trade owner', Card.TRADE),
        ],
    });
    assert.deepEqual(getStrategyCardOwner(owners, Card.CONSTRUCTION), { owner: 'Base owner', card: Card.CONSTRUCTION });
    assert.deepEqual(getStrategyCardOwner(owners, Card.CONSTRUCTION_2), {
        owner: 'Expansion owner',
        card: Card.CONSTRUCTION_2,
    });
    assert.deepEqual(getStrategyCardOwner(owners, Card.TRADE), { owner: 'Trade owner', card: Card.TRADE });
    assert.equal(getStrategyCardOwner(owners, Card.NONE), null);
});

test('strategy turns follow speaker pick order and action turns follow assigned initiative', () => {
    const game = {
        factions: [faction('Seat A', Card.TRADE), faction('Speaker'), faction('Seat C')],
        status: { phase: Phase.STRATEGY, turn: Card.TRADE, pickOrder: ['Speaker', 'Seat C', 'Seat A'] },
    };
    assert.equal(getFactionTurn(game), 'Speaker');
    game.factions[1].strategyCard = Card.DIPLOMACY_2;
    assert.equal(getFactionTurn(game), 'Seat C');
    game.factions[2].strategyCard = Card.LEADERSHIP;
    assert.equal(getFactionTurn(game), 'END');
    game.status.phase = Phase.ACTION;
    game.status.turn = Card.DIPLOMACY_2;
    assert.equal(getFactionTurn(game), 'Speaker');
    game.status.turn = Card.END;
    assert.equal(getFactionTurn(game), 'END');
});

test('next faction skips passed players and ends the initiative pass after its last eligible faction', () => {
    const game = {
        factions: [
            faction('Leadership', Card.LEADERSHIP),
            faction('Diplomacy', Card.DIPLOMACY, { passed: true }),
            faction('Trade', Card.TRADE),
        ],
    };
    assert.equal(getNextFaction(game, 'Leadership')?.name, 'Trade');
    assert.equal(getNextFaction(game, 'Trade'), null);
    game.factions[2].passed = true;
    assert.equal(getNextFaction(game, 'Leadership'), null);
    game.factions[0].passed = true;
    assert.equal(getNextFaction(game, 'Leadership'), null);
    assert.equal(getNextFaction({ factions: [] }, ''), null);
});

test('objective toggles add and remove only their own score while manual points remain', () => {
    const player = {
        name: 'Scorer',
        publicObjectives: [false, false, false],
        victoryPoints: 2,
        secretObjectives: [
            { cleared: false, objective: { vp: 1 } },
            { cleared: true, objective: { vp: 2 } },
        ],
    };
    const game = {
        factions: [player],
        publicObjectives: [
            { id: 3, vp: 2 },
            { id: 1, vp: 1 },
        ],
    };
    assert.equal(calculateVictoryPoints(game, 'Scorer'), 4);
    player.publicObjectives[2] = true;
    assert.equal(calculateVictoryPoints(game, 'Scorer'), 6);
    player.publicObjectives[0] = true;
    assert.equal(calculateVictoryPoints(game, 'Scorer'), 7);
    player.secretObjectives[0].cleared = true;
    assert.equal(calculateVictoryPoints(game, 'Scorer'), 8);
    player.publicObjectives[2] = false;
    player.secretObjectives[1].cleared = false;
    assert.equal(calculateVictoryPoints(game, 'Scorer'), 4);
});
