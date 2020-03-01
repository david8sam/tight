import { LoginStatus } from 'common/Account';
import { useAppContext } from '../Context';

export default function useAccountInfo() {
    const {
        state: { accounts, games, accountId, loginStatus },
    } = useAppContext();

    const account = accountId && accounts && accounts[accountId];
    const gameId = account && account.joinedGame;
    const game = gameId && games[gameId];
    const player = accountId && game && game.players && game.players[accountId];

    return { loggedIn: loginStatus === LoginStatus.LOGGED_IN, account, gameId, game, playerId: accountId, player };
}
