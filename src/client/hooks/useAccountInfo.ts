import { LoginStatus } from 'common/Account';
import { useAppContext } from '../Context';

export default function useAccountInfo() {
    const {
        state: { account, games, loginStatus },
    } = useAppContext();

    const gameId = account && account.joinedGame;
    const game = gameId ? games[gameId] : null;
    const accountId = account?.id;
    const player = accountId && game?.players ? game.players[accountId] : null;

    return { loggedIn: loginStatus === LoginStatus.LOGGED_IN, account, gameId, game, playerId: accountId, player };
}
