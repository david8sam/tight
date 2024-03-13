import fs from 'fs';
import path from 'path';

import { Account, AccountMap, AccountSettings, BaseAccountMap, DEFAULT_SETTINGS } from 'common/Account.js';

import { getAccountsDir, load, save } from '../appData.js';

let _accounts: AccountMap = {};

export function initialize() {
    if (!_accounts) {
        loadAccounts();
    }
}

export function loadAccounts() {
    load(getAccountsDir(), _accounts);
}

export function saveAccounts() {
    save(getAccountsDir(), _accounts);
}

export function deleteAccounts(ids: string[] | 'all') {
    const accountsDir = getAccountsDir();
    if (ids === 'all') {
        fs.unlinkSync(accountsDir);
    } else {
        ids.forEach(id => {
            // delete account and file
            delete _accounts[id];
            fs.unlinkSync(path.join(accountsDir, id));
        });
    }
}

/**
 * List full account details
 */
export function listAccounts() {
    return _accounts;
}

/**
 * List only basic account details
 */
export function listAccountsInfo(): BaseAccountMap {
    return Object.values(_accounts).reduce((r, a) => {
        const { id, name, loggedIn, joinedGame } = a;
        r[a.id] = { id, name, loggedIn, joinedGame };
        return r;
    }, {} as BaseAccountMap);
}

type AddAccountOptions = {
    name?: string;
    settings?: Partial<AccountSettings>;
};

export function addAccount(id: string, options?: AddAccountOptions): boolean {
    if (!id) {
        return false;
    }

    if (!_accounts[id]) {
        _accounts[id] = {
            // Default values
            id,
            name: id,
            loggedIn: true,
            joinedGame: null,
            // Override from options
            ...options,
            settings: { ...DEFAULT_SETTINGS, ...options?.settings },
        };
    }

    return true;
}

export function deleteAccount(id: string): boolean {
    if (!id || !_accounts[id]) {
        return false;
    }

    delete _accounts[id];
    return true;
}

export function getAccount(id: string): Account | null {
    return _accounts[id] || null;
}

export function login(id: string, options?: AddAccountOptions): boolean {
    const added = addAccount(id, options);
    if (_accounts[id]) {
        _accounts[id].loggedIn = true;
    }

    return added;
}

export function logout(id: string): boolean {
    const account = _accounts[id];
    if (!account) {
        return false;
    }

    account.loggedIn = false;
    account.joinedGame = null;
    return true;
}
