import fs from 'fs';
import path from 'path';

import { Account, AccountMap, AccountSettings, DEFAULT_SETTINGS } from 'common/Account';

import { getHomeDir } from '../appData';

const ACCOUNTS_FILE = path.join(getHomeDir(), 'accounts.json');
console.log(`accounts file: ${ACCOUNTS_FILE}`);

let _accounts: AccountMap = {};

export function initialize() {
    if (_accounts) {
        return;
    }

    const accountsData: string = fs.existsSync(ACCOUNTS_FILE)
        ? fs.readFileSync(ACCOUNTS_FILE, { encoding: 'utf-8' })
        : '{}';

    _accounts = JSON.parse(accountsData);
}

function save() {
    const data = JSON.stringify(_accounts);
    // fs.writeFileSync(ACCOUNTS_FILE, data);
}

export function listAccounts() {
    return _accounts;
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
