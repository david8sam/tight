import fs from 'fs';
import path from 'path';

// TODO: Save stuff to appdata

export function getHomeDir(): string {
    return process.env.APPDATA || process.env.HOME || '';
}

export function getAccountsDir(): string {
    return path.join(getHomeDir(), 'accounts');
}

export function getGamesDir(): string {
    return path.join(getHomeDir(), 'games');
}

export default function initialize() {
    const homeDir = getHomeDir();
    const appDir = homeDir && path.join(homeDir, 'tight');

    if (!appDir || !fs.existsSync(appDir)) {
        console.log(`Creating app directory at: "${appDir}"`);
        fs.mkdirSync(appDir);
    }
}

export function load<T>(dir: string, map: Record<string, T>): string[] {
    const ids: string[] = [];
    const files = fs.readdirSync(dir, 'utf-8');
    files.forEach(f => {
        try {
            const id = path.parse(f).name;
            const contents = fs.readFileSync(f, 'utf-8');
            const data = JSON.parse(contents) as T;
            map[id] = data;
            ids.push(id);
        } catch {
            // skip
        }
    });

    return ids;
}

export function save<T>(dir: string, map: Record<string, T>): string[] {
    const ids: string[] = [];
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    if (!fs.existsSync(dir)) {
        return ids;
    }

    Object.entries(map).forEach(([id, data]) => {
        try {
            const contents = JSON.stringify(data, undefined, 4);
            const filename = path.join(dir, `${id}.json`);
            const file = fs.openSync(filename, 'w');
            fs.writeFileSync(file, contents, 'utf-8');
            fs.closeSync(file);
            ids.push(id);
        } catch {
            // skip
        }
    });

    return ids;
}
