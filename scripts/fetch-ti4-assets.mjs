#!/usr/bin/env node
/**
 * Fetch optional TI4 art into src/client/public/ti4/.
 *
 * Pulls faction + planet images from the community AsyncTI4 resource set and
 * saves them under the slug convention used by src/client/utils/assets.ts.
 * The downloaded art is copyrighted (© FFG/Asmodee) and gitignored — personal,
 * local use only.
 *
 *   node scripts/fetch-ti4-assets.mjs
 *   (or: npm run assets:fetch)
 *
 * Set GITHUB_TOKEN to raise the GitHub API rate limit if you hit it (only the
 * directory listings use the API; the images download from raw.githubusercontent).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/client/public/ti4');

const REPO = 'AsyncTI4/TI4_map_generator_bot';
const SRC = 'src/main/resources';

/**
 * AsyncTI4 filename key (lowercased, no extension) -> the app's faction slug
 * (i.e. slugify() of the exact display name in src/server/database/faction/).
 *
 * The app-slug side is verified against the faction DB (24 base + PoK factions).
 * The AsyncTI4-key side uses the standard community faction keys; the folder also
 * contains homebrew factions, so a couple of keys (Titans of Ul, Naaz-Rokha) are
 * hedged with alternates. After the first `npm run assets:fetch`, glance at
 * src/client/public/ti4/factions/ — any file still under a raw/unexpected name
 * just needs its key added here.
 */
const FACTION_ALIASES = {
    // Base game (17)
    arborec: 'arborec',
    letnev: 'barony-of-letnev',
    saar: 'clan-of-saar',
    muaat: 'embers-of-muaat',
    hacan: 'emirates-of-hacan',
    sol: 'federation-of-sol',
    creuss: 'ghosts-of-creuss',
    ghost: 'ghosts-of-creuss', // hedge: alternate key
    ghosts: 'ghosts-of-creuss', // hedge: alternate key
    l1z1x: 'l1z1x-mindnet',
    mentak: 'mentak-coalition',
    naalu: 'naalu-collective',
    nekro: 'nekro-virus',
    sardakk: 'sardakk-norr',
    jolnar: 'universities-of-jol-nar',
    winnu: 'winnu',
    xxcha: 'xxcha-kingdom',
    yin: 'yin-brotherhood',
    yssaril: 'yssaril-tribes',

    // Prophecy of Kings (7)
    argent: 'argent-flight',
    empyrean: 'empyrean',
    mahact: 'mahact-gene-sorcerers',
    naazrokha: 'naaz-rokha-alliance',
    naaz: 'naaz-rokha-alliance', // hedge: alternate key
    nomad: 'nomad',
    ul: 'titans-of-ul',
    titans: 'titans-of-ul', // hedge: alternate key
    cabal: 'vuilraith-cabal',
    vuilraith: 'vuilraith-cabal', // hedge: alternate key
};

// Note: AsyncTI4 has no per-planet artwork (its planet_cards/ folder holds card *frame parts*
// that the bot composes, and each planet JSON's cardImagePath is null). Planet images must be
// sourced by hand — drop them into src/client/public/ti4/planets/<slug>.png.
// By default only the official base + PoK factions (keys of FACTION_ALIASES) are downloaded;
// pass --all to also pull the homebrew/Discordant Stars/Franken faction files under raw names.
const TARGETS = [{ dir: 'factions', out: 'factions', aliases: FACTION_ALIASES }];

const INCLUDE_UNOFFICIAL = process.argv.includes('--all');

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

async function listDir(path) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        headers: {
            'User-Agent': 'tight-assets-fetch',
            Accept: 'application/vnd.github+json',
            ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
    });
    if (!res.ok) {
        throw new Error(`GitHub API ${res.status} listing ${path} (set GITHUB_TOKEN if rate-limited)`);
    }
    return res.json();
}

async function download(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}: ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

for (const target of TARGETS) {
    const outDir = resolve(OUT, target.out);
    await mkdir(outDir, { recursive: true });

    const entries = (await listDir(`${SRC}/${target.dir}`)).filter(e => {
        if (e.type !== 'file' || !IMAGE_RE.test(e.name)) {
            return false;
        }

        const key = e.name.replace(IMAGE_RE, '').toLowerCase();
        return INCLUDE_UNOFFICIAL || Boolean(target.aliases[key]);
    });
    console.log(`\n${target.dir}: ${entries.length} images${INCLUDE_UNOFFICIAL ? '' : ' (official only)'}`);

    let done = 0;
    for (const entry of entries) {
        const ext = entry.name.match(IMAGE_RE)[0].toLowerCase();
        const key = entry.name.slice(0, -ext.length).toLowerCase();
        const name = (target.aliases[key] || key) + ext;
        try {
            await writeFile(resolve(outDir, name), await download(entry.download_url));
            done += 1;
            if (done % 20 === 0) console.log(`  ${done}/${entries.length}`);
        } catch (err) {
            console.warn(`  skip ${entry.name}: ${err.message}`);
        }
    }
    console.log(`  saved ${done} -> src/client/public/ti4/${target.out}/`);
}

console.log('\nDone. These files are gitignored (copyrighted — personal/local use only).');
console.log('Planet art is not available from AsyncTI4 — add planets by hand as');
console.log('src/client/public/ti4/planets/<slug>.png (see slugify() in src/client/utils/assets.ts).\n');
