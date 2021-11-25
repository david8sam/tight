import fs from 'fs';
import path from 'path';

// TODO: Save stuff to appdata

export function getHomeDir(): string {
    return process.env.APPDATA || process.env.HOME || '';
}

export default function initialize() {
    const homeDir = getHomeDir();
    const appDir = homeDir && path.join(homeDir, 'tight');

    if (!appDir || !fs.existsSync(appDir)) {
        console.log(`Creating app directory at: "${appDir}"`);
        fs.mkdirSync(appDir);
    }
}
