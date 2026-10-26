import { collectBuildIdentity } from './build-identity.mjs';
import { windowsInstallerConfig } from './windows-installer-config.mjs';
import { writeRuntimeInventory } from './runtime-inventory.mjs';
import { packager } from '@electron/packager';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const platform = process.argv[2] || 'win32';
if (!['win32', 'linux'].includes(platform)) throw new Error('Supported package targets: win32, linux');
const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const mode = process.argv[3] || 'preview';
if (platform === 'win32') windowsInstallerConfig(root, manifest, mode);
else if (mode !== 'preview') throw new Error('Release packages target Windows only.');
const stage = path.join(root, '.desktop-stage');
await rm(stage, { recursive: true, force: true });
await mkdir(path.join(stage, 'build'), { recursive: true });
try {
    await writeRuntimeInventory(root, stage);
    await cp(path.join(root, 'LICENSE'), path.join(stage, 'TIGHT-LICENSE.txt'));
    await cp(path.join(root, 'desktop'), path.join(stage, 'desktop'), { recursive: true });
    await writeFile(path.join(stage, 'desktop', 'build-identity.json'), JSON.stringify(collectBuildIdentity(root)));
    await cp(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
    await cp(path.join(root, 'build', 'desktop-backend.js'), path.join(stage, 'build', 'desktop-backend.js'));
    await writeFile(
        path.join(stage, 'package.json'),
        JSON.stringify(
            {
                name: 'tight',
                productName: 'TIGHT',
                version: manifest.version,
                description: manifest.description,
                main: 'desktop/main.cjs',
                type: 'module',
            },
            null,
            2,
        ),
    );
    const outputs = await packager({
        dir: stage,
        out: path.join(root, 'release'),
        name: 'TIGHT',
        platform,
        arch: 'x64',
        electronVersion: manifest.devDependencies.electron,
        overwrite: true,
        download: { cacheRoot: process.env.electron_config_cache },
        asar: true,
        prune: false,
        executableName: 'TIGHT',
        appBundleId: 'org.alvinxiao.tight',
        icon: path.join(root, 'desktop', 'icon.ico'),
        windowsSign: platform === 'win32' && mode === 'release' ? {
            certificateFile: process.env.CSC_LINK, certificatePassword: process.env.CSC_KEY_PASSWORD, hashes: ['sha256'],
        } : undefined,
        win32metadata: { CompanyName: 'TIGHT', FileDescription: 'TIGHT game helper', ProductName: 'TIGHT' },
    });
    for (const output of outputs) {
        for (const name of ['runtime-dependencies.json', 'THIRD-PARTY-NOTICES.txt', 'TIGHT-LICENSE.txt'])
            await cp(path.join(stage, name), path.join(output, name));
        console.log(`Packaged desktop app: ${output}`);
    }
} finally {
    await rm(stage, { recursive: true, force: true });
}
