import { Planet, Traits } from 'common/Planet';

const Planets: readonly Planet[] = [
    //
    // Home planets
    //
    {
        name: 'Valk',
        home: 'The Argent Flight',
        resources: 2,
        influence: 0,
    },
    {
        name: 'Avar',
        home: 'The Argent Flight',
        resources: 1,
        influence: 1,
    },
    {
        name: 'Ylir',
        home: 'The Argent Flight',
        resources: 0,
        influence: 2,
    },
    {
        name: 'The Dark',
        home: 'The Empyrean',
        resources: 3,
        influence: 4,
    },
    {
        name: 'Ixth',
        home: 'The Mahact Gene Sorcerers',
        resources: 3,
        influence: 5,
    },
    {
        name: 'Naazir',
        home: 'The Naaz-Rokha Alliance',
        resources: 2,
        influence: 1,
    },
    {
        name: 'Rokha',
        home: 'The Naaz-Rokha Alliance',
        resources: 1,
        influence: 2,
    },
    {
        name: 'Arcturus',
        home: 'The Nomad',
        resources: 4,
        influence: 4,
    },
    {
        name: 'Elysium',
        home: 'The Titans of UI',
        resources: 4,
        influence: 1,
    },
    {
        name: 'Acheron',
        home: "The Vuil'Raith Cabal",
        resources: 4,
        influence: 0,
    },

    //
    // Other planets
    //
    {
        name: 'Archon Vail',
        trait: Traits.HAZARDOUS,
        resources: 1,
        influence: 3,
        propulsion: 1,
    },
    {
        name: 'Perimeter',
        trait: Traits.INDUSTRIAL,
        resources: 2,
        influence: 1,
    },
    {
        name: 'Ang',
        trait: Traits.INDUSTRIAL,
        resources: 2,
        influence: 0,
        warfare: 1,
    },
    {
        name: 'Sem-Lore',
        trait: Traits.CULTURAL,
        resources: 3,
        influence: 2,
        cybernetic: 1,
    },
    {
        name: 'Vorhal',
        trait: Traits.CULTURAL,
        resources: 0,
        influence: 2,
        biotic: 1,
    },
    {
        name: 'Atlas',
        trait: Traits.HAZARDOUS,
        resources: 3,
        influence: 1,
    },
    {
        name: 'Primor',
        trait: Traits.CULTURAL,
        resources: 2,
        influence: 1,
        legendary:
            'The Atrament: You may exhaust this card at the end of your turn to place up to 2 infantry from your reinforcements on any planet you control.',
    },
    {
        name: "Hope's End",
        trait: Traits.HAZARDOUS,
        resources: 3,
        influence: 0,
        legendary:
            'Imperial Arms Vault: You may exhaust this card at the end of your turn to place 1 mech from your reinforcements on any planet you control, or draw 1 action card',
    },
    {
        name: 'Cormund',
        trait: Traits.HAZARDOUS,
        resources: 2,
        influence: 0,
    },
    {
        name: 'Everra',
        trait: Traits.CULTURAL,
        resources: 3,
        influence: 1,
    },
    {
        name: 'Jeol Ir',
        trait: Traits.INDUSTRIAL,
        resources: 2,
        influence: 3,
    },
    {
        name: 'Accoen',
        trait: Traits.INDUSTRIAL,
        resources: 2,
        influence: 3,
    },
    {
        name: 'Kraag',
        trait: Traits.HAZARDOUS,
        resources: 2,
        influence: 1,
    },
    {
        name: 'Siig',
        trait: Traits.HAZARDOUS,
        resources: 0,
        influence: 2,
    },
    {
        name: "Ba'kal",
        trait: Traits.INDUSTRIAL,
        resources: 3,
        influence: 2,
    },
    {
        name: 'Alio Prima',
        trait: Traits.CULTURAL,
        resources: 1,
        influence: 1,
    },
    {
        name: 'Lisis',
        trait: Traits.INDUSTRIAL,
        resources: 2,
        influence: 2,
    },
    {
        name: 'Velnor',
        trait: Traits.INDUSTRIAL,
        resources: 2,
        influence: 1,
        warfare: 1,
    },
    {
        name: 'Cealdri',
        trait: Traits.CULTURAL,
        resources: 0,
        influence: 2,
        cybernetic: 1,
    },
    {
        name: 'Xanhact',
        trait: Traits.HAZARDOUS,
        resources: 0,
        influence: 1,
    },
    {
        name: 'Vega Major',
        trait: Traits.CULTURAL,
        resources: 2,
        influence: 1,
    },
    {
        name: 'Vega Minor',
        trait: Traits.CULTURAL,
        resources: 1,
        influence: 2,
        propulsion: 1,
    },
    {
        name: 'Abaddon',
        trait: Traits.CULTURAL,
        resources: 1,
        influence: 0,
    },
    {
        name: 'Ashtroth',
        trait: Traits.HAZARDOUS,
        resources: 2,
        influence: 0,
    },
    {
        name: 'Loki',
        trait: Traits.CULTURAL,
        resources: 1,
        influence: 2,
    },
    {
        name: 'Rigel I',
        trait: Traits.HAZARDOUS,
        resources: 0,
        influence: 1,
    },
    {
        name: 'Rigel II',
        trait: Traits.INDUSTRIAL,
        resources: 1,
        influence: 2,
    },
    {
        name: 'Rigel III',
        trait: Traits.INDUSTRIAL,
        resources: 1,
        influence: 1,
        biotic: 1,
    },
    {
        name: 'Mallice',
        trait: Traits.CULTURAL,
        resources: 0,
        influence: 3,
        legendary:
            'Exterrix Headquarters: You may exhaust this card at the end of your turn to gain 2 trade goods or convert all of your commodities into trade goods.',
    },
    {
        name: 'Mirage',
        trait: Traits.CULTURAL,
        resources: 1,
        influence: 2,
        legendary:
            'Mirage Flight Academy: You may exhaust this card at the end of your turn to place up to 2 fighters from your reinforcements in any system that contains 1 or more of your ships.',
    },
];

export default Planets;
