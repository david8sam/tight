export enum LoginStatus {
    LOGGED_OUT,
    LOGOUT_PENDING,
    LOGOUT_ERROR,

    LOGGED_IN,
    LOGIN_PENDING,
    LOGIN_ERROR,
}

export interface Account {
    id: string;
    name: string;
    loggedIn: boolean;
    joinedGame?: string | null;
    invitedGames?: string[];
}

export interface AccountMap {
    [name: string]: Account;
}
