# TI4 art assets (local only)

Optional imagery for the app — faction sigils, planet images, unit art, strategy-card art.

## Layout

```
factions/<slug>.png          e.g. federation-of-sol.png
planets/<slug>.png           e.g. mecatol-rex.png
units/<slug>.png
strategy-cards/<slug>.png     e.g. leadership.png
```

`<slug>` is produced by `slugify()` in `src/client/utils/assets.ts` (lowercase, drop a leading
"the", drop apostrophes/periods, non-alphanumerics → hyphens). The runtime helpers
`factionImageUrl()` / `planetImageUrl()` resolve to `/ti4/<category>/<slug>.png`.

Every image is **optional**. Components fall back to generated glyphs / faction colors when a file
is missing, so the app works with an empty folder and gets richer as you add art.

## Populating

```
npm run assets:fetch
```

Downloads faction + planet art from the community [AsyncTI4](https://github.com/AsyncTI4/TI4_map_generator_bot)
resource set into the folders here. You can also drop files in by hand — just match the slug convention.

## ⚠️ Copyright / do not commit

The underlying art is © Fantasy Flight Games / Asmodee. It is included here for **personal, local
use only**. Everything in these folders is **gitignored** (`*.png`/`*.jpg`/`*.webp`) so it never
lands in a commit — only this README and the empty-folder `.gitkeep` files are tracked. If this
project is ever made public, the folders are already empty in git; no history scrub needed.
