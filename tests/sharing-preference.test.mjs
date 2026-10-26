import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const {
    readSharingPreference,
    writeSharingPreference,
    createSharingPreferences,
} = require('../desktop/sharing-preference.cjs');
const selected = { name: 'Wi-Fi', address: '192.168.1.7' };
async function fixture(t) {
    const directory = await mkdtemp(path.join(tmpdir(), 'tight-sharing-preference-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return path.join(directory, 'sharing.json');
}
function host(interfaces = [selected]) {
    const calls = [];
    let address = null;
    return {
        calls,
        request: async (value, change) => {
            calls.push({ address: value, change });
            if (change) address = value;
            return { mode: address ? 'lan' : 'local', address, interfaces };
        },
    };
}

test('remembered sharing is consumed before binding and saved again only on graceful quit', async t => {
    const file = await fixture(t);
    writeSharingPreference(file, selected);
    const backend = host();
    const controller = createSharingPreferences(file, async (address, change) => {
        if (change) assert.deepEqual(readSharingPreference(file), { kind: 'none' });
        return backend.request(address, change);
    });
    assert.equal(await controller.restore(), null);
    assert.deepEqual(backend.calls, [
        { address: null, change: false },
        { address: selected.address, change: true },
    ]);
    assert.deepEqual(
        readSharingPreference(file),
        { kind: 'none' },
        'a crash after restoration cannot replay old consent',
    );
    const afterCrash = host();
    await createSharingPreferences(file, afterCrash.request).restore();
    assert.deepEqual(afterCrash.calls, [], 'a new process cannot restore consumed approval after a crash');
    assert.equal(await controller.prepareQuit(), true);
    assert.deepEqual(readSharingPreference(file), { kind: 'selected', adapter: selected });
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), { version: 1, adapter: selected });
    assert.equal(await controller.prepareQuit(), true);
    await assert.rejects(controller.change(selected.address), /stopping/);
});

test('a stop forgets active approval without a filesystem write and a temporary listener stop preserves it', async t => {
    const file = await fixture(t);
    writeSharingPreference(file, selected);
    const backend = host();
    const controller = createSharingPreferences(file, backend.request);
    await controller.restore();
    await backend.request(null, true);
    assert.equal(await controller.restore(), null, 'a temporary suspend can restore the in-memory approval');
    assert.equal(backend.calls.at(-1).address, selected.address);
    await backend.request(null, true);
    await controller.change(null);
    assert.equal(await controller.restore(), null, 'resume must respect an explicit Stop after suspension');
    assert.equal(backend.calls.at(-1).address, null);
    assert.equal(await controller.prepareQuit(), true);
    assert.deepEqual(readSharingPreference(file), { kind: 'none' });
    const reopened = host();
    await createSharingPreferences(file, reopened.request).restore();
    assert.deepEqual(reopened.calls, []);
});

test('changed, corrupt, oversized, and public adapter preferences stay local with a recovery result', async t => {
    const file = await fixture(t);
    for (const replacement of [
        { ...selected, address: '192.168.1.8' },
        { ...selected, name: 'Other adapter' },
    ]) {
        writeSharingPreference(file, selected);
        const backend = host([replacement]);
        assert.equal(await createSharingPreferences(file, backend.request).restore(), 'unavailable');
        assert.deepEqual(
            backend.calls.map(call => call.change),
            [false],
        );
        assert.deepEqual(readSharingPreference(file), { kind: 'none' });
    }
    for (const value of [
        'null',
        '[]',
        '{',
        'x'.repeat(4097),
        JSON.stringify({ version: 2, adapter: selected }),
        JSON.stringify({ version: 1, adapter: { ...selected, token: 'must-not-be-stored' } }),
        JSON.stringify({ version: 1, adapter: { ...selected, address: '8.8.8.8' } }),
    ]) {
        await writeFile(file, value);
        const backend = host();
        assert.equal(await createSharingPreferences(file, backend.request).restore(), 'unavailable');
        assert.deepEqual(backend.calls, []);
    }
    for (const address of ['127.0.0.1', '0.0.0.0', '8.8.8.8', 'host.local'])
        assert.throws(() => writeSharingPreference(file, { ...selected, address }), /Invalid sharing preference/);
});

test('failed preference consumption never binds and failed quit writes leave no stale selection', async t => {
    const file = await fixture(t);
    writeSharingPreference(file, selected);
    const denied = Object.assign(new Error('Access denied'), { code: 'EACCES' });
    const backend = host();
    const blocked = createSharingPreferences(file, backend.request, {
        ...fs,
        unlinkSync() {
            throw denied;
        },
    });
    assert.equal(await blocked.restore(), 'failed');
    assert.deepEqual(backend.calls, []);
    assert.equal(await blocked.prepareQuit(), false);
    const diskFull = Object.assign(new Error('Disk full'), { code: 'ENOSPC' });
    const active = createSharingPreferences(file, backend.request, {
        ...fs,
        writeFileSync() {
            throw diskFull;
        },
    });
    assert.equal(await active.restore(), null);
    assert.equal(await active.prepareQuit(), false);
    assert.deepEqual(readSharingPreference(file), { kind: 'none' });
    const stopped = createSharingPreferences(file, backend.request, {
        ...fs,
        writeFileSync() {
            throw diskFull;
        },
    });
    await stopped.restore();
    await stopped.change(selected.address);
    await stopped.change(null);
    assert.equal(await stopped.prepareQuit(), true, 'stopping does not need to write an off flag');
    assert.deepEqual(readSharingPreference(file), { kind: 'none' });
});

test('in-flight changes and shutdown are serialized so a later stop cannot be regranted', async t => {
    const file = await fixture(t);
    let release;
    const held = new Promise(resolve => {
        release = resolve;
    });
    const backend = host();
    const controller = createSharingPreferences(file, async (address, change) => {
        if (change && address) await held;
        return backend.request(address, change);
    });
    await controller.restore();
    const start = controller.change(selected.address);
    const stop = controller.change(null);
    const quit = controller.prepareQuit();
    await assert.rejects(controller.change(selected.address), /stopping/);
    release();
    assert.equal((await start).mode, 'lan');
    assert.equal((await stop).mode, 'local');
    assert.equal(await quit, true);
    assert.deepEqual(readSharingPreference(file), { kind: 'none' });
    assert.equal(await controller.restore(), 'failed');
    assert.equal(backend.calls.at(-1).address, null);
});


test('failed startup consumption blocks manual sharing and cannot falsely confirm forgetting old approval', async t => {
    const file = await fixture(t);
    writeSharingPreference(file, selected);
    const backend = host();
    let denied = true;
    const controller = createSharingPreferences(file, backend.request, {
        ...fs,
        unlinkSync(filename) {
            if (denied) throw Object.assign(new Error('Access denied'), { code: 'EACCES' });
            fs.unlinkSync(filename);
        },
    });
    assert.equal(await controller.restore(), 'failed');
    await assert.rejects(controller.change(selected.address), { code: 'EACCES' });
    assert.deepEqual(backend.calls, [], 'unconsumed approval must never permit a manual LAN bind');
    await assert.rejects(controller.change(null), { code: 'EACCES' });
    assert.deepEqual(backend.calls, [{ address: null, change: true }], 'Stop still closes the listener before reporting the preference failure');
    denied = false;
    assert.equal(await controller.restore(), 'failed', 'backend recovery must not retry an old blocked approval automatically');
    assert.deepEqual(backend.calls, [{ address: null, change: true }]);
    assert.equal((await controller.change(null)).mode, 'local');
    assert.equal(await controller.prepareQuit(), true);
    const reopened = host();
    assert.equal(await createSharingPreferences(file, reopened.request).restore(), null);
    assert.deepEqual(reopened.calls, [], 'a successfully confirmed Stop cannot restore old approval');
});
