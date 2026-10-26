import { Theme } from '@mui/material';

import { GameFaction } from 'common/Game';

export { FactionColor, FactionColorKey, FactionColorValue } from 'common/colors';

export function getFactionColors(theme: Theme, faction: GameFaction): { color: string; backgroundColor: string } {
    const playerColor = faction.color === 'None' ? '#fff' : faction.color || '#fff';
    const color = theme.palette.getContrastText(playerColor);
    const backgroundColor = playerColor;
    return { color, backgroundColor };
}
