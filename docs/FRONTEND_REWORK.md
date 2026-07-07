# Frontend Rework — July 2026

A clean-slate visual/UX rebuild of the TIGHT client, executed on branch `frontend-rework`
(tag `pre-rework` marks the last commit of the old UI; the stable old app remains on
`FAFO`/`master`). The server, WebSocket layer, and client data contract were **never touched**.

## Goals

- Visual/UX redesign: refined TI4-thematic, dark-first, fully responsive (phones around the
  table and a shared desktop/tablet board).
- Keep the data contract frozen: `reducer.ts`, `Context.ts`, `useWebSocket.ts`,
  `common/message.ts`, `common/Game.ts` — same shapes, same `sendData` payloads
  (including the `stragetyCardFlipped` typo, which the server depends on).
- App stays runnable between every increment.

## Process

1. **Plan first.** The work started in plan mode: codebase exploration (page/component
   inventory, the exact state/message contract), then a decision-complete plan reviewed and
   refined over several rounds before any code.
2. **Mockups before code.** The design direction was validated with rendered mockups (game
   board, planets page, add-planet search, home screen, faction-name treatments, clean-glyph
   vs full-art comparison). Several product decisions were made against the mockups — cheaper
   to change a mockup than a page.
3. **Model split.** Planning and design decisions ran on a stronger reasoning model; the
   phased implementation was written to be executable by a faster model. The plan file was the
   handoff artifact.
4. **Verify live, per increment.** Every phase was verified against the real running stack
   (server + WS + SQLite), not just typecheck/build: a scripted WebSocket peer acted as a
   second player to drive state and prove multi-client sync, while the UI was exercised in a
   browser preview. Each increment landed as its own commit.

## Decisions log

| Decision                | Choice                                                                                          | Why                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| UI foundation           | Keep MUI 7 + tss-react                                                                          | Already wired; effort goes to design, not re-plumbing                              |
| Design direction        | Elevate the existing dark space theme into a token system                                       | The app already had Orbitron/Exo 2 + a deep-space palette                          |
| Rollout                 | Phased (design system → shell → pages → polish)                                                 | App stays runnable; each phase independently testable                              |
| Planets page            | One overall page; owner filter defaults to the viewer's faction; claiming is a search typeahead | Viewing wants a filtered list; claiming wants search, not scrolling ~99 planets    |
| Trait vs tech specialty | Two distinct visual elements                                                                    | Independent attributes in TI4 (e.g. Meer is Hazardous _and_ red warfare)           |
| Faction display         | Full `formatFactionName` everywhere — "Faction (username)" — truncate + tooltip                 | Player id _is_ the username (`GamePlayer` is `{ id }`); `playerIds` supports teams |
| Art strategy            | Clean glyph by default; real art as progressive enhancement                                     | App must work with zero images; copyrighted art stays local-only                   |

## Phases (one commit each unless noted)

- **Art pipeline** (`6670022`) — `src/client/utils/assets.ts` (`slugify`, `factionImageUrl`,
  `planetImageUrl`), gitignored `src/client/public/ti4/` folders, fetch script scaffolding.
- **Phase 0 — design system** (`514e5a1`) — `src/client/theme/`: light/dark `createTheme`
  factories moved out of `App.tsx`; game-semantic tokens attached to the MUI theme as
  `theme.game` (traits, tech specialties, resource/influence, surfaces, radii, state
  opacities); `getFactionColors` extended with accessible variants (`readable`, `on`, `tint`,
  `border`, `glow`); `components/ui/` primitives (Panel, StatPill, SectionHeader, PhaseBadge,
  FactionColorChip, PageContainer). Zero UI change — verified pixel-identical.
- **Phase 1 — responsive shell** (`b637c2a`) — `AppShell`: top bar everywhere, `NavRail` on
  md+, swipeable drawer + `BottomNav` on mobile, inner-scrolling `main`; `GameStateBar`
  (game id + info popover, round, phase badge, turn/speaker with faction dots) replaces the
  per-page `GameInfoToolbar`.
- **Phase 2 — pages** —
  Home (`95fe74c`, incl. a pre-existing reducer fix: `BROADCAST_INITIALIZE` wiped
  `strategyCards`, racing GameWrapper into a stuck spinner);
  Players (`13eb11d`);
  Game board frame + ActionPhase `FactionCard` grid (`e6fe573`);
  Strategy/Status/Agenda phases (`32ece14`, killed pre-existing button-nesting and
  duplicate-key console warnings);
  Planets overall page + `ClaimPlanetDialog` search-to-claim (`7e4dc8a`, replaced the 2s
  debounced local sync with immediate single-planet sends);
  Objectives/Results/StrategyCards/GameDeleted (`24a505f`).
- **Phase 3 — polish + verification** (`5e62396`) — compact `PlayerNameDialog`, deleted
  `GameInfoToolbar`, Factions header restyle; full sweep: production build, full game loop via
  UI, multi-client sync, server-restart reconnection (state survived via SQLite), 375px +
  desktop, light/dark contrast.
- **Art wiring** (`5112b12`, `275279b`, `1a4b2ef`) — `FactionSigil` (board + setup cards) and
  `PlanetDisc` (planet rows + claim search; falls back to a trait-colored disc);
  `npm run assets:fetch` pulls all 24 official faction sigils from AsyncTI4;
  `npm run assets:planets` slices per-planet art squares out of TI4-TTPG's card sprite sheets
  (12-wide grids, 340×510 cards; macOS `sips`) — 99/99 planets covered.

## Asset pipeline & licensing

TI4 artwork is © FFG/Asmodee. The app is personal/local; all images live under the gitignored
`src/client/public/ti4/` (served at `/ti4/...`) and are never committed — only the fetch
scripts and folder scaffolding are tracked. Every art-bearing component falls back to
generated glyphs/colors when an image is missing, so the app works with an empty folder.
See `src/client/public/ti4/README.md`.

- Faction sigils: [AsyncTI4](https://github.com/AsyncTI4/TI4_map_generator_bot) resources
  (official factions only by default; `--all` includes homebrew).
- Planet art: [TI4-Online/TI4-TTPG](https://github.com/TI4-Online/TI4-TTPG) card sprite
  sheets, sliced to the top art square per card.

## Bugs found & fixed along the way

- `setState`/`BROADCAST_INITIALIZE` wiped already-fetched strategy cards → refetch race →
  app could deadlock on the loading spinner after refresh (fixed in `95fe74c`).
- Button-in-button DOM nesting + duplicate `'None'` keys in the old StrategyPhase/Accordion
  (gone with the rebuild, `32ece14`).
- Planet DB typo: `Rescuion` should be `Resculon` (`src/server/database/planet/TI4.ts`).
  Aliased in the planet-art script; the proper rename needs a saved-game data migration
  (planets are keyed by name) and is tracked separately.

## Conventions for future UI work

- Compose from `src/client/components/ui/` primitives; pull game-specific colors from
  `theme.game` — don't hardcode hex values in components.
- Faction colors go through `getFactionColors(theme, faction)`; use `.readable` for anything
  drawn on panels (handles black-on-dark / yellow-on-light).
- Optional art = `FactionSigil` / `PlanetDisc` pattern: try the image, fall back gracefully,
  never require a file.
