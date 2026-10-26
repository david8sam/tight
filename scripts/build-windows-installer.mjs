import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { build, Platform, Arch } from 'electron-builder';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { windowsInstallerConfig } from './windows-installer-config.mjs';

const root = path.resolve(import.meta.dirname, '..');
const mode = process.argv[2] || 'preview';
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const config = windowsInstallerConfig(root, manifest, mode);
if (process.platform !== 'win32') throw new Error('Build Windows installers on Windows.');
const packaged = path.join(root, 'release', 'TIGHT-win32-x64');
for (const name of ['TIGHT.exe', 'resources/app.asar', 'TIGHT-LICENSE.txt', 'THIRD-PARTY-NOTICES.txt', 'runtime-dependencies.json'])
    await access(path.join(packaged, name));
const artifacts = await build({ projectDir: root, targets: Platform.WINDOWS.createTarget('nsis', Arch.x64), prepackaged: packaged, config, publish: 'never' });
if (mode === 'release') {
    const installer = artifacts.find(file => file.endsWith('-release-setup.exe'));
    if (!installer) throw new Error('The signed release installer was not produced.');
    await promisify(execFile)('pwsh.exe', ['-NoProfile', '-NonInteractive', '-File',
        path.join(root, 'scripts', 'verify-windows-release-signatures.ps1'),
        '-AppDirectory', packaged, '-InstallerPath', installer]);
}
for (const artifact of artifacts) console.log(`Windows ${mode} installer: ${artifact}`);
