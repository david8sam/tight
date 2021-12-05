export enum LoginStatus {
    LOGGED_OUT,
    LOGOUT_PENDING,
    LOGOUT_ERROR,

    LOGGED_IN,
    LOGIN_PENDING,
    LOGIN_ERROR,
}

export type AppTheme = 'light' | 'dark';

export type AccountSettings = {
    theme: AppTheme; // MUI theme
};

export const DEFAULT_SETTINGS: AccountSettings = {
    theme: 'light',
} as const;

export interface BaseAccount {
    id: string; // unique id
    name: string; // display name
    loggedIn: boolean;
    joinedGame: string | null;
}

export type BaseAccountMap = Record<string, BaseAccount>;

export interface Account extends BaseAccount {
    settings: AccountSettings;
}

export type AccountMap = Record<string, Account>;
