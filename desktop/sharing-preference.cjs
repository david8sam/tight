const fs = require('node:fs');
const path = require('node:path');
const { isIPv4 } = require('node:net');

function validAdapter(value) {
    if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        Object.keys(value).sort().join(',') !== 'address,name'
    )
        return false;
    if (typeof value.name !== 'string' || !value.name.length || value.name.length > 256 || !isIPv4(value.address))
        return false;
    const [first, second] = value.address.split('.').map(Number);
    return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function readSharingPreference(filename, files = fs) {
    try {
        if (files.statSync(filename).size > 4096) return { kind: 'invalid' };
        const value = JSON.parse(files.readFileSync(filename, 'utf8'));
        if (!value || Object.keys(value).sort().join(',') !== 'adapter,version' || value.version !== 1)
            return { kind: 'invalid' };
        if (value.adapter === null) return { kind: 'none' };
        return validAdapter(value.adapter) ? { kind: 'selected', adapter: value.adapter } : { kind: 'invalid' };
    } catch (error) {
        return { kind: error.code === 'ENOENT' ? 'none' : 'invalid' };
    }
}

function forgetSharingPreference(filename, files) {
    try {
        files.unlinkSync(filename);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

function writeSharingPreference(filename, adapter, files = fs) {
    if (adapter !== null && !validAdapter(adapter)) throw new Error('Invalid sharing preference.');
    files.mkdirSync(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.tmp`;
    files.writeFileSync(temporary, JSON.stringify({ version: 1, adapter }), { mode: 0o600 });
    files.renameSync(temporary, filename);
}

function createSharingPreferences(filename, requestHosting, files = fs) {
    let approved = null;
    let initialization = 'new';
    let restorationError = null;
    let changes = Promise.resolve();
    let quitPromise;
    const enqueue = operation => {
        const result = changes.then(operation);
        changes = result.catch(() => {});
        return result;
    };
    return {
        restore() {
            return enqueue(async () => {
                if (quitPromise) return 'failed';
                if (initialization === 'blocked') return restorationError;
                if (initialization === 'new') {
                    const saved = readSharingPreference(filename, files);
                    try {
                        forgetSharingPreference(filename, files);
                    } catch {
                        initialization = 'blocked';
                        restorationError = 'failed';
                        return restorationError;
                    }
                    initialization = 'ready';
                    if (saved.kind === 'invalid') restorationError = 'unavailable';
                    if (saved.kind === 'selected') approved = saved.adapter;
                }
                if (!approved) return restorationError;
                try {
                    const current = await requestHosting(null, false);
                    if (
                        !current.interfaces.some(
                            adapter => adapter.name === approved.name && adapter.address === approved.address,
                        )
                    ) {
                        approved = null;
                        restorationError = 'unavailable';
                        return restorationError;
                    }
                    await requestHosting(approved.address, true);
                    restorationError = null;
                } catch {
                    approved = null;
                    restorationError = 'failed';
                }
                return restorationError;
            });
        },
        change(address) {
            if (quitPromise) return Promise.reject(new Error('The host is stopping.'));
            return enqueue(async () => {
                if (address === null) {
                    approved = null;
                    const current = await requestHosting(null, true);
                    if (initialization !== 'ready') {
                        forgetSharingPreference(filename, files);
                        initialization = 'ready';
                    }
                    restorationError = null;
                    return current;
                }
                if (initialization !== 'ready') {
                    forgetSharingPreference(filename, files);
                    initialization = 'ready';
                }
                const current = await requestHosting(null, false);
                const adapter = current.interfaces.find(value => value.address === address);
                if (!adapter || !validAdapter(adapter)) throw new Error('That private network is no longer available.');
                const value = await requestHosting(address, true);
                approved = adapter;
                restorationError = null;
                return value;
            });
        },
        prepareQuit() {
            if (!quitPromise)
                quitPromise = enqueue(() => {
                    try {
                        forgetSharingPreference(filename, files);
                        if (approved) writeSharingPreference(filename, approved, files);
                        return true;
                    } catch {
                        return false;
                    }
                });
            return quitPromise;
        },
    };
}

module.exports = { readSharingPreference, writeSharingPreference, createSharingPreferences };
