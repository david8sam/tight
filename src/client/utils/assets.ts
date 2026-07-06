/**
 * Optional, locally-supplied TI4 art (faction sigils, planet images, etc.).
 *
 * Files live in Vite's publicDir at `src/client/public/ti4/<category>/<slug>.png`
 * and are served at `/ti4/<category>/<slug>.png`. They are **gitignored** — the
 * underlying art is copyrighted by Fantasy Flight Games and is intended for
 * personal/local use only (see `src/client/public/ti4/README.md`).
 *
 * Every lookup is OPTIONAL: if the file is absent the request 404s and the
 * consuming component should fall back to generated glyphs / faction colors.
 * Recommended usage:
 *
 *   const [src, setSrc] = useState<string | null>(factionImageUrl(faction.name));
 *   return src
 *       ? <img src={src} alt="" onError={() => setSrc(null)} />
 *       : <GeneratedFactionGlyph color={faction.color} />;
 *
 * Populate the folders with `npm run assets:fetch`.
 */

const BASE = '/ti4';

/**
 * Normalize a faction/planet name into a stable, filesystem-safe slug shared by
 * the fetch script and the runtime lookups. Examples:
 *   "The Federation of Sol"        -> "federation-of-sol"
 *   "Sardakk N'orr"                -> "sardakk-norr"
 *   "The L1Z1X Mindnet"            -> "l1z1x-mindnet"
 *   "Mecatol Rex"                  -> "mecatol-rex"
 */
export function slugify(name: string): string {
    return name
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '') // strip diacritics
        .toLowerCase()
        .replace(/^the\s+/, '') // drop a leading "the"
        .replace(/['’.]/g, '') // drop apostrophes / periods
        .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumerics -> single hyphen
        .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/** URL for a faction sigil, e.g. `/ti4/factions/federation-of-sol.png`. */
export function factionImageUrl(name: string): string {
    return `${BASE}/factions/${slugify(name)}.png`;
}

/** URL for a planet image, e.g. `/ti4/planets/mecatol-rex.png`. */
export function planetImageUrl(name: string): string {
    return `${BASE}/planets/${slugify(name)}.png`;
}

/** URL for a strategy-card image, keyed by card name. */
export function strategyCardImageUrl(name: string): string {
    return `${BASE}/strategy-cards/${slugify(name)}.png`;
}
