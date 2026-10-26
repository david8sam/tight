import { execFileSync } from 'node:child_process';
import { parseBuildIdentity } from '../desktop/build-identity.cjs';

export function collectBuildIdentity(root) {
    const git = args => execFileSync('git', args, {
        cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    try {
        if (git(['rev-parse', '--show-prefix']) !== '')
            return parseBuildIdentity(null);
        return parseBuildIdentity({
            revision: git(['rev-parse', '--verify', 'HEAD']),
            modified: git(['status', '--porcelain', '--untracked-files=normal']).length > 0,
        });
    } catch {
        return parseBuildIdentity(null);
    }
}
