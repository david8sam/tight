import { Faction, LeaderType, UnitType } from 'common/Faction';

const Factions: Readonly<Faction[]> = [
    {
        name: 'The Arborec',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Magen Defense Grid'],
        commodities: 3,
        abilities: [
            {
                name: 'MITOSIS',
                description:
                    'Your space docks cannot produce infantry. At the start of the status phase, place 1 infantry from your reinforcements on any planet you control.',
            },
        ],
        promissoryNotes: [
            {
                name: 'Stymie',
                description:
                    "ACTION: Place this card face up in your play area.\n\nWhile this card is in your play area, the Arborec player cannot produce units in or adjacent to non-home systems that contain 1 or more of your units.\n\nIf you activate a system that contains 1 or more of the Arborec player's units, return this card to the Arborec player.",
            },
            {
                name: 'Stymie Ω',
                description: `After another player moves ships into a system that contains 1 or more of your units:\n\nYou may place 1 command token from that player's reinforcements in any non-home system.\n\nThen, return this card to the Arborec player.`,
            },
        ],
        factionTech: [
            {
                name: 'Bioplasmosis',
                description:
                    'At the end of the status phase, you may remove any number of infantry from planets you control and place them on 1 or more planets you control in the same or adjacent systems.',
                prerequisites: {
                    biotic: 2,
                },
            },
        ],
        factionUnits: [
            {
                type: UnitType.Infantry,
                name: 'Letani Warrior I',
                cost: [1, 2],
                combat: 8,
                abilities: ['Production 1'],
            },
            {
                type: UnitType.Infantry,
                name: 'Letani Warrior II',
                cost: [1, 2],
                combat: 7,
                abilities: [
                    'Production 2',
                    'After this unit is destroyed, roll 1 die. If the Result is 6 or greater, place the unit on this card. At the start of your next turn, place each unit that is on this card on a planet you control in your home system.',
                ],
                prerequisites: {
                    biotic: 2,
                },
            },
        ],
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
        mech: {
            name: 'Letani Behemoth',
            description:
                'DEPLOY: When you would use your MITOSIS faction ability you may replace 1 of you infantry with 1 mech from your reinforcements instead.',
            abilities: ['Sustain Damage', 'Production 2', 'Planetary Shield'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Letani Ospha',
                unlock: 'At Game Start',
                ability: `ACTION: Exhaust this card and choose a player's non-figther ship; that player may replace that ship with one from their reinforcements that costs up to 2 more than the replaced ship.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Drzuga Rophal',
                unlock: 'Have 12 Ground Forces on Planets you control',
                ability: `After another player activates a system that contains 1 or more of your units that have PRODUCTION: You may produce 1 unit in that system.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Letani Miasmiala',
                unlock: 'Have 3 Scored Objectives',
                ability: `ULTRASONIC EMITTER\n\nACTION: Produce any number of units in any number of systems that contain 1 or more of your ground forces. Then, purge this card.`,
            },
        ],
    },

    {
        name: 'The Barony of Letnev',
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Carrier]: 1,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 1,
            [UnitType.Infantry]: 3,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Antimass Deflectors', 'Plasma Scoring'],
        commodities: 2,
        abilities: [
            {
                name: 'MUNITIONS RESERVES',
                description:
                    'At the start of each round of space combat, you may spend 2 trade goods;  you may re-roll any number of your dice during that combat round.',
            },
            {
                name: 'ARMADA',
                description:
                    'The maximum number of non-fighter ships you can have in each system is equal to 2 more than the number of tokens in your fleet pool.',
            },
        ],
        promissoryNotes: [
            {
                name: 'War Funding',
                description:
                    'At the start of a round of space combat:\n\nThe Letnev player loses 2 trade goods.\n\nDuring this combat round, re-roll any number of your dice.\n\nThen, return this card to the Letnev Player.',
            },
            {
                name: 'War Funding Ω',
                description: `After you and your opponent roll dice during space combat:\n\nYou may reroll all of your opponent's dice.\n\nYou may reroll any number of your dice.\n\nThen return this card to the Letnev Player.`,
            },
        ],
        factionTech: [
            {
                name: 'L4 Disruptors',
                description: 'During an invasion, units cannot use SPACE CANNON against your units.',
                prerequisites: {
                    cybernetic: 1,
                },
            },
            {
                name: 'Non-Euclidean Shielding',
                description: 'When 1 of your units uses SUSTAIN DAMAGE, cancel 2 hits instead of 1.',
                prerequisites: {
                    warfare: 2,
                },
            },
        ],
        flagship: {
            name: 'Arc Secundus',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                'Bombardment 5 (x3)',
                `Other player's units in this system lose PLANETARY SHIELD. At the start of each space combat round, repair this ship.`,
            ],
        },
        mech: {
            name: 'Dunlain Reaper',
            description: `DEPLOY: At the start of a round of ground combat, you may spend 2 resources to replace 1 of your infantry in that combat with 1 mech.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Viscount Unlenn',
                unlock: 'At Game Start',
                ability: `At the start of a Space Combat round: You may exhaust this card to choose 1 ship in the active system. That ship rolls 1 additional die during this combat round.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Rear Admiral Farran',
                unlock: 'Have 5 non-fighter ships in 1 system.',
                ability: 'After 1 of you units uses SUSTAIN DAMAGE: You may gain 1 Trade Good.',
            },
            {
                type: LeaderType.Hero,
                name: 'Darktalon Treilla',
                unlock: 'Have 3 Scored Objectives',
                ability: `DARK MATTER AFFINITY\n\nACTION: Place this card near the game board; the number of non-fighter ships you can have in systems is not limited by the laws or by the number of command tokens in your fleet pool during this game round.\n\nAt the end of that game round purge this card.`,
            },
        ],
    },

    {
        name: 'The Clan of Saar',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Antimass Deflectors'],
        commodities: 3,
        abilities: [
            {
                name: 'SCAVENGE',
                description: 'After you gain control of a planet, gain 1 trade good',
            },
            {
                name: 'NOMADIC',
                description: `You can score objectives even if you do not control the planets in your home system.`,
            },
        ],
        promissoryNotes: [
            {
                name: `Ragh's Call`,
                description: `After you commit 1 or more units to land on a planet:\n\nRemove all of the Saar player's ground forces from that planet and place them on a planet controlled by the Saar player.\n\nThen return this card to the Saar player.`,
            },
        ],
        factionTech: [
            {
                name: 'Chaos Mapping',
                description: `Other players cannot activate asteroid fields that contain 1 or more of your ships.\n\nAt the start of your turn during the action phase, you may produce 1 unit in a system that contains at least 1 of your units that has Production.`,
                prerequisites: {
                    propulsion: 1,
                },
            },
        ],
        factionUnits: [
            {
                type: UnitType.SpaceDock,
                name: 'Floating Factory I',
                move: 1,
                capacity: 4,
                abilities: [
                    'Production 5',
                    'This unit is placed in a space area instead of on a planet. This Unit can move and retreat as if it were a ship. If this unit is blockaded, it is destroyed.',
                ],
            },
            {
                type: UnitType.SpaceDock,
                name: 'Floating Factory II',
                move: 2,
                capacity: 5,
                abilities: [
                    'Production 7',
                    'This unit is placed in a space area instead of on a planet. This Unit can move and retreat as if it were a ship. If this unit is blockaded, it is destroyed.',
                ],
                prerequisites: {
                    cybernetic: 2,
                },
            },
        ],
        flagship: {
            name: 'Son of Ragh',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 3,
            abilities: ['Sustain Damage', 'Anti-Figther Barrage 6 (x4)'],
        },
        mech: {
            name: 'Scavenger Zeta',
            description: `DEPLOY: After you gain control of a planet, you may spend 1 trade good to place 1 mech on that planet.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Captain Mendosa',
                unlock: 'At Game Start',
                ability: `After a player activates a system: You may exhaust this card to increase the move value of 1 of that player's ships to match the move value of the ship on the game board that has the highest move value.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Rowl Sarrig',
                unlock: 'Have 3 space docks on the game board',
                ability: `When you produce fighters or infantry: You may place each of those units at any of your space docks that are not blockaded`,
            },
            {
                type: LeaderType.Hero,
                name: 'Gurno Aggero',
                unlock: 'Have 3 Scored Objectives',
                ability: `ARMAGEDDON RELAY\n\nACTION: Choose 1 system that is adjacent to 1 of your space docks. Destroy all other player's infantry and fighters in that system.\n\nThen purge this card.`,
            },
        ],
    },

    {
        name: 'The Embers of Muaat',
        startingUnits: {
            [UnitType.WarSun]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Plasma Scoring'],
        commodities: 4,
        abilities: [
            {
                name: 'STAR FORGE',
                description:
                    'ACTION: Spend 1 token from your strategy pool to place either 2 figthers or 1 destroyer from your reinforcements in a system that contains 1 or more of your war suns.',
            },
            {
                name: 'GASHLAI PHYSIOLOGY',
                description:
                    'Your ships can move through supernovas.\n\nNote: Moving through a system is distinct from moving into a system.',
            },
        ],
        promissoryNotes: [
            {
                name: 'Fires of the Gashlai',
                description: `ACTION: Remove 1 token from the Muaat Player's fleet pool and return it to their reinforcements. Then, gain your war sun unit upgrade technology card.\n\nThen, return this card to the Muaat player.`,
            },
        ],
        factionTech: [
            {
                name: 'Magmus Reactor',
                description: `Your ships can move into supernovas.\n\nAfter 1 or more of your units use Production in a system that either contains a war sun or is adjacent to a supernova, gain 1 trade good.`,
                prerequisites: {
                    warfare: 2,
                },
            },
            {
                name: 'Magmus Reactor Ω',
                description:
                    'Your ships can move into supernovas.\n\nEach supernova that contains 1 or more of your units gain the PRODUCTION 5 ability as if it were 1 of you units.',
                prerequisites: {
                    warfare: 2,
                },
            },
        ],
        factionUnits: [
            {
                type: UnitType.WarSun,
                name: 'Prototype War Sun I',
                cost: 12,
                combat: [3, 3],
                move: 1,
                capacity: 6,
                abilities: [
                    'Sustain Damage',
                    'Bombardment 3 (x3)',
                    `Other player's units in this system lose Planetary Shield.`,
                ],
            },
            {
                type: UnitType.WarSun,
                name: 'Prototype War Sun II',
                cost: 10,
                combat: [3, 3],
                move: 3,
                capacity: 6,
                abilities: [
                    'Sustain Damage',
                    'Bombardment 3 (x3)',
                    `Other player's units in this system lose Planetary Shield.`,
                ],
                prerequisites: {
                    warfare: 3,
                    cybernetic: 1,
                },
            },
        ],
        flagship: {
            name: 'The Inferno',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `ACTION: Spend 1 token from your strategy pool to place 1 crusier in this unit's system`,
            ],
        },
        mech: {
            name: 'Ember Colossus',
            description:
                'When you use your STAR FORGE faction ability in this system or an adjacent system, you may place 1 infantry from your reinforcements with this unit.',
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Umbat',
                unlock: 'At Game Start',
                ability: `ACTION: Exhaust this card to choose a player; that player may produce up to 2 units that each have a cost of 4 or less in a system that contains one of their war suns or their flagship.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Magmus',
                unlock: 'Produce a War Sun',
                ability: `After you spend a token from your strategy pool: You may gain 1 trade good.`,
            },
            {
                type: LeaderType.Hero,
                name: `Adjudicator Ba'al`,
                unlock: 'Have 3 Scored Objectives',
                ability: `You may destroy all other players' units in  that system and replace that system tile with the Muaat supernova tile. If you do, purge this card and each planet card that corresponds to the replaced system tile.`,
            },
        ],
    },

    {
        name: 'The Emirates of Hacan',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Antimass Deflectors', 'SarweenTools'],
        commodities: 6,
        abilities: [
            {
                name: 'MASTERS OF TRADE',
                description: `You do not have to spend a command token to resolve the secondary ability of "Trade" strategy card.`,
            },
            {
                name: 'GUILD SHIPS',
                description: `You can negotiate transactions with players who are not your neighbor`,
            },
            {
                name: 'ARBITERS',
                description: `When you are negotiating a transaction, action cards can be exchanged as part of that transaction`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Trade Convoys',
                description: `ACTION: place this card face-up in your play area.\n\nWhile this card is in your play area, you may negotiate transactions with players who are not your neighbor.\n\nIf you activate a system that contains 1 or more of the Hacan player's units, return this card to the Hacan player.`,
            },
        ],
        factionTech: [
            {
                name: 'Production Biomes',
                description:
                    'ACTION: Exhaust this card and spend 1 token from your strategy pool to gain 4 trade goods and choose 1 other player; that player gains 2 trade goods.',
                prerequisites: {
                    biotic: 2,
                },
            },
            {
                name: 'Quantum Datahub Node',
                description: `At the end of the strategy phase, you may spend 1 token from your strategy pool and give another player 3 of your trade goods. If you do, give 1 of your strategy cards to that player and take 1 of their strategy cards.`,
                prerequisites: {
                    cybernetic: 3,
                },
            },
        ],
        flagship: {
            name: 'Wrath of Kenara',
            cost: 8,
            combat: [7, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                'After you roll a die during a space combat in this system, you may spend 1 trade good to apply +1 to the result',
            ],
        },
        mech: {
            name: 'Pride of Kenara',
            description: `This planet's card may be traded as part of a transaction; if you do, move all of your units from this planet to another planet you control.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Carth of Golden Sands',
                unlock: 'At Game Start',
                ability: `During the action phase: You may exhaust this card to gain 2 commodities or replenish another player's commodities.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Gila the Silvertongue',
                unlock: 'Have 10 Trade Goods',
                ability: `When you cast votes: You may spend any number of trade goods; cast 2 additional votes for each trade good spent.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Harrugh Gefhara',
                unlock: 'Have 3 Scored Objectives',
                ability: `GALACTIC SECURITIES NET\n\nWhen 1 or more of you units use PRODUCTION:\n\nYou may reduce the cost of each of your units to 0 during this use of PRODUCTION. If you do, purge this card.`,
            },
        ],
    },

    {
        name: 'The Federation of Sol',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 5,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Neural Motivator', 'Antimass Deflectors'],
        commodities: 4,
        abilities: [
            {
                name: 'ORBITAL DROP',
                description: `ACTION: Spend 1 token from your strategy pool to place 2 infantry from your reinforcements on 1 planet you control.`,
            },
            {
                name: 'VERSATILE',
                description: `When you gain command tokens during the status phase, gain 1 additional command token.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Military Support',
                description: `At thte start of the Sol player's turn:\n\nRemove 1 token from the Sol player's strategy pool, if able, and return it to their reinforcements. Then, you may place 2 infantry from your reinforcements on any planet you control.\n\nThen return this card to the Sol player.`,
            },
        ],
        factionUnits: [
            {
                type: UnitType.Infantry,
                name: 'Spec Ops I',
                cost: [1, 2],
                combat: 7,
            },
            {
                type: UnitType.Infantry,
                name: 'Spec Ops II',
                cost: [1, 2],
                combat: 6,
                abilities: [
                    `After this unit is destroyed, roll 1 die. If the result is 5 or greater, place the unit on this card. At the start of your next turn, place each unit that is on this card on a planet you control in your home system.`,
                ],
                prerequisites: {
                    biotic: 2,
                },
            },
            {
                type: UnitType.Carrier,
                name: 'Advanced Carrier I',
                cost: 3,
                combat: 9,
                move: 1,
                capacity: 6,
            },
            {
                type: UnitType.Carrier,
                name: 'Advanced Carrier II',
                cost: 3,
                combat: 9,
                move: 2,
                capacity: 8,
                abilities: ['Sustain Damage'],
                prerequisites: {
                    propulsion: 2,
                },
            },
        ],
        flagship: {
            name: 'Genesis',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 12,
            abilities: [
                'Sustain Damage',
                `At the end of the status phase, place 1 infantry from your reinforcements in this system's space area.`,
            ],
        },
        mech: {
            name: 'ZS Thunderbolt M2',
            description: `DEPLOY: After you use your ORBITAL DROP faction ability, you may spend 3 resources to place 1 mech on that planet.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Evelyn Delouis',
                unlock: 'At Game Start',
                ability: `At the start of a ground combat round: You may exhaust this card to choose 1 ground force in the active system; that ground force rolls 1 additional die during that combat.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Claire Gibson',
                unlock: 'Control planets that have a combined total of at least 12 resources.',
                ability: `At the start of a ground combat on a planet you control: You may place 1 infantry from your reinforcements on that planet.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Jace X. 4th Air Legion',
                unlock: 'Have 3 Scored Objectives',
                ability: `HELIO COMMAND ARRAY\n\nACTION: Remove each of your command tokens from the game board and return them to your reinforcements. Then, purge this card.`,
            },
        ],
    },

    {
        name: 'The Ghosts of Creuss',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Destroyer]: 2,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Gravity Drive'],
        commodities: 4,
        abilities: [
            {
                name: 'QUANTUM ENTANGLEMENT',
                description: `You treat all systems that contain either an alpha or beta wormhole as adjacent to each other. Game effects cannot prevent you from using this ability.`,
            },
            {
                name: 'SLIPSTREAM',
                description: `During your tactical actions, apply +1 to the move value of each of your ships that starts its movement in your home system or in a system that contains either an alpha or beta wormhole.`,
            },
            {
                name: 'CREUSS GATE',
                description: `When you create the game board, place the Creuss Gate (tile 17) where your home system would normally be placed. The Creuss Gate system is not a home system. Then, place your home system (tile 51) in your play area.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Creuss Iff',
                description: `At the start of your turn during the action phase:\n\nPlace or move a Creuss wormhole token into either a system that contains a planet you control or a non-home system that does not contain another player's ships.\n\nThen, return this card to the Creuss player.`,
            },
        ],
        factionTech: [
            {
                name: 'Wormhole Generator',
                description: `At the start of the status phase, place or move a Creuss wormhole token into either a system that contains a planet you control or a non-home system that does not contain another player's ships.`,
                prerequisites: {
                    propulsion: 2,
                },
            },
            {
                name: 'Wormhole Generator Ω',
                description: `ACTION: Exhaust this card to place or move a Creuss wormhole token into either a system that contains a planet you control or a non-home system that does not contain another player's ships.`,
                prerequisites: {
                    propulsion: 2,
                },
            },
            {
                name: 'Dimensional Splicer',
                description: `At the start of space combat in a system that contains a wormhole and 1 or more of your ships, you may produce 1 hit and assign it to 1 of your opponent's ships`,
                prerequisites: {
                    warfare: 1,
                },
            },
        ],
        flagship: {
            name: 'Hil Colish',
            cost: 8,
            combat: 5,
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `This ship's system contains a delta wormhole. During movement, this ship may move before or after your other ships.`,
            ],
        },
        mech: {
            name: 'Icarus Drive',
            description: `After any player activates a system, you may remove this unit from the game board to place or move a Creuss wormhole token into this system (that contained the mech).`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Emissary Taivra',
                unlock: 'At Game Start',
                ability: `After a player activates a system that contains a non-delta wormhole: You may exhaust this card; if you do, that system is adjacent to all other systems that contain a wormhole during this tactical action.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Sai Seravus',
                unlock: 'Have units in 3 systems that contain alpha or beta wormholes.',
                ability: `After your ships move: For each ship that has a capacity value and moved through 1 or more wormholes, you may place 1 fighter from your reinforcements with that ship if you have unused capacity in the active system.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Riftwalker Meian',
                unlock: 'Have 3 Scored Objectives',
                ability: `SINGULARITY REACTOR\n\nACTION: Swap the positions of any 2 systems that contain wormholes or your units, other than the Creuss system and the Wormhole Nexus. Then, purge this card.`,
            },
        ],
    },

    {
        name: 'The L1Z1X Mindnet',
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Carrier]: 1,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 5,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Neural Motivator', 'Plasma Scoring'],
        commodities: 2,
        abilities: [
            {
                name: 'ASSIMILATE',
                description: `When you gain control of a planet, replace each PDS and space dock that is on that planet with a matching unit from your reinforcements.`,
            },
            {
                name: 'HARROW',
                description: `At the end of each round of ground combat, your ships in the active system may use their Bombardment abilities against your opponent's ground forces on the planet.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Cybernetic Enhancements',
                description: `At the start of your turn:\n\nRemove 1 token from the L1Z1X player's strategy pool and return it to his reinforcements. Then, place 1 command token from your reinforcements in your strategy pool.\n\nThen, return this card to the L1Z1X player.`,
            },
            {
                name: 'Cybernetic Enhancements Ω',
                description: `When you gain command tokens during the status phase:\n\nGain 1 additional command token.\n\nThen, return this card to the L1Z1X player.`,
            },
        ],
        factionTech: [
            {
                name: 'Inheritance Systems',
                description: `You may exhaust this card and spend 2 resources when you research a technology; ignore all of that technology's prerequisites.`,
                prerequisites: {
                    cybernetic: 2,
                },
            },
        ],
        factionUnits: [
            {
                type: UnitType.Dreadnought,
                name: 'Super-Dreadnought I',
                cost: 4,
                combat: 5,
                move: 1,
                capacity: 2,
                abilities: ['Sustain Damage', 'Bombardment 5'],
            },
            {
                type: UnitType.Dreadnought,
                name: 'Super-Dreadnought II',
                cost: 4,
                combat: 4,
                move: 2,
                capacity: 2,
                abilities: [
                    'Sustain Damage',
                    'Bombardment 4',
                    'This unit cannot be destroyed by "Direct Hit" action cards.',
                ],
                prerequisites: {
                    propulsion: 2,
                    cybernetic: 1,
                },
            },
        ],
        flagship: {
            name: '[0.0.1]',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 5,
            abilities: [
                'Sustain Damage',
                `During a space combat, hits produced by this ship and by your dreadnoughts in this system must be assigned to non-fighter ships if able.`,
            ],
        },
        mech: {
            name: 'Annihilator',
            description: `While not participating in ground combat, this unit can use its BOMBARDMENT ability on planets in its system as if it were a ship.`,
            abilities: ['Sustain Damange', 'Bombardment 8'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'I48S',
                unlock: 'At Game Start',
                ability: `After a player activates a system: You may exhaust this card to allow that player to replace 1 of their infantry in the active system with 1 mech from their reinforcements.`,
            },
            {
                type: LeaderType.Commander,
                name: '2RAM',
                unlock: 'Have 4 dreadnoughts on the Board',
                ability: `Units that have PLANETARY SHIELD do not prevent you from using Bombardment`,
            },
            {
                type: LeaderType.Hero,
                name: 'The Helmsman',
                unlock: 'Have 3 Scored Objectives',
                ability: `DARK SPACE NAVIGATION\n\nACTION: Choose 1 system that does not contain other player's ships; you may move your flagship and any number of your dreadnoughts from other systems into the chosen system.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Mentak Coalition',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 2,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Sarween Tools', 'Plasma Scoring'],
        commodities: 2,
        abilities: [
            {
                name: 'AMBUSH',
                description: `At the start of a space combat, you may roll 1 die for each of up to 2 of your crusiers or destroyers in the system. For each result equal to or greater than the ship's combat value, produce 1 hit; your oppenent must assign it to 1 of their ships.`,
            },
            {
                name: 'PILLAGE',
                description: `After 1 of your neighbors gains trade goods or resolves a transaction, if they have 3 or more trade goods, you may take 1 of their trade goods or commodities.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Promise of Protection',
                description: `ACTION: Place this card face-up in your play area.\n\nWhile this card is in your play area, the Mentak player cannot use their Pillage faction ability against you.\n\nIf you activate a system that contains 1 or more of the Mentak player's units, return this card to the Mentak player.`,
            },
        ],
        factionTech: [
            {
                name: 'Salvage Operations',
                description: `After you win or lose a space combat, gain 1 trade good; if you won the combat you may also produce 1 ship in that system of any ship type that was destroyed during the combat.`,
                prerequisites: {
                    cybernetic: 2,
                },
            },
            {
                name: 'Mirror Computing',
                description: `When you spend trade goods, each trade good is worth 2 resources or influence instead of 1.`,
                prerequisites: {
                    cybernetic: 3,
                },
            },
        ],
        flagship: {
            name: 'Fourth Moon',
            cost: 8,
            combat: [7, 2],
            move: 1,
            capacity: 3,
            abilities: ['Sustain Damage', `Other player's ships in this system cannot use Sustain Damage.`],
        },
        mech: {
            name: 'Moll Terminus',
            description: `Other player's ground forces on this planet cannot use SUSTAIN DAMAGE.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Suffi An',
                unlock: 'At Game Start',
                ability: `After the PILLAGE faction ability is used against another player: You may exhaust this card; if you do, you and that player each draw 1 action card.`,
            },
            {
                type: LeaderType.Commander,
                name: `S'Ula Mentarion`,
                unlock: 'Have 4 cruisers on the game board',
                ability: `After you win a space combat: You may force your opponent to give you 1 promissory note from their hand.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Ipswitch Loose Cannon',
                unlock: 'Have 3 Scored Objectives',
                ability: `SLEEPER CELL\n\nAt the start of space combat that you are participating in:\n\nYou may purge this card; if you do, for each other player's ship that is destroyed during this combat, place 1 ship of that type from your reinforcements in the active system.`,
            },
        ],
    },

    {
        name: 'The Naalu Collective',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 1,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Neural Motivator', 'Sarween Tools'],
        commodities: 3,
        abilities: [
            {
                name: 'TELEPATHIC',
                description: `At the end of the strategy phase, place the Naalu "0" token on your strategy card; you are the first in the initiative order.`,
            },
            {
                name: 'FORESIGHT',
                description: `After another player moves ships into a system that contains 1 or more of your ships, you may place 1 token from your strategy pool in an adjacent system that does not contain another player's ships; move your ships from the active system into that system.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Gift of Prescience',
                description: `At the end of the strategy phase:\n\nPlace this card face-up in your play area and palce the Naalu "0" token on your strategy card; you are the first in the initiative order. The Naalu player cannot use their TELEPATHIC faction ability during this game round.\n\nReturn this card to the Naalu player at the end of the status phase.`,
            },
        ],
        factionTech: [
            {
                name: 'Neuroglaive',
                description: `After another player activates a system that contains 1 or more of your ships, that player removes 1 token from this fleet pool and returns it to his reinforcements.`,
                prerequisites: {
                    biotic: 3,
                },
            },
        ],
        factionUnits: [
            {
                type: UnitType.Fighter,
                name: 'Hybrid Crystal Fighter I',
                cost: [1, 2],
                combat: 8,
            },
            {
                type: UnitType.Fighter,
                name: 'Hybrid Crystal Fighter II',
                cost: [1, 2],
                combat: 7,
                move: 2,
                abilities: [
                    `This unit may move without being transported. Each fighter in excess of your ships' capacity counts as 1/2 of a ship against your fleet pool.`,
                ],
                prerequisites: {
                    biotic: 1,
                    propulsion: 1,
                },
            },
        ],
        flagship: {
            name: 'Matriarch',
            cost: 8,
            combat: [9, 2],
            move: 1,
            capacity: 6,
            abilities: [
                'Sustain Damage',
                'During an invasion in this system, you may commit fighters to planets as if they were ground forces. When combat ends, return these units to the space area.',
            ],
        },
        mech: {
            name: 'Iconoclast',
            description: `During combat against an opponent who has at least 1 relic fragment, apply +2 to the results of this unit's combat rolls.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: `Z'eu`,
                unlock: 'At Game Start',
                ability: `After an agenda is revealed: You may exhaust this card to look at the top card of the agenda deck. Then you may show that card to 1 other player.`,
            },
            {
                type: LeaderType.Commander,
                name: `M'aban`,
                unlock: 'Have 12 fighters on the game board',
                ability: `You may produce 1 additional fighter for their cost; these additional units do not count against your production limit.`,
            },
            {
                type: LeaderType.Hero,
                name: 'The Oracle',
                unlock: 'Have 3 Scored Objectives',
                ability: `C-RADIUM GEOMETRY\n\nAt the end of the status phase:\n\nYou may force each other player to give you 1 promissory note from their hand. If you do, purge this card.`,
            },
        ],
    },

    {
        name: 'The Nekro Virus',
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 2,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Dacxive Animators', 'Valefar Assimilator X', 'Valefar Assimilator Y'],
        commodities: 3,
        abilities: [
            {
                name: 'GALACTIC THREAT',
                description: `You cannot vote on agendas. Once per agenda phase, after an agenda is revealed, you may predict aloud the outcome of the agenda. If your prediction is correct, gain 1 technology that is owned by a player who voted how you predicted.`,
            },
            {
                name: 'TECHNOLOGICAL SINGULARITY',
                description: `Once per combat, after 1 of your opponent's units is destroyed, you may gain 1 technology that is owned by that player.`,
            },
            {
                name: 'PROPAGATION',
                description: `You cannot research technology. When you would research a technology, gain 3 command tokens instead.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Antivirus',
                description: `At the start of a combat:\n\nPlace this card face-up in your play area.\n\nWhile this card is in your play area, the Nekro player cannot use their TECHNOLOGY SINGULARITY faction ability against you.\n\nIf you activate a system that contains 1 or more of the Nekro player's units, return this card to the Nekro player.`,
            },
        ],
        factionTech: [
            {
                name: 'Valefar Assimilator X',
                description: `When you would gain another player's technology using 1 of your faction abilities, you may place the "X" assimilator token on a faction technology owned by that player instead. While that token is on a technology, this card gains that technology's text. You cannot place an assimilator token on technology that already has an assimilator token.`,
            },
            {
                name: 'Valefar Assimilator Y',
                description: `When you would gain another player's technology using 1 of your faction abilities, you may place the "Y" assimilator token on a faction technology owned by that player instead. While that token is on a technology, this card gains that technology's text. You cannot place an assimilator token on technology that already has an assimilator token.`,
            },
        ],
        flagship: {
            name: 'The Alastor',
            cost: 8,
            combat: [9, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `At the start of the space combat, choose any number of your ground forces in this system to participate in that combat as if they were ships.`,
            ],
        },
        mech: {
            name: 'Mordred',
            description: `During combat against an opponent who has an "X" or "Y" token on 1 or more of their technologies, apply +2 to the result of each of this unit's combat rolls.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Nekro Malleon',
                unlock: 'At Game Start',
                ability: `During action phase: You may exhaust this card to choose a player; that player may discard 1 action card or spend 1 command token from their command sheet to gain 2 trade goods.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Nekro Acidos',
                unlock: 'Own 3 technologies. A "Valefar Assimilator" technology counts only if its X or Y token is on a technology',
                ability: `After you gain a technology: You may draw 1 action card.`,
            },
            {
                type: LeaderType.Hero,
                name: 'UNIT.DSGN.FLAYESH',
                unlock: 'Have 3 Scored Objectives',
                ability: `POLYMORPHIC ALGORITHM\n\nACTION: Choose a planet that has a technology specialty in a system that contains your units. Destroy any other player's units on that planet. Gain trade goods equal to that planet's combined resource and influence values and gain 1 technology that matches the specialty of that planet. Then, purge this card.`,
            },
        ],
    },

    {
        name: "The Sardakk N'orr",
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Cruiser]: 1,
            [UnitType.Infantry]: 5,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        commodities: 3,
        abilities: [
            {
                name: 'UNRELENTING',
                description: `Apply +1 to the result of each of your unit's combat rolls.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Tekklar Legion',
                description: `At the start of an invasion combat:\n\nApply +1 to the result of each of your unit's combat rolls during this combat. If your opponent is the N'orr player, apply -1 to the result of each of his unit's combat rolls during this combat.\n\nThen, return this card to the N'orr player.`,
            },
        ],
        factionTech: [
            {
                name: 'Valkyrie Particle Weave',
                description: `After making combat rolls during a round of ground combat, if your opponent produced 1 or more hits, you produce 1 additional hit.`,
                prerequisites: {
                    warfare: 2,
                },
            },
        ],
        factionUnits: [
            {
                name: 'Exotrireme I',
                type: UnitType.Dreadnought,
                cost: 4,
                combat: 5,
                move: 1,
                capacity: 1,
                abilities: ['Sustain Damage', 'Bombardment 4 (x2)'],
            },
            {
                name: 'Exotrireme II',
                type: UnitType.Dreadnought,
                cost: 4,
                combat: 5,
                move: 2,
                capacity: 1,
                abilities: [
                    'Sustain Damage',
                    'Bombardment 4 (x2)',
                    `This unit cannot be destroyed by "Direct Hit" action cards.`,
                    `After a round of space combat, you may destroy this unit to destroy up to 2 ships in this system.`,
                ],
                prerequisites: {
                    propulsion: 2,
                    cybernetic: 1,
                },
            },
        ],
        flagship: {
            name: `C'Morran N'orr`,
            cost: 8,
            combat: [6, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `Apply +1 to the result of each of your other ship's combat rolls in this system.`,
            ],
        },
        mech: {
            name: 'Valkyrie Exoskeleton',
            description: `After this unit uses its SUSTAIN DAMAGE ability Ground Combat, it produces 1 hit against your opponent's ground forces on this planet.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: `T'ro`,
                unlock: 'At Game Start',
                ability: `At the end of a player's tactical action: You may exhaust this card; if you do, that player may place 2 infantry from their reinforcements on a planet they control in the active system.`,
            },
            {
                type: LeaderType.Commander,
                name: `G'hom Sek'kus`,
                unlock: 'Control 5 planets in non-home systems',
                ability: `During the "Commit Ground Foreces" step: You can commit up to 1 ground force from each planet in the active system and each planet in adjacent systems that do not contain 1 of your command tokens.`,
            },
            {
                type: LeaderType.Hero,
                name: `Sh'val Harbringer`,
                unlock: 'Have 3 Scored Objectives',
                ability: `TEKKLAR CONDITIONING\n\nAfter you move ships into the active system:\n\nYou may skip directly to the "Commit Ground Forces" step. If you do, after you commit ground forces to land on the planets, purge this card and return each of your ships in the active system to your reinforcements.`,
            },
        ],
    },

    {
        name: 'The Universities of Jol-Nar',
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Carrier]: 2,
            [UnitType.Fighter]: 1,
            [UnitType.Infantry]: 2,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 2,
        },
        startingTech: ['Neural Motivator', 'Antimass Deflectors', 'Sarween Tools', 'Plasma Scoring'],
        commodities: 4,
        abilities: [
            {
                name: 'FRAGILE',
                description: `Apply -1 to the result of each of your unit's combat rolls`,
            },
            {
                name: 'BRILLIANT',
                description: `When you spend a command token to resolve the secondary ability of the "Technology" strategy card, you may resolve the primary ability instead.`,
            },
            {
                name: 'ANALYTICAL',
                description: `When you research a technology that is not a unit upgrade technology, you may ignore 1 prerequisite.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Research Agreement',
                description: `After the Jol-Nar player researches a technology that is not a faction technology:\n\nGain that technology.\n\nThen, return this card to the Jol-Nar player.`,
            },
        ],
        factionTech: [
            {
                name: 'E-Res Siphons',
                description: `After another player activates a system that contains 1 or more of your ships, gain 4 trade goods.`,
                prerequisites: {
                    cybernetic: 2,
                },
            },
            {
                name: 'Spacial Conduit Cylinder',
                description: `You may exhaust this card after you activate a system that contains 1 or more of your units; that system is adjacent to all other systems that contain 1 or more of your units during this activation.`,
                prerequisites: {
                    propulsion: 2,
                },
            },
        ],
        flagship: {
            name: 'J.N.S Hylarim',
            cost: 8,
            combat: [6, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `When making a combat roll for this ship, each result of 9 or 10, before applying modifier, produces 2 additional hits.`,
            ],
        },
        mech: {
            name: 'Shield Paling',
            description: `Your infantry on this planet are not affected by your FRAGILE faction ability`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Doctor Sucaban',
                unlock: 'At Game Start',
                ability: `When a player spends resources to research: You may exhaust this card to allow that player to remove any number of their infantry from the game board. For each unit removed, reduce the resource spent by 1.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Ta Zern',
                unlock: 'Own 8 Technologies',
                ability: `After you roll dice for a unit ability: You may reroll any of those dice.`,
            },
            {
                type: LeaderType.Hero,
                name: `Rin, The Master's Legacy`,
                unlock: 'Have 3 Scored Objectives',
                ability: `GENETIC MEMORY\n\nACTION: For each non-unit upgrade technology you own, you may replace that technology with any technology of the same color from the deck. Then, purge this card.`,
            },
        ],
    },

    {
        name: 'The Winnu',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 2,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Choose any 1 Technology that has no prerequisites.'],
        commodities: 3,
        abilities: [
            {
                name: 'BLOOD TIES',
                description: `You do not have to spend influence to remove the custodians token from Mecatol Rex.`,
            },
            {
                name: 'RECLAMATION',
                description: `After you resolve a tactical action during which you gained control of Mecatol Rex`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Acquiescence',
                description: `At the end of the strategy phase:\n\nExchange 1 of your strategy cards with a strategy card that was chosen by the Winnu player.\n\nThen, return this card to the Winnu player.`,
            },
            {
                name: 'Acquiescence Ω',
                description: `When the Winnu player resolves a strategic action:\n\nYou do not have to spend or place a command token to resolve the secondary ability of that strategy card.\n\nThen, return this card to the Winnu player.`,
            },
        ],
        factionTech: [
            {
                name: 'Lazax Gate Folding',
                description: `During your tactical actions, if you do not control Mecatol Rex, treat its system as if it contains both an alpha and beta wormhole.\n\nACTION: If you control Mecatol Rex, exhaust this card to place 1 infantry from your reinforcements on Mecatol Rex.`,
                prerequisites: {
                    propulsion: 2,
                },
            },
            {
                name: 'Hegemonic Trade Policy',
                description: `Exhaust this card when 1 or more of your units use PRODUCTION; swap the resource and influence values of 1 planet you control during that use of PRODUCTION.`,
                prerequisites: {
                    cybernetic: 2,
                },
            },
        ],
        flagship: {
            name: 'Salai Sai Corian',
            cost: 8,
            combat: 7,
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `When this unit makes a combat roll, it rolls a number of dice equal to the number of your opponent's non-fighter ships in this system.`,
            ],
        },
        mech: {
            name: 'Reclaimer',
            description: `After you resolve a tactical action where you gained control of this planet, you may place 1 PDS or 1 Space Dock from your reinforcements on this planet.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Berekar Berekon',
                unlock: 'At Game Start',
                ability: `When 1 or more of a player's units use PRODUCTION: You may exhaust this card to reduce the combined cost of the produced units by 2.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Rickar Rickani',
                unlock: `Control Mecatol Rex or enter into a combat in the Mecatol Rex system.`,
                ability: `During combat: Apply +2 to the result of each of your unit's combat rolls in the Mecatol Rex system, your home system, and each system that contains a legendary planet.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Mathis Mathinus',
                unlock: 'Have 3 Scored Objectives',
                ability: `IMPERIAL SEAL\n\nACTION: Perform the primary ability of any strategy card. Then choose any number of other players. Those players may perform the secondary ability of that strategy card. Then, purge this card.`,
            },
        ],
    },

    {
        name: 'The Xxcha Kingdom',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 2,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Graviton Laser System'],
        commodities: 4,
        abilities: [
            {
                name: 'PEACE ACCORDS',
                description: `After you resolve the primary or secondary ability of the "Diplomacy" strategy card, you may gain control of 1 planet other than Mecatol Rex that does not contain any units and is in a system that is adjacent to a planet you control.`,
            },
            {
                name: 'QUASH',
                description: `When an agenda is revealed, you may spend 1 token from your strategy pool to discard that agenda and reveal 1 agenda from the top of the deck. Players vote on this agenda instead.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Political Favor',
                description: `When an agenda is revealed:\n\nRemove 1 token from the Xxcha player's strategy pool and return it to their reinforcements. Then, discard the revealed agenda and reveal 1 agenda from the top of the deck. Players vote on this agenda instead.\n\nThen, return this card to the Xxcha player.`,
            },
        ],
        factionTech: [
            {
                name: 'Nullification Field',
                description: `After another player activates a system that contains 1 or more of your ships, you may exhaust this card and spend 1 token from your strategy pool; immediately end that player's turn.`,
                prerequisites: {
                    cybernetic: 2,
                },
            },
            {
                name: 'Instinct Training',
                description: `You  may exhaust this card and spend 1 token from your strategy pool when another player plays an action card; cancel that action card.`,
                prerequisites: {
                    biotic: 1,
                },
            },
        ],
        flagship: {
            name: 'Loncarra Ssodu',
            cost: 8,
            combat: [7, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                'Space Cannon 5 (x3)',
                `You may use this unit's SPACE CANNON against ships that are in adjacent systems.`,
            ],
        },
        mech: {
            name: 'Indomitus',
            description: `You may use this unit's SPACE CANNON ability against ships that are in adjacent systems.`,
            abilities: ['Sustain Damage', 'Space Cannon 8'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Ggrocuto Rinn',
                unlock: 'At Game Start',
                ability: `ACTION: Exhaust this card to ready any planet; if that planet is in a system that is adjacent to a planet you control, you may remove 1 infantry from that planet and return it to its reinforcements.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Elder Qanoj',
                unlock: `Control planets that have a combined value of at least 12 influence.`,
                ability: `Each planet you exhaust to cast votes provides 1 additional vote. Game effects cannot prevent you from voting on an agenda.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Xxekir Grom',
                unlock: 'Have 3 Scored Objectives',
                ability: `POLITICAL DATA NEXUS\n\nACTION: You may discard 1 law from play. Look at the top 5 cards of the agenda deck. Choose 2 to reveal, and resolve each as if you had cast 1 vote for an outcome of your choice; discard the rest. Other players cannot resolve abilities during this action.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Yin Brotherhood',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 4,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Sarween Tools'],
        commodities: 2,
        abilities: [
            {
                name: 'INDOCTRINATION',
                description: `At the start of a ground combat, you may spend 2 influence to replace 1 of your opponent's participating infantry with 1 infantry from your reinforcements.`,
            },
            {
                name: 'DEVOTION',
                description: `After each space battle round, you may destroy 1 of your cruisers or destroyers in the active system to produce 1 hit and assign it to 1 of your opponent's ships in that system.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Greyfire Mutagen',
                description: `After a system is activated:\n\nThe Yin player cannot use faction abilities or faction technology during this tactical action.\n\nThen, return this card to the Yin player.`,
            },
            {
                name: 'Greyfire Mutagen Ω',
                description: `At the start of a ground combat against 2 or more ground forces that are not controlled by the Yin player.\n\nReplace 1 of your opponent's infantry with 1 infantry from your reinforcements.\n\nThen, return this card to the Yin player.`,
            },
        ],
        factionTech: [
            {
                name: 'Impulse Core',
                description: `At the start of a space combat, you may destroy 1 of your cruisers or destroyers in the active system to produce 1 hit against your opponent's ships; that hit must be assigned by your opponent to 1 of their non-fighter ships, if able.`,
                prerequisites: {
                    cybernetic: 2,
                },
            },
            {
                name: 'Yin Spinner',
                description: `After 1 or more of your units use PRODUCTION, place 1 infantry from your reinforcements on a planet you control in that system.`,
                prerequisites: {
                    biotic: 2,
                },
            },
            {
                name: 'Yin Spinner Ω',
                description: `After you produce units, place up to 2 infantry from your reinforcements on any planet you control or in any space area that contains 1 or more of your ships.`,
                prerequisites: {
                    biotic: 2,
                },
            },
        ],
        flagship: {
            name: 'Van Hauge',
            cost: 8,
            combat: [9, 2],
            move: 1,
            capacity: 3,
            abilities: ['Sustain Damage', `When this ship is destroyed, destroy all ships in this system.`],
        },
        mech: {
            name: `Moyin's Ashes`,
            description: `DEPLOY: When you use your INDOCTRINATION faction ability, you may spend 1 additional influence to replace your opponent's unit with 1 mech instead of 1 infantry.`,
            abilities: ['Sustain Damange'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Brother Milor',
                unlock: 'At Game Start',
                ability: `After a player's destroyer or cruiser is destroyed: You may exhaust this card; if you do, that player may place up to 2 fighters from their reinforcements in that unit's system.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Brother Omar',
                unlock: 'Use your INDOCTRINATION faction ability',
                ability: `This card satisfies a green technology prerequisite.\nYou may produce 1 additional infantry for their cost. These infantry do not count against your production limit.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Dannel of the Tenth',
                unlock: 'Have 3 Scored Objectives',
                ability: `SPINNER OVERDRIVE\n\nACTION: For each planet that contains any number of your infantry, either ready that planet or place an equal number of infantry from your reinforcements on that planet.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Yssaril Tribes',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 5,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Neural Motivator'],
        commodities: 3,
        abilities: [
            {
                name: 'STALL TACTICS',
                description: `ACTION: Discard 1 action card from your hand.`,
            },
            {
                name: 'SCHEMING',
                description: `When you draw 1 or more action cards, draw 1 additional action card. Then, choose and discard 1 action card from your hand.`,
            },
            {
                name: 'CRAFTY',
                description: `You can have any number of action cards in your hand. Game effects cannot prevent you from using this ability.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Spy Net',
                description: `At the start of your turn:\n\nLook at the Yssaril player's hand of action cards. Choose 1 of those cards and add it to your hand.\n\nThen, return this card to the Yssaril player.`,
            },
        ],
        factionTech: [
            {
                name: 'Transparasteel Plating',
                description: `During your turn of the action phase, players that have passed cannot play action cards.`,
                prerequisites: {
                    biotic: 1,
                },
            },
            {
                name: 'Mageon Implants',
                description: `ACTION: Exhaust this card to look at another player's hand of action cards. Choose 1 of those cards and add it to your hand.`,
                prerequisites: {
                    biotic: 3,
                },
            },
        ],
        flagship: {
            name: `Y'sia Y'ssrila`,
            cost: 8,
            combat: [5, 2],
            move: 2,
            capacity: 3,
            abilities: ['Sustain Damage', `This ship can move through systems that contain other player's ships.`],
        },
        mech: {
            name: 'Blackshade Infiltrator',
            description: `DEPLOY: After you use your STALL TACTICS faction ability, you may place 1 mech on a planet you control.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Ssruu',
                unlock: 'At Game Start',
                ability: `This card has the text ability of each other player's agent, even if that agent is exhausted.`,
            },
            {
                type: LeaderType.Commander,
                name: 'So Ata',
                unlock: 'Have 7 action cards',
                ability: `After another player activates a system that contains your units: You may look at that player's action cards, promissory notes, or secret objectives.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Kyver, Blade and Key',
                unlock: 'Have 3 Scored Objectives',
                ability: `GUILD OF SPIES\n\nACTION: Each other player shows you 1 action card from their hand. For each player, you may either take that card or force that player to discard 3 random action cards from their hand.\n\nThen, purge this card.`,
            },
        ],
    },
];

export default Factions;
