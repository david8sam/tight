import { StrategyCardsType, Version } from 'common/Game';

const _strategyCards: Readonly<StrategyCardsType> = [
    {
        name: 'Leadership',
        initiative: 1,
        primary: [
            'Gain 3 command tokens.',
            'Spend any amount of influence to gain 1 command token for every 3 influence spent.',
        ],
        secondary: ['Spend any amount of influence to gain 1 command token for every 3 influence spent.'],
        version: Version.TI4,
    },
    {
        name: 'Diplomacy',
        initiative: 2,
        primary: [
            'Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system.  Then, ready each exhausted planet you control in that system.',
        ],
        secondary: ['Spend 1 token from your strategy pool to ready up to 2 exhausted planets.'],
        notes: ['Primary only allows readying planets from the CHOSEN system.'],
        version: Version.TI4,
    },
    {
        name: 'Diplomacy II',
        initiative: 2.1,
        primary: [
            'Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system. Then, ready up to 2 exhausted planets you control.',
        ],
        secondary: ['Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control.'],
        notes: ['Primary allows readying ANY 2 planets.'],
        version: Version.TI4_1,
    },
    {
        name: 'Politics',
        initiative: 3,
        primary: [
            'Choose a player other than the speaker.  That player gains the speaker token.',
            'Draw 2 action cards.',
            'Look at the top 2 cards of the agenda deck.  Place each card on the top or bottom of the deck in any order.',
        ],
        secondary: ['Spend 1 token from your strategy pool to draw 2 action cards.'],
        version: Version.TI4,
    },
    {
        name: 'Construction',
        initiative: 4,
        primary: ['Place 1 PDS or 1 space dock on a planet you control.', 'Place 1 PDS on a planet you control.'],
        secondary: [
            'Place 1 token from your strategy pool in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system.',
        ],
        notes: ['Same as Contruction II, but shittier wording.'],
        version: Version.TI4,
    },
    {
        name: 'Construction II',
        initiative: 4.1,
        primary: ['Place 1 PDS or 1 space dock on a planet you control.', 'Place 1 PDS on a planet you control.'],
        secondary: [
            'Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system',
        ],
        notes: ['Same as Contruction, but better wording.'],
        version: Version.TI4_1,
    },
    {
        name: 'Trade',
        initiative: 5,
        primary: [
            'Gain 3 trade goods.',
            'Replenish commodities.',
            'Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token.',
        ],
        secondary: ['Spend 1 token from your strategy pool to replenish your commodities.'],
        version: Version.TI4,
    },
    {
        name: 'Warfare',
        initiative: 6,
        primary: [
            'Remove 1 of your command tokens from the game board; then, gain 1 command token.',
            'Redistribute any number of the command tokens on your command sheet.',
        ],
        secondary: [
            'Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system.',
        ],
        version: Version.TI4,
    },
    {
        name: 'Technology',
        initiative: 7,
        primary: ['Research 1 technology.', 'Spend 6 resources to research 1 technology.'],
        secondary: ['Spend 1 token from your strategy pool and 4 resources to research 1 technology.'],
        version: Version.TI4,
    },
    {
        name: 'Imperial',
        initiative: 8,
        primary: [
            'Immediately score 1 public objective if you fulfill its requirements.',
            'Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective.',
        ],
        secondary: ['Spend 1 token from your strategy pool to draw 1 secret objective.'],
        version: Version.TI4,
    },
];

export function listCards() {
    return _strategyCards;
}
