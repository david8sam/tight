/**
 * Design tokens for the TIGHT design system.
 *
 * Primitive values are named once here; the semantic `GameTokens` set is attached to the MUI theme
 * as `theme.game` (see theme/index.ts) so every component pulls game-specific colors — planet
 * traits, tech specialties, resource/influence, layered surfaces — from one themeable source
 * instead of inventing hex codes locally.
 */

export interface StatToken {
    /** Primary color, used for icons and emphasis */
    main: string;
    /** Softened variant, used for numbers/text on busy surfaces */
    soft: string;
}

export interface GameTokens {
    /** Planet resources */
    resource: StatToken;
    /** Planet influence */
    influence: StatToken;
    /** Speaker token / crown gold */
    speaker: string;

    /** Planet type — keys match the Traits enum in common/Planet.ts */
    trait: {
        CULTURAL: string;
        HAZARDOUS: string;
        INDUSTRIAL: string;
    };

    /** Tech specialty skips + legendary — keys match the Planet fields in common/Planet.ts */
    specialty: {
        biotic: string;
        warfare: string;
        propulsion: string;
        cybernetic: string;
        legendary: string;
    };

    /** Layered surfaces on top of background.default / background.paper (toolbars, selected rows) */
    surface: {
        strip: string;
        highlight: string;
    };

    /** State opacities for dimmed game elements */
    opacity: {
        exhausted: number;
        passed: number;
    };

    /** Radii used by the ui/ primitives (theme.shape.borderRadius stays for stock MUI components) */
    radius: {
        card: number;
        control: number;
        pill: number;
    };
}

const radius = { card: 10, control: 7, pill: 999 };

export const DARK_GAME_TOKENS: GameTokens = {
    resource: { main: '#5C8DEA', soft: '#8FB2F2' },
    influence: { main: '#D9A23B', soft: '#E8C171' },
    speaker: '#D9A23B',
    trait: { CULTURAL: '#5C9BE0', HAZARDOUS: '#E0654E', INDUSTRIAL: '#5FA84B' },
    specialty: {
        biotic: '#3DBE8B',
        warfare: '#E5484D',
        propulsion: '#5C8DEA',
        cybernetic: '#E0A93B',
        legendary: '#E8C171',
    },
    surface: { strip: '#10162A', highlight: '#18203A' },
    opacity: { exhausted: 0.5, passed: 0.78 },
    radius,
};

export const LIGHT_GAME_TOKENS: GameTokens = {
    resource: { main: '#2C4A8C', soft: '#5C77B5' },
    influence: { main: '#A8721E', soft: '#C99440' },
    speaker: '#A8721E',
    trait: { CULTURAL: '#2D6FA3', HAZARDOUS: '#B84A31', INDUSTRIAL: '#3E7A2E' },
    specialty: {
        biotic: '#2E8B6B',
        warfare: '#C62828',
        propulsion: '#2C4A8C',
        cybernetic: '#A8721E',
        legendary: '#8A6A14',
    },
    surface: { strip: '#E7EAF3', highlight: '#DEE6F7' },
    opacity: { exhausted: 0.45, passed: 0.7 },
    radius,
};

declare module '@mui/material/styles' {
    interface Theme {
        game: GameTokens;
    }
    interface ThemeOptions {
        game?: GameTokens;
    }
}
