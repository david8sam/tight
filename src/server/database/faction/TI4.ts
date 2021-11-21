import { Faction } from 'common/Faction';

const Factions: Readonly<Faction[]> = [
    {
        name: 'The Arborec',
        abilities: [
            {
                name: 'Mitosis',
                description:
                    'Your space docks cannot produce infantry.  At the start of the status phase , place 1 infantry from your reinforcements on any planet you control.',
            },
        ],
        promissoryNote: {
            name: 'Stymie',
            description:
                "ACTION: Place this card face up in your play area. While this card is in your play area, the Arborec player cannot produce units in or adjacent to non-home systems that contain 1 or more of your units. If you activate a system that contains 1 or more of the Arborec player's units, return this card to the Arborec player.",
        },
        factionTech: [
            {
                name: 'Bioplasmosis',
                description:
                    'At the end of the status phase , you may remove any number of infantry from planets you control and place them on 1 or more planets you control in the same or adjacent systems.',
                requirements: {
                    biotic: 2,
                },
            },
        ],
        startingUnits: {
            carrier: 1,
            cruiser: 1,
            fighter: 2,
            infantry: 4,
            spaceDock: 1,
            pds: 1,
        },
        startingTech: ['Magen Defense Grid'],
        commodities: 3,
        flagship: {
            name: 'Duha Menaimon',
            cost: 8,
            combat: [7, 2],
            move: 1,
            capacity: 5,
            abilities: [
                'Sustain Damage',
                'After you activate this system, you may produce up to 5 units in this system.',
            ],
        },
    },

    //
    // TODO:
    // - Fill in faction details
    //
    {
        name: 'The Barony of Letnev',
        abilities: [
            {
                name: 'Munitions Reserves',
                description:
                    'At the start of each round of space combat, you may spend 2 trade goods;  you may re-roll any number of your dice during that combat round.',
            },
        ],
    },
    {
        name: 'The Clan of Saar',
    },
    {
        name: 'The Embers of Muaat',
    },
    {
        name: 'The Emirates of Hacan',
    },
    {
        name: 'The Federation of Sol',
    },
    {
        name: 'The Ghosts of Creuss',
    },
    {
        name: 'The L1Z1X Mindnet',
    },
    {
        name: 'The Mentak Coalition',
    },
    {
        name: 'The Naalu Collective',
    },
    {
        name: 'The Nekro Virus',
    },
    {
        name: "The Sardakk N'orr",
    },
    {
        name: 'The Universities of Jol-Nar',
    },
    {
        name: 'The Winnu',
    },
    {
        name: 'The Xxcha Kingdom',
    },
    {
        name: 'The Yin Brotherhood',
    },
    {
        name: 'The Yssaril Tribes',
    },
];

export default Factions;
