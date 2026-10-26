const fs = require('node:fs');

function parseBuildIdentity(value) {
    if (value && typeof value === 'object' && !Array.isArray(value) &&
        typeof value.revision === 'string' && /^[a-f0-9]{40}$/.test(value.revision) &&
        typeof value.modified === 'boolean') {
        return { revision: value.revision, modified: value.modified };
    }
    return { revision: null, modified: null };
}
function readBuildIdentity(filename) {
    try {
        const status = fs.statSync(filename);
        if (!status.isFile() || status.size > 1024) return parseBuildIdentity(null);
        return parseBuildIdentity(JSON.parse(fs.readFileSync(filename, 'utf8')));
    } catch {
        return parseBuildIdentity(null);
    }
}
module.exports = { parseBuildIdentity, readBuildIdentity };
