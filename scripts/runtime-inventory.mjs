import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Inventory the production dependency closure, including packages bundled into browser assets. */
export async function writeRuntimeInventory(root, destination) {
    const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
    const packages = [];
    const notices = ['TIGHT third-party dependency notices',
        'Production dependency closure from package-lock.json. This is a superset of the bundled code.',
        'Electron and Chromium notices are distributed separately by Electron.', ''];
    for (const [location, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
        if (!location || entry.dev) continue;
        const directory = path.join(root, location);
        const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
        if (manifest.version !== entry.version) throw new Error(`Dependency version mismatch: ${location}`);
        const files = (await readdir(directory)).filter(name => /^(licen[cs]e|copying|notice)([.-]|$)/i.test(name)).sort();
        // cookie-signature publishes its complete MIT notice inside its README.
        if (!files.length && manifest.name === 'cookie-signature') files.push('Readme.md');
        // This release omitted its license file. Keep the upstream project's notice alongside our source.
        const supplemental = manifest.name === 'is-in-browser' && manifest.version === '1.1.3'
            ? path.join(root, 'docs', 'licenses', 'is-in-browser-1.1.3.txt') : null;
        if (!files.length && !supplemental) throw new Error(`Missing dependency notice: ${location}`);
        packages.push({ name: manifest.name, version: entry.version, license: entry.license || manifest.license,
            location, integrity: entry.integrity, resolved: entry.resolved });
        notices.push(`\n${manifest.name}@${entry.version}\n${'='.repeat(72)}`);
        for (const file of files) notices.push(`\n${file}\n${await readFile(path.join(directory, file), 'utf8')}`);
        if (supplemental) notices.push(await readFile(supplemental, 'utf8'));
    }
    await writeFile(path.join(destination, 'runtime-dependencies.json'), JSON.stringify({
        format: 'tight-runtime-inventory', version: 1, applicationVersion: lock.version, packages,
    }, null, 2) + '\n');
    await writeFile(path.join(destination, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n'));
}
