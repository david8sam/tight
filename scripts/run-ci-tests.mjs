import { stripVTControlCharacters } from 'node:util';
import { spawn } from 'node:child_process';

// Publish bounded failure details as a check annotation as well as the full job log.
const mode = process.argv[2] || 'backend';
const command = new Map([
    ['backend', 'npm test'],
    ['browser', 'npx playwright test --fail-on-flaky-tests'],
    ['desktop', 'npx playwright test --config=playwright.desktop.config.ts --fail-on-flaky-tests'],
    ['package', 'node scripts/package-desktop.mjs win32'],
    ['installer', 'node scripts/build-windows-installer.mjs preview'],
    ['installer-lifecycle', 'pwsh.exe -NoProfile -NonInteractive -File scripts/test-windows-installer.ps1'],
]).get(mode);
if (!command) throw new Error('Unknown CI check');
const env = { ...process.env };
if (mode === 'backend') env.NODE_OPTIONS = [env.NODE_OPTIONS, '--test-reporter=spec'].filter(Boolean).join(' ');
const child = spawn(command, { shell: true, stdio: ['inherit', 'pipe', 'pipe'], env });
let tail = '';
function forward(stream, chunk) {
    stream.write(chunk);
    tail = (tail + chunk.toString()).slice(-16000);
}
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', chunk => forward(process.stdout, chunk));
child.stderr.on('data', chunk => forward(process.stderr, chunk));
child.on('error', error => { console.error(error.message); });
child.on('close', code => {
    if (code !== 0 && process.env.GITHUB_ACTIONS === 'true') {
        // GitHub truncates annotation messages at roughly 4 KiB. Keep the final failure summary within it.
        const detail = Buffer.from(stripVTControlCharacters(tail)).subarray(-3500).toString('utf8');
        const message = detail.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
        const title = mode === 'backend' ? 'Backend regression failure' : `${mode} check failure`;
        console.log(`::error title=${title}::${message}`);
    }
    process.exitCode = code ?? 1;
});
