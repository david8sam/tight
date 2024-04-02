import { useAppContext } from '../Context';

export default function useGameInfo() {
    const {
        state: { game, playerId, strategyCards },
    } = useAppContext();

    const gameId = game?.id;
    return { gameId, game, playerId, strategyCards };
}
