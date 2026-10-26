import { useSession } from '../SessionGate';
import { useAppContext } from '../Context';

export default function useGameInfo() {
    const {
        state: { game, playerId, strategyCards, pendingCommands },
    } = useAppContext();

    const session = useSession();
    const isHost = session.role === 'host';
    const canEditTable = isHost || (session.role === 'player' && session.gameId === game?.id && session.tableEditing === true);
    const canEditSecretFaction = (name: string | null) =>
        pendingCommands === 0 &&
        Boolean(name) &&
        (isHost ||
            (session.role === 'player' &&
                session.gameId === game?.id &&
                game.factions.some(faction => faction.name === name && faction.playerIds.includes(session.playerId))));
    const canEditPublicFaction = (name: string | null) =>
        pendingCommands === 0 && Boolean(name) && (canEditTable || canEditSecretFaction(name));
    const gameId = game?.id;
    return { gameId, game, playerId, strategyCards, session, isHost, canEditTable, canEditPublicFaction, canEditSecretFaction };
}
