import { Faction, LeaderType, UnitType } from 'common/Faction';

const Factions: Readonly<Faction[]> = [
    {
        name: 'The Argent Flight',
        startingUnits: {
            [UnitType.Carrier]: 1,
            [UnitType.Destroyer]: 2,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 5,
            [UnitType.SpaceDock]: 1,
            [UnitType.PDS]: 1,
        },
        startingTech: ['Choose TWO of the following: "Neural Motivato", "Sarween Tools", or "Plasma Scoring".'],
        commodities: 3,
        abilities: [
            {
                name: 'ZEAL',
                description: `You always vote first during the agenda phase. When you cast at least 1 vote, cast 1 additional vote for each player in the game including you.`,
            },
            {
                name: 'RAID FORMATION',
                description: `When 1 or more of your units uses ANTI-FIGHTER BARRAGE, for each hit produced in excess of your opponent's Fighters, choose 1 of your opponent's ships that has SUSTAIN DAMAGE to become damaged. No Fighters means all hits are excess.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Strike Wing Ambuscade',
                description: `When 1 or more of your units make a roll for a unit ability:\n\nChoose 1 of those units to roll 1 additional die.\n\nThen, return this card to the Argent player.`,
            },
        ],
        factionTech: [
            {
                name: 'Aerie Hololattice',
                description: `Other players cannot move ships through systems that contain your structures. Each planet that contains 1 or more of your structures gains the PRODUCTION 1 ability as if it were a unit.`,
                prerequisites: {
                    cybernetic: 1,
                },
            },
        ],
        factionUnits: [
            {
                name: 'Strike Wing Alpha I',
                type: UnitType.Destroyer,
                cost: 1,
                combat: 8,
                move: 2,
                capacity: 1,
                abilities: ['Anti-Figther Barrage 9 (x2)'],
            },
            {
                name: 'Strike Wing Alpha II',
                type: UnitType.Destroyer,
                cost: 1,
                combat: 7,
                move: 2,
                capacity: 1,
                abilities: [
                    'Anti-Figther Barrage 6 (x3)',
                    `When this unit uses ANTI-FIGHTER BARRAGE, each result of 9 or 10 also destroys 1 of your opponent's infantry in the space area of the active system.`,
                ],
                prerequisites: {
                    warfare: 2,
                },
            },
        ],
        flagship: {
            name: 'Quetzecoatl',
            cost: 8,
            combat: [7, 2],
            move: 1,
            capacity: 3,
            abilities: ['Sustain Damage', `Other players cannot use space cannon against your ships in this system.`],
        },
        mech: {
            name: 'Aerie Sentinel',
            description: `This unit does not count against capacity if it is being transported or if it is in a space area with 1 or more of your ships that have capacity values.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Trillossa Aun Mirik',
                unlock: 'At Game Start',
                ability: `When a player produces ground forces in a system: You may exhaust this card; that player may place those units on any planets they control in that system and any adjacent systems.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Trrakan Aun Zulok',
                unlock: `Have 6 units that have ANTI-FIGHTER BARRAGE, SPACE CANNON, or BOMBARDMENT on the game board`,
                ability: `When 1 or more of your units make a roll for a unit ability: You may choose 1 of those units to roll 1 additional die.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Mirik Aun Sissiri',
                unlock: 'Have 3 Scored Objectives',
                ability: `HELIX PROTOCOL\n\nACTION: Move any number of your ships from any systems to any number of other systems that contain 1 or you command tokens and no other players' ships.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Empryrean',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Dark Energy Tap'],
        commodities: 4,
        abilities: [
            {
                name: 'VOIDBORN',
                description: `Nebulae do not affect your ships' movement.`,
            },
            {
                name: 'AETHERPASSGE',
                description: `After a player activates a system, you may allow that player to move their ships through systems that contain your ships.`,
            },
            {
                name: 'DARK WHISPERS',
                description: `During setup, take the additional Empyrean faction promissiory note; you have 2 faction promissory notes.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Dark Pact',
                description: `ACTION: Place this card face up in your play area.\n\nWhen you give a number of commodities to the Empyrean player equal to your maximum commodity value, you each gain 1 trade good.\n\nIf you activate a system that contains 1 or more of the Empyrean player's units, return this card to the Empyrean player.`,
            },
            {
                name: 'Blood Pact',
                description: `ACTION: Place this card face up in your play area.\n\nWhen you and the Empyrean player cast votes for the same outcome, cast 4 additional votes for that outcome.\n\nIf you activate a system that contains 1 or more of the Empyrean player's units, return this card to the Empyrean player.`,
            },
        ],
        factionTech: [
            {
                name: 'Aetherstream',
                description: `After you or one of your neighbors activates a system that is adjacent to an anomaly, you may apply +1 to the move value of all of that player's ships during this tactical action.`,
                prerequisites: {
                    propulsion: 2,
                },
            },
            {
                name: 'Voidwatch',
                description: `After a player moves ships into a system that contains 1 or more of you units, they must give you 1 promissory note from their hand, if able.`,
                prerequisites: {
                    biotic: 1,
                },
            },
        ],
        flagship: {
            name: 'Dynamo',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `After any player's unit in this system or an adjacent system uses SUSTAIN DAMAGE, you may spend 2 influence to repair that unit.`,
            ],
        },
        mech: {
            name: 'Watcher',
            description: `You may remove this unit from a system that contains or is adjacent to another player's units to cancel an action card played by that player.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Acamar',
                unlock: 'At Game Start',
                ability: `After a player moves ships into a system that does not contain any planets: You may exhaust this card; that player gains 1 command token.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Xuange',
                unlock: 'Be neighbors with all other players',
                ability: `After another player moves ships into a system that contains 1 of your command tokens: You may return that token to your reinforcements.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Conservator Procyon',
                unlock: 'Have 3 Scored Objectives',
                ability: `MULTIVERSE SHIFT\n\nACTION: Place 1 frontier token in each system that does not contain any planets and does not already have a frontier token. Then, explore each frontier token that is in a system that contains 1 or more of your ships.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Mahact Gene Sorcerers',
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 3,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Bio Stims', 'Predictive Intelligences'],
        commodities: 3,
        abilities: [
            {
                name: 'EDICT',
                description: `When you win a combat, place 1 command token from your opponent's reinforcements in your fleet pool if it does not already contain 1 of that player's tokens; other player's tokens in your fleet pool increase your fleet limit but cannot be redistributed.`,
            },
            {
                name: 'IMPERIA',
                description: `While another player's command token is in your fleet pool, you can use the ability of that player's commander, if it is unlocked.`,
            },
            {
                name: 'HUBRIS',
                description: `During setup, purge your "Alliance" promissory note. Other players cannot give you their "Alliance" promissory note.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Sceptor of Dominion',
                description: `At the start of the strategy phase:\n\nChoose 1 non-home system that contains your units; each other player who has a token on the Mahact player's command sheet places a token from their reinforcements in that system.\n\nThen, return this card to the Mahact player.`,
            },
        ],
        factionTech: [
            {
                name: 'Genetic Recombination',
                description: `You may exhaust this card before a player casts votes; that player must cast at least 1 vote for an outcome of your choice or remove 1 token from their fleet pool and return it to their reinforcements.`,
                prerequisites: {
                    biotic: 1,
                },
            },
        ],
        factionUnits: [
            {
                name: 'Crimson Legionnaire I',
                type: UnitType.Infantry,
                cost: [1, 2],
                combat: 8,
                abilities: [
                    `After this unit is destroyed, gain 1 commodity or convert 1 of your commodities to a trade good.`,
                ],
            },
            {
                name: 'Crimson Legionnaire II',
                type: UnitType.Infantry,
                cost: [1, 2],
                combat: 7,
                abilities: [
                    `After this unit is destroyed, gain 1 commodity or convert 1 of your commodities to a trade good. Then, place the unit on this card. At the start of your next turn, place each unit that is on this card on a planet you control in your home system.`,
                ],
                prerequisites: {
                    biotic: 2,
                },
            },
        ],
        flagship: {
            name: 'Arvicon Rex',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                `During combat against an opponent whose command token is not in your fleet pool, apply +2 to the results of this unit's combat rolls.`,
            ],
        },
        mech: {
            name: 'Starlancer',
            description: `After a player whose command token is in your fleet pool activates this system, you may spend their token from your fleet pool to end their turn; they gain that token.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Jae Mir Kan',
                unlock: 'At Game Start',
                ability: `When you would spend a command token during the secondary ability of a strategic action: You may exhaust this card to remove 1 of the active player's command tokens from the board and use it instead.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Il Na Viroset',
                unlock: `Have 2 other factions' command tokens in your fleet pool.`,
                ability: `During your tactical actions, you can activate systems that contain your command tokens. If you do, return both command tokens to your reinforcements and end your turn.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Airo Shir Aur',
                unlock: 'Have 3 Scored Objectives',
                ability: `BENEDICTION\n\nACTION: Move all units in the space area of any system to an adjacent system that contains a different player's ships. Space Combat is resolved in that system; neither player can retreat or resolve abilities that would move their ships.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Naaz-Rokha Alliance',
        startingUnits: {
            [UnitType.Carrier]: 2,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 2,
            [UnitType.Mech]: 1,
            [UnitType.Infantry]: 3,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Psychoarchaeology', 'AI Development Algorithm'],
        commodities: 3,
        abilities: [
            {
                name: 'DISTANT SUNS',
                description: `When you explore a planet that contains 1 of your mechs, you may draw 1 additional card; choose 1 to resolve and descard the rest.`,
            },
            {
                name: 'FABRICATION',
                description: `ACTION: Either purge 2 of your relic fragments of the same type to gain 1 relic; or purge 1 of your relic fragments to gain 1 command token.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Black Market Forgery',
                description: `ACTION: Purge 2 of your relic fragments of the same type to gain 1 relic.\n\nThen return this card to the Naaz-Rokha player.`,
            },
        ],
        factionTech: [
            {
                name: 'Supercharge',
                description: `At the start of a combat round, you may exhaust this card to apply +1 to the result of each of your unit's combat rolls during this combat round.`,
                prerequisites: {
                    warfare: 1,
                },
            },
            {
                name: 'Pre-Fab Arcologies',
                description: `After you explore a planet, ready that planet`,
                prerequisites: {
                    biotic: 3,
                },
            },
        ],
        flagship: {
            name: 'Visz el Vir',
            cost: 8,
            combat: [9, 2],
            move: 1,
            capacity: 4,
            abilities: ['Sustain Damage', `Your mechs in this system roll 1 additional die during combat.`],
        },
        mech: [
            {
                name: 'Eidolon',
                description: `If this unit is in the space area of the active system at the start of a space combat, flip this card. Game starts with this side face up.`,
                abilities: ['Sustain Damage'],
                cost: 2,
                combat: [6, 2],
            },
            {
                name: 'Z-Grav Eidolon',
                description: `If this unit is in the space area of the active system, it is also a ship. At the end of a space battle in the active system, flip this card. No Sustain Damage ability. Game starts with this side face down.`,
                cost: 2,
                combat: [8, 2],
            },
        ],
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Garv and Guun',
                unlock: 'At Game Start',
                ability: `At the end of player's turn: You may exhaust this card to allow that player to explore 1 of their planets.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Dart and Tai',
                unlock: 'Have 3 mechs in 3 systems',
                ability: `After you gain control of a planet that was controlled by another player: You may explore that planet.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Hesh and Prit',
                unlock: 'Have 3 Scored Objectives',
                ability: `PERFECT SYNTHESIS\n\nACTION: Gain 1 relic and perform the secondary ability of up to 2 readied or unchosen strategy cards; during this action, spend command tokens from your reinforcements instead of your strategy pool.\n\nThen, purge this card.`,
            },
        ],
    },

    {
        name: 'The Nomad',
        startingUnits: {
            [UnitType.Flagship]: 1,
            [UnitType.Carrier]: 1,
            [UnitType.Destroyer]: 1,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Sling Relay'],
        commodities: 4,
        abilities: [
            {
                name: 'THE COMPANY',
                description: `During setup, take the 2 additional Nomad faction agents and place them next to your faction sheet; you have 3 agents.`,
            },
            {
                name: 'FUTURE SIGHT',
                description: `During the Agenda phase, after an outcome that you voted for or predicted is resolved, gain 1 trade good.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'The Cavalry',
                description: `At the start of a space combat against a player other than the Nomad:\n\nDuring this combat, treat 1 of your non-fighter ships as if it has the SUSTAIN DAMAGE ability, combat value, and ANTI-FIGHTER BARRAGE value of the Nomad's flagship.\n\nReturn this card to the Nomad player at the end of this combat.`,
            },
        ],
        factionTech: [
            {
                name: 'Temporal Command Suite',
                description: `After any player's agent becomes exhausted, you may exhaust this card to ready that agent; if you ready another player's agent, you may perform a transaction with that player.`,
                prerequisites: {
                    cybernetic: 1,
                },
            },
        ],
        flagship: [
            {
                name: 'Memoria',
                cost: 8,
                combat: [7, 2],
                move: 1,
                capacity: 3,
                abilities: [
                    'Sustain Damage',
                    'Anti-Fighter Barrage 8 (x3)',
                    `You may treat this unit as if it were adjacent to systems that contain one or more of your mechs.`,
                ],
            },
            {
                name: 'Memoria II',
                cost: 8,
                combat: [5, 2],
                move: 2,
                capacity: 6,
                abilities: [
                    'Sustain Damage',
                    'Anti-Fighter Barrage 5 (x3)',
                    `You may treat this unit as if it were adjacent to systems that contain one or more of your mechs.`,
                ],
                prerequisites: {
                    biotic: 1,
                    propulsion: 1,
                    cybernetic: 1,
                },
            },
        ],
        mech: {
            name: 'Quantum Manipulator',
            description: `While this unit is in a space area during combat, you may use it's SUSTAIN DAMAGE ability to cancel a hit that is produced against your ships in this system.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Artuno the Betrayer',
                unlock: `At Game Start`,
                ability: `When you gain trade goods from the supply; You may exhaust this card to place an equal number of goods on this card. When this card readies, gain the trade goods on this card.`,
            },
            {
                type: LeaderType.Agent,
                name: 'Field Marshall Mercer',
                unlock: 'At Game Start',
                ability: `At the end of a player's turn: You may exhaust this card to allow that player to remove up to 2 of their ground forces from the game board and place them on planets they control in the active system.`,
            },
            {
                type: LeaderType.Agent,
                name: 'The Thundarian',
                unlock: 'At Game Start',
                ability: `After the "Roll Dice" step of combat: You may exhaust this card. If you do, hits are not assigned to either players' units. Return to the start of this combat round's "Roll Dice" step.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Navarch Feng',
                unlock: 'Have 1 Scored Secret Objective',
                ability: `You can produce your flagship without spending resources.`,
            },
            {
                type: LeaderType.Hero,
                name: 'Ahk-Syl Siven',
                unlock: 'Have 3 Scored Objectives',
                ability: `PROBABILITY MATRIX\n\nACTION: Place this card near the game board; your flagship and units it transports can move out of systems that contain your command tokens during this game round.\n\nAt the end of that game round, purge this card.`,
            },
        ],
    },

    {
        name: 'The Titans of UI',
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Cruiser]: 2,
            [UnitType.Fighter]: 2,
            [UnitType.Infantry]: 4,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Antimass Deflectors', 'Scanlink Drone Network'],
        commodities: 2,
        abilities: [
            {
                name: 'TERRAGENESIS',
                description: `After you explore a planet that does not have a sleeper token, you may place or move 1 sleepr token onto that planet.`,
            },
            {
                name: 'AWAKEN',
                description: `After you activate a system that contains 1 or more of your sleeper tokens, you may replace each of those tokens with 1 PDS from your reinforcement.`,
            },
            {
                name: 'COALESCENCE',
                description: `If your flagship or your AWAKEN fraction ability places your units into the same space area or onto the same planet as another player's units, your units must participate in combat during "Space Combat" or "Ground Combat" steps.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Terraform',
                description: `ACTION: Attach this card to a non-home planet you control other than Mecatol Rex.\n\nIts resource and influence values are each increased by 1 and it is treated as having all 3 planet traits (Cultural, Hazardous, and Industrial).`,
            },
        ],
        factionUnits: [
            {
                name: 'Saturn Engine I',
                type: UnitType.Cruiser,
                cost: 2,
                combat: 7,
                move: 2,
                capacity: 1,
            },
            {
                name: 'Saturn Engine II',
                type: UnitType.Cruiser,
                cost: 2,
                combat: 6,
                move: 3,
                capacity: 2,
                abilities: ['Sustain Damage'],
                prerequisites: {
                    biotic: 1,
                    cybernetic: 1,
                    warfare: 1,
                },
            },
            {
                name: 'Hel Titan I',
                type: UnitType.PDS,
                combat: 7,
                abilities: [
                    'Planetary Shield',
                    'Space Cannon 6',
                    'Sustain Damage',
                    'Production 1',
                    `This unit is treated as both a structure and a ground force. It cannot be transported.`,
                ],
            },
            {
                name: 'Hel Titan II',
                type: UnitType.PDS,
                combat: 6,
                abilities: [
                    'Planetary Shield',
                    'Space Cannon 5',
                    'Sustain Damage',
                    'Production 1',
                    `This unit is treated as both a structure and a ground force. It cannot be transported.`,
                ],
                prerequisites: {
                    cybernetic: 1,
                    warfare: 1,
                },
            },
        ],
        flagship: {
            name: 'Ouranos',
            cost: 8,
            combat: [7, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                'DEPLOY: After you activate a system that contains 1 or more of your PDS, you may replace 1 of those PDS with this unit.',
            ],
        },
        mech: {
            name: 'Hecatoncheires',
            description: `DEPLOY: When you would place a PDS on a planet, you may place 1 mech and 1 infantry on that planet instead.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'Tellurian',
                unlock: 'At Game Start',
                ability: `When a hit is produced against a unit: You may exhaust this card to cancel that hit.`,
            },
            {
                type: LeaderType.Commander,
                name: 'Tungstantus',
                unlock: 'Have 5 structures on the game board',
                ability: `When 1 or more of your units use PRODUCTION: You may gain 1 trade good.`,
            },
            {
                type: LeaderType.Hero,
                name: 'UI The Progenitor',
                unlock: 'Have 3 Scored Objectives',
                ability: `GEOFORM\n\nACTION: Ready Elysium and attach this card to it. Its resource and influence values are each increased by 3 and it gains the SPACE CANNON 5 (x3) ability as if it were a unit.`,
            },
        ],
    },

    {
        name: "The Vuil'Ratith Cabal",
        startingUnits: {
            [UnitType.Dreadnought]: 1,
            [UnitType.Carrier]: 1,
            [UnitType.Cruiser]: 1,
            [UnitType.Fighter]: 3,
            [UnitType.Infantry]: 3,
            [UnitType.SpaceDock]: 1,
        },
        startingTech: ['Self Assembly Routines'],
        commodities: 2,
        abilities: [
            {
                name: 'DEVOUR',
                description: `Capture your opponent's non-structure units that are destroyed during combat.`,
            },
            {
                name: 'AMALGAMATION',
                description: `When you produce a unit, you may return 1 captured unit of that type to produce that unit without spending resource.`,
            },
            {
                name: 'RIFTMELD',
                description: `When you research a unit upgrade technology, you may return 1 captured unit of that type to ignore all of the technology's prerequisites.`,
            },
        ],
        promissoryNotes: [
            {
                name: 'Crucible',
                description: `After you activate a system:\n\nYour ships do not roll for gravity rifts during this movement; apply an additional +1 to the move values of your ships that would move out of or through a gravity rift instead.\n\nThen, return this card to the Vuil'raith player.`,
            },
        ],
        factionTech: [
            {
                name: 'Vortex',
                description: `ACTION: Exhaust this card to choose another player's non-structure unit in a system that is adjacent to 1 or more of your space docks. Capture 1 unit of that type from that player's reinforcements.`,
                prerequisites: {
                    warfare: 1,
                },
            },
        ],
        factionUnits: [
            {
                name: 'Dimensional Tear I',
                type: UnitType.SpaceDock,
                abilities: [
                    'Production 5',
                    `This system is a gravity rift; your ships do not roll for this gravity rift. Place a dimensional tear token beneath this unit as a reminder.`,
                    `Up to 6 fighters in this system do not count against your ship's capacity.`,
                ],
            },
            {
                name: 'Dimensional Tear II',
                type: UnitType.SpaceDock,
                abilities: [
                    'Production 7',
                    `This system is a gravity rift; your ships do not roll for this gravity rift. Place a dimensional tear token beneath this unit as a reminder.`,
                    `Up to 12 fighters in this system do not count against your ship's capacity.`,
                ],
                prerequisites: {
                    cybernetic: 2,
                },
            },
        ],
        flagship: {
            name: 'The Terror Between',
            cost: 8,
            combat: [5, 2],
            move: 1,
            capacity: 3,
            abilities: [
                'Sustain Damage',
                'Bombardment 5',
                `Capture all other non-structure units that are destroyed in this system, including your own.`,
            ],
        },
        mech: {
            name: 'Reanimator',
            description: `When your infantry on this planet are destroyed, place them on your faction sheet; those units are captured.`,
            abilities: ['Sustain Damage'],
            cost: 2,
            combat: 6,
        },
        leaders: [
            {
                type: LeaderType.Agent,
                name: 'The Stillness of Stars',
                unlock: 'At Game Start',
                ability: `After another player replenishes commodities: You may exhaust this card to convert their commodities to trade goods and capture 1 unit from their reinforcements that has a cost equal to or lower than their commodity value.`,
            },
            {
                type: LeaderType.Commander,
                name: 'That Which Molds Flesh',
                unlock: 'Have units in 3 Gravity Rifts',
                ability: `When you produce fighter or infantry units: Up to 2 of those units do not count against your PRODUCTION limit.`,
            },
            {
                type: LeaderType.Hero,
                name: 'It Feeds on Carrion',
                unlock: 'Have 3 Scored Objectives',
                ability: `DIMENSIONAL ANCHOR\n\nACTION: Each other player rolls a die for each of their non-fighter ships that are in or adjacent to a system that contains a dimensional tear; on a 1-3, capture that unit. If this causes a player's ground forces or fighters to be removed, also capture those units.\n\nThen, purge this card.`,
            },
        ],
    },
];

export default Factions;
