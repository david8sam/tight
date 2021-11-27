import { GamePlanet } from 'common/Game';
import { Planet } from 'common/Planet';

// Common Client Types

// Combination of Planet and GamePlanet
export interface PlanetData extends Planet, GamePlanet {
    name: string;
}
