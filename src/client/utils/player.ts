import { Theme } from '@mui/material';
import { blue, deepPurple, green, orange, red, yellow } from '@mui/material/colors';

import { GamePlayer } from 'common/Game';

export const PlayerColor = {
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

export type PlayerColorKey = keyof typeof PlayerColor;
export type PlayerColorValue = (typeof PlayerColor)[PlayerColorKey];

export function getPlayerColors(theme: Theme, player: GamePlayer): { color: string; backgroundColor: string } {
    const playerColor = player.color || '#fff';
    const color = theme.palette.getContrastText(playerColor);
    const backgroundColor = playerColor;
    return { color, backgroundColor };
}
