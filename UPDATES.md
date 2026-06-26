# UPDATES.md

Planned modernization tasks for the TIGHT app stack (as of 2026).

---

## Is the Stack Right for This App?

For a real-time multiplayer game tracker used by 4-8 players (likely self-hosted), the current stack is **appropriate**. The core choices match the problem well:

- **WebSockets** — correct tool for real-time state sync across a small number of clients
- **Express** — fine for a single-server, small-scale deployment
- **React** — no reason to change; component model fits the game UI well
- **In-memory state + SQLite** — in-memory map for zero-latency reads, SQLite as the backing store (added in item 7)

**What's actually missing (features, not framework problems):**
- **No auth** — anyone with the game URL can join or modify the game; fine for trusted groups

**If starting from scratch today:**

| Option | Notes |
|--------|-------|
| Keep current stack + modernize | Best path — working app, no reason to rewrite |
| Socket.IO instead of raw `ws` | Would add rooms, reconnection, and namespaces for free — useful for game lobbies |
| Next.js + tRPC | Good for new projects wanting full-stack type safety in one repo, but overkill here |
| Elixir/Phoenix | Ideal for real-time multiplayer (Phoenix Channels), but requires a full rewrite in a new language |

**Verdict:** Don't rewrite. The modernization tasks below will make this a solid, maintainable app.

---

## ~~1. Superagent → native `fetch`~~ ✓ DONE

The app was already using native `fetch` in `src/client/utils/api.ts`. Superagent was an unused dependency — removed `superagent` and `@types/superagent` from `package.json`.

---

## ~~2. @loadable/component → React.lazy + Suspense~~ ✓ DONE

Replaced all `loadable(...)` calls with `React.lazy(...)` in `src/client/Router.tsx`, wrapped routes in `<Suspense>` with a matching `CircularProgress` fallback, and removed `@loadable/component` + `@types/loadable__component` from `package.json`.

---

## ~~3. Express 4 → Express 5~~ ✓ DONE

Upgraded `express` to `5.2.1` and `@types/express` to `5.0.6`. Breaking changes addressed:
- `app.get('*', ...)` → `app.get('/{*path}', ...)` in `src/server/index.ts` (Express 5 requires named wildcards)
- `res.status(422)` → `res.status(422).send()` in `src/server/rest-api/game.ts` (response must be terminated)
- Removed unused `NextFunction` import from `src/server/index.ts`

---

## ~~4. React Router 6 → React Router 7~~ ✓ DONE

Upgraded `react-router-dom` to `7.18.0`. v7 bundles its own types, so removed `@types/react-router`, `@types/react-router-dom`, and `@types/history` from devDependencies (also resolved pre-existing v5/v6 type conflicts). Fixed catch-all route in `src/client/Router.tsx` to use explicit `path="*"` as required in v7.

---

## ~~5. MUI 5 → MUI 7~~ ✓ DONE

Upgraded to MUI v7 (skipped v6 since v7 was latest stable). Breaking changes addressed:

- Removed `@mui/styles`, `@mui/lab` (unused) from dependencies; added `tss-react@4.9.21`
- Migrated all 22 files using `makeStyles` from `@mui/styles` → `tss-react/mui` (extra `()`, destructure `{ classes }` from hook)
- Replaced `withStyles` in `Accordion.tsx` with `styled()` from `@mui/material/styles`
- Removed `StyledEngineProvider` and `@mui/styles/defaultTheme` augmentation from `App.tsx`
- Migrated Grid v1 → v2 across 17 files (`item`/`xs`/`sm` props → `size` prop)
- Fixed `Grid classes={{ root }}` → `className` (Grid v2 dropped `classes` prop)
- Fixed `SelectProps['onChange']` → `SelectProps<number>['onChange']` (stricter generic in v7)

---

## ~~6. Webpack + Babel → Vite~~ ✓ DONE

Migrated client build from Webpack + webpack-dev-server to Vite 8. Server build retains Webpack (needed for `nodeExternals` + single-file Node bundle).

Breaking changes and fixes:
- Removed `html-webpack-plugin`, `webpack-dev-server`, `@types/webpack-dev-server`, `file-loader`, `source-map-loader` — Vite handles all of these natively
- Removed all Babel packages (`@babel/cli`, `@babel/core`, `@babel/preset-*`, `babel-loader`) — they were in devDeps but never actually wired into the webpack config (ts-loader was doing everything)
- Removed `core-js`, `regenerator-runtime`, `@babel/runtime` — no longer needed without Babel
- Added `vite@8` and `@vitejs/plugin-react` to devDeps
- Created `vite.config.ts` with `@vitejs/plugin-react`, alias for `common/*`, and `/api` proxy to Express (port 80)
- Updated `src/client/index.html` to include `<script type="module" src="/index.tsx">` (Vite uses the HTML as entry point)
- Updated `tsconfig.web.json`: `jsx: react-jsx` (enables Fast Refresh), `target: ESNext`, removed `outDir` (Vite manages output), added `types: ["vite/client"]`
- Removed webpack HMR boilerplate (`module.hot.accept()`) from `src/client/index.tsx` — Vite/React plugin handles HMR automatically
- Simplified `webpack.config.ts` to server-only config (removed all `if (web)` branches and webpack-dev-server setup)
- Fixed `AccordionActionsProps` and `AccordionDetailsProps` in `Accordion.tsx`: MUI v7's ESM barrel doesn't include these at runtime — switched to `import type` from subpaths (`@mui/material/AccordionActions`, `@mui/material/AccordionDetails`)
- Updated `client:dev` script to `vite` and `build:client` to `vite build`

---

## ~~7. Add Persistence (SQLite)~~ ✓ DONE

Added `better-sqlite3` persistence so games survive server restarts. `_games: GameMap` stays as an in-memory cache for zero-latency reads; SQLite is the source of truth.

Schema (one table, `data/tight.db`):
```sql
CREATE TABLE IF NOT EXISTS games (
    id         TEXT    PRIMARY KEY,
    data       TEXT    NOT NULL,
    updated_at INTEGER NOT NULL
);
```

Files added/modified:
- `src/server/database/db.ts` — initializes the DB (creates `data/` dir, creates table if not exists), exports singleton `db` instance
- `src/server/database/game.ts` — added `loadGamesFromDB()`, `persistGame(id)`, prepared statement cache; `createGame`/`restartGame` persist immediately; `deleteGame` deletes from DB
- `src/server/dirty.ts` — `getDirtyGameData()` calls `persistGame(gameId)` after processing each non-deleted dirty game (batched at 300ms broadcast interval)
- `src/server/index.ts` — calls `loadGamesFromDB()` at startup before WebSocket init
- `.gitignore` — added `/data`

Note: games that had no WebSocket activity before a server restart won't be picked up by the 4-hour inactivity cleanup (`removeOldGames`) unless they receive new WS connections. Existing REST API and WS flows are unchanged.

---

## ~~8. WebSocket reconnection robustness~~ ✓ DONE

The hook already had auto-reconnect logic, but it gave up after 5 retries (~15 seconds) and showed a permanent error. For a 4-8 hour TI4 game this was a problem — a phone losing WiFi for 30 seconds would require a manual page refresh.

Changes to `src/client/hooks/useWebSocket.ts`:
- Removed `RETRY_LIMIT` — retries are now indefinite
- Replaced fixed `RETRY_INTERVAL` (3s) with exponential backoff: 3s → 6s → 12s → 24s → 30s (capped at `MAX_RETRY_INTERVAL = 30000`)
- `visibilitychange` handler now resets `retryRef` to 0 before reconnecting, so waking the phone from sleep always triggers a fresh attempt regardless of prior retry history

No new dependencies. The server already sends full game state (`BROADCAST_INITIALIZE`) on every new WS connection, so reconnection automatically restores game state.

---

## Priority Order

| Priority | Item | Status | Effort |
|----------|------|--------|--------|
| 1 | Superagent → fetch | ✓ Done | Low |
| 2 | @loadable → React.lazy | ✓ Done | Low |
| 3 | Express 4 → 5 | ✓ Done | Low–Med |
| 4 | React Router 6 → 7 | ✓ Done | Low |
| 5 | MUI 5 → 7 | ✓ Done | Medium |
| 6 | Webpack → Vite | ✓ Done | High |
| 7 | Add SQLite persistence | ✓ Done | High |
| 8 | WS reconnection robustness | ✓ Done | Low |
