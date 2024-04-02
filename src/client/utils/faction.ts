import { Theme } from '@mui/material';
import { blue, deepPurple, green, orange, red, yellow } from '@mui/material/colors';

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

export function getFactionColors(theme: Theme, faction: GameFaction): { color: string; backgroundColor: string } {
    const playerColor = faction.color || '#fff';
    const color = theme.palette.getContrastText(playerColor);
    const backgroundColor = playerColor;
    return { color, backgroundColor };
}
