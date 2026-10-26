import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { collectBuildIdentity } from '../scripts/build-identity.mjs';
import { readBuildIdentity } from '../desktop/build-identity.cjs';

test('build identity follows a real clean or modified checkout and rejects an ancestor repository', async t => {
    const root = await mkdtemp(path.join(tmpdir(), 'tight source 银河-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    git(['init', '--object-format=sha1']);
    await writeFile(path.join(root, 'source.txt'), 'initial');
    git(['add', 'source.txt']);
    git(['-c', 'commit.gpgsign=false', '-c', 'user.name=Build test', '-c', 'user.email=build@example.test', 'commit', '-m', 'fixture']);
    const revision = git(['rev-parse', 'HEAD']);
    assert.deepEqual(collectBuildIdentity(root), { revision, modified: false });
    await writeFile(path.join(root, 'source.txt'), 'changed');
    assert.deepEqual(collectBuildIdentity(root), { revision, modified: true });
    git(['checkout', '--', 'source.txt']);
    await writeFile(path.join(root, 'new-source.txt'), 'untracked source');
    assert.deepEqual(collectBuildIdentity(root), { revision, modified: true });
    const archive = path.join(root, 'archive');
    await mkdir(archive);
    assert.deepEqual(collectBuildIdentity(archive), { revision: null, modified: null });
});

test('runtime build metadata is bounded, validated, and limited to revision and modified status', async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight build metadata-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const file = path.join(directory, 'build.json');
    const unknown = { revision: null, modified: null };
    assert.deepEqual(readBuildIdentity(file), unknown);
    for (const value of ['not JSON', JSON.stringify({ revision: 'SECRET', modified: false }), 'x'.repeat(1025), JSON.stringify({ revision: 'b'.repeat(40), modified: 'false' })]) {
        await writeFile(file, value);
        assert.deepEqual(readBuildIdentity(file), unknown);
    }
    await writeFile(file, JSON.stringify({ revision: 'b'.repeat(40), modified: false, path: 'SECRET' }));
    assert.deepEqual(readBuildIdentity(file), { revision: 'b'.repeat(40), modified: false });
});
