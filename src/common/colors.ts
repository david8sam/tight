export const FactionColor = {
    RED: '#d50000',
    YELLOW: '#ffeb3b',
    GREEN: '#4caf50',
    BLUE: '#2962ff',
    PURPLE: '#673ab7',
    BLACK: '#000',
    ORANGE: '#ff9800',
    MAGENTA: '#D80073',
} as const;

export type FactionColorKey = keyof typeof FactionColor;
export type FactionColorValue = (typeof FactionColor)[FactionColorKey];
