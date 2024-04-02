import { GamePlanet } from 'common/Game';
import { Planet } from 'common/Planet';

// Combination of Planet and GamePlanet
export interface PlanetData extends Planet, GamePlanet {
    name: string;
}

export type AppTheme = 'light' | 'dark';
