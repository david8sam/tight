#!/usr/bin/env node
/**
 * Fetch per-planet artwork into src/client/public/ti4/planets/.
 *
 * Source: the TI4-Online/TI4-TTPG project stores planet cards as sprite sheets
 * (12-wide grids of 340x510 cards) with JSON metadata mapping sheet indices to
 * planet names. This script downloads the base + PoK sheets, slices out each
 * card's art square (the top 340x340 of the card, where the planet render
 * lives), and saves it under the app's slug convention for PlanetDisc.
 *
 * Slicing uses macOS `sips` (built in) — this script is macOS-only.
 * The art is copyrighted (© FFG/Asmodee) and gitignored — personal, local use.
 *
 *   node scripts/fetch-ti4-planets.mjs
 *   (or: npm run assets:planets)
 */

import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/client/public/ti4/planets');

const REPO_RAW = 'https://raw.githubusercontent.com/TI4-Online/TI4-TTPG/main/assets';
const SHEETS = [
    { id: 'base', json: 'Templates/card/planet/base/0.json', image: 'Textures/en/card/planet/base/0.face.jpg' },
    { id: 'pok', json: 'Templates/card/planet/pok/0.json', image: 'Textures/en/card/planet/pok/0.face.jpg' },
];

/**
 * TTPG slug -> the app's slug, for the few spots where the app's planet DB spells a name
 * differently. ('Rescuion' in src/server/database/planet/TI4.ts is a typo of the official
 * 'Resculon' — kept as-is because saved games key planets by name.)
 */
const PLANET_ALIASES = {
    resculon: 'rescuion',
};

/** Keep in sync with slugify() in src/client/utils/assets.ts */
function slugify(name) {
    return name
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/['’.]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fetchBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}: ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

function sips(args) {
    execFileSync('sips', args, { stdio: 'pipe' });
}

await mkdir(OUT, { recursive: true });
const tmp = await mkdtemp(join(tmpdir(), 'ti4-planets-'));

let total = 0;
try {
    for (const sheet of SHEETS) {
        const meta = JSON.parse((await fetchBuffer(`${REPO_RAW}/${sheet.json}`)).toString('utf8'));
        const sheetPath = join(tmp, `${sheet.id}.jpg`);
        await writeFile(sheetPath, await fetchBuffer(`${REPO_RAW}/${sheet.image}`));

        // Cell size from the sheet grid (cards are 340x510 at current sheet resolution)
        const [w, h] = ['pixelWidth', 'pixelHeight'].map(k =>
            Number(execFileSync('sips', ['-g', k, sheetPath], { encoding: 'utf8' }).split(':').pop().trim()),
        );
        const cellW = Math.floor(w / meta.NumHorizontal);
        const cellH = Math.floor(h / meta.NumVertical);

        const names = Object.entries(meta.CardNames);
        console.log(
            `${sheet.id}: ${names.length} cards (${meta.NumHorizontal}x${meta.NumVertical}, cell ${cellW}x${cellH})`,
        );

        for (const [index, name] of names) {
            const i = Number(index);
            const x = (i % meta.NumHorizontal) * cellW;
            const y = Math.floor(i / meta.NumHorizontal) * cellH;
            const slug = slugify(name);
            const out = resolve(OUT, `${PLANET_ALIASES[slug] || slug}.png`);

            // Crop the card cell, then keep the top square where the planet art lives
            const cardPath = join(tmp, 'card.png');
            sips([sheetPath, '--cropOffset', `${y}`, `${x}`, '-c', `${cellH}`, `${cellW}`, '--out', cardPath]);
            sips([cardPath, '--cropOffset', '0', '0', '-c', `${cellW}`, `${cellW}`, '--out', out]);
            total += 1;
        }
    }
} finally {
    await rm(tmp, { recursive: true, force: true });
}

console.log(`\nSaved ${total} planet art squares -> src/client/public/ti4/planets/`);
console.log('These files are gitignored (copyrighted — personal/local use only).\n');
