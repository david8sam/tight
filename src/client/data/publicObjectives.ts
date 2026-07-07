/**
 * Official TI4 (base + Prophecy of Kings) public objectives, used to populate the
 * objective picker when creating a game. Stage I objectives are worth 1 VP, Stage II 2 VP.
 *
 * Stored game objectives remain free-form `{ id, description, vp }` (see common/Game.ts) —
 * picking from this catalog just fills the description as "Name — text", so custom objectives
 * still work everywhere.
 */

export interface PublicObjectiveEntry {
    name: string;
    description: string;
    /** 1 = Stage I, 2 = Stage II */
    vp: 1 | 2;
}

export const STAGE_I_OBJECTIVES: PublicObjectiveEntry[] = [
    { name: 'Amass Wealth', description: 'Spend 3 influence, 3 resources, and 3 trade goods.', vp: 1 },
    { name: 'Build Defenses', description: 'Have 4 or more structures.', vp: 1 },
    { name: 'Corner the Market', description: 'Control 4 planets that each have the same planet trait.', vp: 1 },
    { name: 'Develop Weaponry', description: 'Own 2 unit upgrade technologies.', vp: 1 },
    { name: 'Discover Lost Outposts', description: 'Control 2 planets that have attachments.', vp: 1 },
    { name: 'Diversify Research', description: 'Own 2 technologies in each of 2 colors.', vp: 1 },
    { name: 'Engineer a Marvel', description: 'Have your flagship or war sun on the game board.', vp: 1 },
    { name: 'Erect a Monument', description: 'Spend 8 resources.', vp: 1 },
    { name: 'Expand Borders', description: 'Control 6 planets in non-home systems.', vp: 1 },
    { name: 'Explore Deep Space', description: 'Have units in 3 systems that do not contain planets.', vp: 1 },
    { name: 'Found Research Outposts', description: 'Control 3 planets that have technology specialties.', vp: 1 },
    { name: 'Improve Infrastructure', description: 'Have structures on 3 planets outside of your home system.', vp: 1 },
    {
        name: 'Intimidate the Council',
        description: 'Have 1 or more ships in 2 systems that are adjacent to Mecatol Rex.',
        vp: 1,
    },
    {
        name: 'Lead from the Front',
        description: 'Spend a total of 3 tokens from your tactic and/or strategy pools.',
        vp: 1,
    },
    {
        name: 'Make History',
        description: 'Have units in 2 systems that contain legendary planets, Mecatol Rex, or anomalies.',
        vp: 1,
    },
    { name: 'Negotiate Trade Routes', description: 'Spend 5 trade goods.', vp: 1 },
    {
        name: 'Populate the Outer Rim',
        description: 'Have units in 3 systems on the edge of the game board other than your home system.',
        vp: 1,
    },
    { name: 'Push Boundaries', description: 'Control more planets than each of 2 of your neighbors.', vp: 1 },
    { name: 'Raise a Fleet', description: 'Have 5 or more non-fighter ships in 1 system.', vp: 1 },
    { name: 'Sway the Council', description: 'Spend 8 influence.', vp: 1 },
];

export const STAGE_II_OBJECTIVES: PublicObjectiveEntry[] = [
    {
        name: 'Achieve Supremacy',
        description: "Have your flagship or war sun in another player's home system or the Mecatol Rex system.",
        vp: 2,
    },
    {
        name: 'Become a Legend',
        description: 'Have units in 4 systems that contain legendary planets, Mecatol Rex, or anomalies.',
        vp: 2,
    },
    { name: 'Centralize Galactic Trade', description: 'Spend 10 trade goods.', vp: 2 },
    { name: 'Command an Armada', description: 'Have 8 or more non-fighter ships in 1 system.', vp: 2 },
    { name: 'Conquer the Weak', description: "Control 1 planet that is in another player's home system.", vp: 2 },
    { name: 'Construct Massive Cities', description: 'Have 7 or more structures.', vp: 2 },
    {
        name: 'Control the Borderlands',
        description: 'Have units in 5 systems on the edge of the game board other than your home system.',
        vp: 2,
    },
    {
        name: 'Form Galactic Brain Trust',
        description: 'Control 5 planets that have technology specialties.',
        vp: 2,
    },
    { name: 'Found a Golden Age', description: 'Spend 16 resources.', vp: 2 },
    {
        name: 'Galvanize the People',
        description: 'Spend a total of 6 tokens from your tactic and/or strategy pools.',
        vp: 2,
    },
    { name: 'Hold Vast Reserves', description: 'Spend 6 influence, 6 resources, and 6 trade goods.', vp: 2 },
    { name: 'Manipulate Galactic Law', description: 'Spend 16 influence.', vp: 2 },
    { name: 'Master the Sciences', description: 'Own 2 technologies in each of 4 colors.', vp: 2 },
    { name: 'Patrol Vast Territories', description: 'Have units in 5 systems that do not contain planets.', vp: 2 },
    {
        name: 'Protect the Border',
        description: 'Have structures on 5 planets outside of your home system.',
        vp: 2,
    },
    { name: 'Reclaim Ancient Monuments', description: 'Control 3 planets that have attachments.', vp: 2 },
    { name: 'Revolutionize Warfare', description: 'Own 3 unit upgrade technologies.', vp: 2 },
    {
        name: 'Rule Distant Lands',
        description: "Control 2 planets that are each in or adjacent to a different, other player's home system.",
        vp: 2,
    },
    { name: 'Subdue the Galaxy', description: 'Control 11 planets in non-home systems.', vp: 2 },
    { name: 'Unify the Colonies', description: 'Control 6 planets that each have the same planet trait.', vp: 2 },
];

export const ALL_PUBLIC_OBJECTIVES: PublicObjectiveEntry[] = [...STAGE_I_OBJECTIVES, ...STAGE_II_OBJECTIVES];
