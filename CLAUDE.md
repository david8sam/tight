# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TIGHT** is a Twilight Imperium Game Helper and Tracker — a web application for managing and tracking Twilight Imperium 4th Edition game state in real-time across multiple players. Full-stack: React frontend + Express backend, communicating via WebSocket and REST.

## Build System and Commands

The client uses **Vite**; the server uses **Webpack** (needed for `webpack-node-externals` to produce a single-file Node bundle).

### Installation

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is always required due to a peer dependency conflict between `tss-react` and `@mui/material`.

### Development (3 terminals)

```bash
npm run server:dev   # webpack watches server TypeScript → outputs build/server-dev.js
npm run start:dev    # nodemon runs build/server-dev.js (type `rs` to force restart)
npm run client:dev   # Vite dev server on port 3001 with HMR
```

Access the client at `http://localhost:3001/`. Vite also prints a network URL for phone access (e.g. `http://192.168.x.x:3001/`) because `host: true` is set in `vite.config.ts`.

### Production

```bash
npm run build   # webpack (server) + vite (client)
npm run start   # nodemon runs build/server.js; Express serves dist/ on port 80
```

The server prints its network URL on startup (e.g. `http://192.168.x.x/`). Use this for phone access in production.

### Other scripts

- `npm run build:server` / `npm run build:client` — build individually
- `npm run clean` — wipe `build/` and `dist/`
- `npm run server:debug` — server build with `LOG_LEVEL=debug`

## Project Structure

```
src/
├── client/
│   ├── components/       # Reusable UI components (30+)
│   ├── pages/            # Route-level pages (Home, Game, Players, Planets, etc.)
│   ├── hooks/            # useWebSocket, useGameInfo, etc.
│   ├── utils/            # api.ts (native fetch wrapper), planet.ts helpers
│   ├── assets/           # TI4-specific static assets
│   ├── App.tsx           # Root component — MUI theme setup
│   ├── Router.tsx        # React Router 7 config; all pages lazy-loaded via React.lazy
│   ├── reducer.ts        # useReducer state (ActionType enum)
│   ├── Context.ts        # Global context: { state, dispatch, sendData }
│   ├── types.ts          # Client-only TypeScript types
│   └── index.tsx         # Entry point (React DOM render)
│
├── server/
│   ├── rest-api/
│   │   ├── router.ts     # Aggregates all REST routes
│   │   ├── game.ts       # Game CRUD (create, restart, delete, validate)
│   │   ├── faction.ts    # Faction list endpoint
│   │   ├── strategy.ts   # Strategy cards endpoint
│   │   └── planet.ts     # Planet list endpoint
│   ├── database/
│   │   ├── db.ts         # SQLite init (better-sqlite3); creates data/tight.db
│   │   ├── game.ts       # In-memory GameMap + persistence (loadGamesFromDB, persistGame)
│   │   ├── strategy.ts   # Strategy card static data
│   │   ├── planet/       # Planet static data and traits
│   │   └── faction/      # Faction static data
│   ├── WebSocket.ts      # WS type definitions + sendData/broadcast helpers
│   ├── WebSocketServer.ts # WS server setup; keep-alive ping; 300ms broadcast interval
│   ├── handleMessage.ts  # All WS message handlers — the main game state mutation file
│   ├── dirty.ts          # Dirty-game tracking; getDirtyGameData() persists + builds broadcast payload
│   ├── log.ts            # Logging utility
│   └── index.ts          # Express app setup; calls loadGamesFromDB() at startup
│
└── common/               # Shared between client and server
    ├── Game.ts           # Core interfaces and enums (Phase, StrategyCardIndex, Version, Game, etc.)
    ├── Planet.ts         # Planet data and interfaces
    ├── Faction.ts        # Faction data and interfaces
    ├── api.ts            # REST request/response types
    ├── message.ts        # WebSocket MessageType enum and payload types
    ├── constants.ts      # WSS_PORT = 8080
    ├── error.ts          # Error types
    └── uuidv4.ts         # UUID utility
```

## Architecture

### Communication

- **REST API** (`/api/*`) — initial data fetches: game list, planets, factions, strategy cards
- **WebSocket** (port 8080) — real-time game state sync across all connected players

### Data flow

1. Client connects to WS with `?gameId=...&playerId=...` query params
2. Server sends `BROADCAST_INITIALIZE` with full game state
3. Client actions → `sendData({ type, data })` via WS
4. `handleMessage.ts` mutates the in-memory `Game` object → calls `markGameDirty()`
5. Every 300ms: `getDirtyGameData()` persists changed games to SQLite, then broadcasts `BROADCAST_CHANGE` to all connected clients
6. Client reducer applies the partial update → re-render

### Persistence

Games live in both an in-memory `GameMap` (zero-latency reads, direct mutation) and SQLite (`data/tight.db`). SQLite is the source of truth across restarts.

- **Startup**: `loadGamesFromDB()` in `server/index.ts` populates `_games` from the DB
- **Create/restart**: `createGame()` and `restartGame()` write to SQLite immediately
- **In-game mutations**: persisted in the 300ms broadcast cycle via `getDirtyGameData()`
- **Delete**: `deleteGame()` removes from both memory and SQLite

Schema — one table, full game JSON per row:
```sql
CREATE TABLE games (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)
```

The `data/` directory is gitignored. It is created automatically at runtime.

### Client state

- `useReducer` in `reducer.ts` — handles `ActionType` enum actions
- `Context.ts` — provides `{ state, dispatch, sendData }` to all components via `useAppContext()`
- `useWebSocket.ts` — manages the WS connection with exponential backoff reconnection (3s → 6s → 12s → 24s → 30s cap, indefinite retries). Resets backoff on `visibilitychange` so phones reconnect immediately after waking from sleep.

### Game lifecycle

Create → Load → Start → Play rounds (Strategy → Action → Status → Agenda phases) → End → Delete

Games with no WS activity for 4 hours are auto-removed by `removeOldGames()` (runs hourly).

### Page routing

All pages are lazy-loaded with `React.lazy` + `Suspense`. Key routes:

| Path | Page |
|------|------|
| `/` | Home — create or join a game |
| `/:gameId` | Active game tracker |
| `/:gameId/players` | Player/faction setup |
| `/:gameId/planets` | Planet ownership tracking |
| `/:gameId/objectives` | Public and secret objectives |
| `/:gameId/results` | End-game results |
| `/factions` | Faction reference (no game needed) |
| `/strategy-cards` | Strategy card reference (no game needed) |

## TypeScript Configuration

| File | Used for | Notes |
|------|----------|-------|
| `tsconfig.json` | Base | strict mode, `baseUrl: "src"`, `paths: { "common/*": ["common/*"] }` |
| `tsconfig.server.json` | Server webpack build | NodeNext module resolution |
| `tsconfig.web.json` | Client Vite build | Bundler resolution, `jsx: react-jsx`, `types: ["vite/client"]` |

The `ts-node` section in `tsconfig.json` forces `webpack.config.ts` to load as CJS — required because `"type": "module"` is set in `package.json`.

## Key Technologies

**Frontend:**
- React 18 + React Router 7
- MUI 7 (`@mui/material`, `@mui/icons-material`) + Emotion
- `tss-react` — `makeStyles` replacement (MUI v7 removed `@mui/styles`)
- `canvas-confetti` — end-game animations

**Backend:**
- Express 5
- `ws` — WebSocket server (port 8080)
- `better-sqlite3` — synchronous SQLite, stored at `data/tight.db`
- Node 20.11+

**Build:**
- Vite 8 + `@vitejs/plugin-react` — client
- Webpack 5 + `ts-loader` — server only
- TypeScript 5.4

## MUI Patterns

These changed significantly in v7 and will trip up future edits.

**makeStyles** — use `tss-react/mui`, not `@mui/styles`:
```ts
import { makeStyles } from 'tss-react/mui';
const useStyles = makeStyles()((theme) => ({ root: { color: theme.palette.primary.main } }));
// Usage:
const { classes } = useStyles();  // note destructuring, not direct assignment
```

**Grid v2** — `item`/`xs`/`sm` props are gone, replaced by `size`:
```tsx
// Old (v1):  <Grid item xs={12} sm={6} />
// New (v2):  <Grid size={{ xs: 12, sm: 6 }} />
//            <Grid size={6} />  // when no breakpoints needed

// Grid no longer has a `classes` prop — use className instead:
<Grid className={classes.myGrid} />
```

**Vite + MUI barrel imports** — Vite 8 (Rolldown) is stricter about ESM named exports than webpack. If a build fails with `MISSING_EXPORT` for a `*Props` type from `@mui/material`, use `import type` from the component's subpath:
```ts
// Instead of: import { AccordionActionsProps } from '@mui/material'
import type { AccordionActionsProps } from '@mui/material/AccordionActions';
```

## Adding a New WebSocket Message Type

1. Add the new `MessageType` value to `src/common/message.ts`
2. Add the payload type/interface to `src/common/message.ts`
3. Handle the message in `src/server/handleMessage.ts` — call `markGameDirty()` after mutating state
4. Dispatch or react to the message in `src/client/reducer.ts` or `useWebSocket.ts` as needed

## Code Style

Prettier with `.prettierrc`: 4-space tabs, 120-char line width, trailing commas, JSX double quotes, arrow functions without parens when possible (`x => x + 1`).
