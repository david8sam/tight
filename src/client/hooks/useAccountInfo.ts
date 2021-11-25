import { LoginStatus } from 'common/Account';
import { useAppContext } from '../Context';

export default function useAccountInfo() {
    const {
        state: { accounts, games, accountId, loginStatus },
    } = useAppContext();

    const account = accountId && accounts ? accounts[accountId] : null;
    const gameId = account && account.joinedGame;
    const game = gameId ? games[gameId] : null;
    const player = accountId && game && game.players ? game.players[accountId] : null;

    return { loggedIn: loginStatus === LoginStatus.LOGGED_IN, account, gameId, game, playerId: accountId, player };
}
