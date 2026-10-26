import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { windowsInstallerConfig } from '../scripts/windows-installer-config.mjs';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
test('preview installers are per-user, preserve saves, and cannot accidentally use release signing credentials', () => {
    const config = windowsInstallerConfig('/project', manifest, 'preview', {});
    assert.equal(config.forceCodeSigning, false);
    assert.equal(config.win.signAndEditExecutable, false);
    assert.equal(config.nsis.perMachine, false);
    assert.equal(config.nsis.allowElevation, false);
    assert.equal(config.nsis.deleteAppDataOnUninstall, false);
    assert.equal(config.publish, null);
    assert.match(config.artifactName, /preview-setup/);
    for (const variable of ['CSC_LINK', 'WIN_CSC_LINK', 'CSC_NAME', 'CSC_KEY_PASSWORD', 'WIN_CSC_KEY_PASSWORD'])
        assert.throws(() => windowsInstallerConfig('/project', manifest, 'preview', { [variable]: 'test' }), /must be unsigned/);
});
test('release installers fail closed without publisher credentials and a completed rights-review reference', () => {
    assert.throws(() => windowsInstallerConfig('/project', manifest, 'other', {}), /preview or release/);
    assert.throws(() => windowsInstallerConfig('/project', manifest, 'release', {}), /publisher credentials/);
    assert.throws(() => windowsInstallerConfig('/project', manifest, 'release', { CSC_LINK: 'relative.pfx', CSC_KEY_PASSWORD: 'password' }), /absolute path/);
    const credentials = { CSC_LINK: path.resolve('publisher-certificate.pfx'), CSC_KEY_PASSWORD: 'publisher-password' };
    for (const reference of [undefined, '', 'http://example.test/review', 'https://user:pass@example.test/review'])
        assert.throws(() => windowsInstallerConfig('/project', manifest, 'release', { ...credentials, TIGHT_RIGHTS_REVIEW_URL: reference }), /completed distribution-rights review/);
    const config = windowsInstallerConfig('/project', manifest, 'release', { ...credentials, TIGHT_RIGHTS_REVIEW_URL: 'https://example.test/completed-review' });
    assert.equal(config.forceCodeSigning, true);
    assert.equal(config.win.signAndEditExecutable, true);
    assert.match(config.artifactName, /release-setup/);
});

test('release signing rejects competing aliases that could select another publisher for the installer', () => {
    const credentials = { CSC_LINK: path.resolve('publisher.pfx'), CSC_KEY_PASSWORD: 'password', TIGHT_RIGHTS_REVIEW_URL: 'https://example.test/completed-review' };
    for (const variable of ['WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD', 'CSC_NAME'])
        assert.throws(() => windowsInstallerConfig('/project', manifest, 'release', { ...credentials, [variable]: 'competing-publisher' }), /competing signing/);
});
