import { Theme } from '@mui/material';
import { blue, deepPurple, green, orange, red, yellow } from '@mui/material/colors';
import { alpha, darken, getContrastRatio, lighten } from '@mui/material/styles';

import { GameFaction } from 'common/Game';

export const FactionColor = {
    RED: red.A700,
    YELLOW: yellow[500],
    GREEN: green[500],
    BLUE: blue.A700,
    PURPLE: deepPurple[500],
    BLACK: '#000',
    // Prophecy of Kings
    ORANGE: orange[500],
    MAGENTA: '#D80073',
} as const;

export type FactionColorKey = keyof typeof FactionColor;
export type FactionColorValue = (typeof FactionColor)[FactionColorKey];

export interface FactionPalette {
    /** Contrast text for use on top of `backgroundColor` (legacy key, same as `on`) */
    color: string;
    /** The raw faction color (legacy key, same as `base`) */
    backgroundColor: string;

    /** The raw faction color */
    base: string;
    /** Accessible text color on top of `base` */
    on: string;
    /** Faction color adjusted to stay visible against the current background (e.g. black on dark) */
    readable: string;
    /** Translucent fill for pills/badges */
    tint: string;
    /** Translucent border/ring color */
    border: string;
    /** Box-shadow ring for "active" emphasis */
    glow: string;
}

const MIN_CONTRAST = 3;

/**
 * Adjust a faction color until it is visible against the theme's paper background — e.g. the
 * BLACK faction color is invisible on the dark theme's panels without lightening.
 */
export function getReadableFactionColor(theme: Theme, color: string): string {
    let readable = color;

    for (let i = 0; i < 10 && getContrastRatio(readable, theme.palette.background.paper) < MIN_CONTRAST; i++) {
        readable = theme.palette.mode === 'dark' ? lighten(readable, 0.15) : darken(readable, 0.15);
    }

    return readable;
}

export function getFactionColors(theme: Theme, faction: GameFaction): FactionPalette {
    const base = !faction.color || faction.color === 'None' ? '#fff' : faction.color;
    const on = theme.palette.getContrastText(base);
    const readable = getReadableFactionColor(theme, base);

    return {
        color: on,
        backgroundColor: base,
        base,
        on,
        readable,
        tint: alpha(readable, 0.14),
        border: alpha(readable, 0.35),
        glow: `0 0 0 1px ${alpha(readable, 0.35)}`,
    };
}
