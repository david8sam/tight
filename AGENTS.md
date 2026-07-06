# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**TIGHT** is a Twilight Imperium Game Helper and Tracker—a web application for managing and tracking Twilight Imperium 4th Edition game state in real-time across multiple players. It's a full-stack application with a React frontend and Express backend communicating via WebSocket and REST APIs.

## Build System and Commands

The project uses **Webpack** for bundling both client and server code, with separate build configurations for each target. All scripts are defined in `package.json`.

### Installation
```bash
npm install
# Use --legacy-peer-deps if encountering dependency version conflicts
```

### Development

Run each command in a separate terminal window:

1. **Run server in dev mode** (with inspect flag for debugging):
   ```bash
   npm run start:dev
   ```
   Hot reload will restart the server on file changes. If changes to server files don't hot reload correctly, type `rs` in the console to manually restart.

2. **Watch server build** (compiles TypeScript to JavaScript):
   ```bash
   npm run server:dev
   ```

3. **Watch and serve client** (Webpack dev server on port 3001):
   ```bash
   npm run client:dev
   ```
   Access the client at `http://localhost:3001/`

### Production Build and Run

```bash
# Build both server and client (clean build)
npm run build

# Start production server
npm run start
```
The server will print its URL to the console (e.g., `http://192.168.x.x/`).

### Individual Build Commands
- `npm run build:server` — Build server only
- `npm run build:client` — Build client only
- `npm run clean` — Clean all build outputs
- `npm run clean:server` — Clean server build
- `npm run clean:client` — Clean client build

## Project Structure

```
src/
├── client/              # React frontend (80+ components/files)
│   ├── components/      # UI components (30+ reusable components)
│   ├── pages/           # Route pages (Home, Game, Players, Planets, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Client utility functions
│   ├── assets/          # Static images and Ti4-specific assets
│   ├── App.tsx          # Root React component with theme setup
│   ├── Router.tsx       # React Router configuration
│   ├── reducer.ts       # Client state management (useReducer)
│   ├── Context.ts       # App context for global state + WebSocket
│   ├── types.ts         # Client TypeScript types
│   └── index.tsx        # Entry point (React DOM render)
│
├── server/              # Express backend (21 files)
│   ├── rest-api/        # REST API endpoints
│   │   ├── router.ts    # Route aggregator
│   │   ├── game.ts      # Game CRUD operations
│   │   ├── faction.ts   # Faction data endpoints
│   │   ├── strategy.ts  # Strategy cards endpoints
│   │   └── planet.ts    # Planet data endpoints
│   ├── database/        # In-memory game state
│   │   ├── game.ts      # Game object creation/management
│   │   ├── strategy.ts  # Strategy card data
│   │   ├── planet/      # Planet data and traits
│   │   └── faction/     # Faction data
│   ├── WebSocket.ts     # WebSocket utilities and type definitions
│   ├── WebSocketServer.ts — WebSocket server setup and connection handling
│   ├── handleMessage.ts — Message processing for WebSocket events
│   ├── dirty.ts         — Change tracking for broadcasts
│   ├── log.ts           — Logging utility
│   └── index.ts         — Express app setup
│
└── common/              # Shared code (8 files)
    ├── Game.ts          # Game state interfaces and enums
    ├── Planet.ts        # Planet data and interfaces
    ├── Faction.ts       # Faction data and interfaces
    ├── api.ts           # REST API request/response types
    ├── message.ts       # WebSocket message types and enums
    ├── constants.ts     # Shared constants (WSS_PORT = 8080)
    ├── error.ts         # Error types
    └── uuidv4.ts        # UUID generation utility
```

## Architecture Overview

### Full-Stack Communication Pattern

The app uses a **hybrid communication model**:
- **REST API** (`/api/*`) for initial data fetches (games list, planets, factions, strategy cards)
- **WebSocket** (port 8080) for real-time game state synchronization across all connected players

### Data Flow

1. **Client connects** → Provides `gameId` and `playerId` query params to WebSocket
2. **Server receives connection** → Sends initial game state via `BROADCAST_INITIALIZE` message
3. **Client actions** → Dispatched via Redux-like actions to `sendData()` through WebSocket
4. **Server updates state** → Marks game as "dirty" and broadcasts changes to all connected clients via `BROADCAST_CHANGE`
5. **Client receives updates** → Updates local reducer state, triggering re-renders

### State Management (Client)

The client uses a **useReducer pattern** (not Redux):
- **Reducer**: `src/client/reducer.ts` — Handles `ActionType` enum (setConnecting, setTheme, setState, updateState, etc.)
- **Context**: `src/client/Context.ts` — Provides `{ state, dispatch, sendData }` to app tree
- **Initial State**: Reads from sessionStorage (playerId, theme preference)
- **WebSocket Hook**: `src/client/hooks/useWebSocket.ts` — Manages connection, message parsing, and state updates

### Game State (Server)

Games are stored in-memory in `src/server/database/game.ts`:
- **Key structure**: `GameMap` maps gameId → `Game` object
- **Game object contains**: players, factions, planets, public objectives, game status (round, phase, turn, etc.)
- **Dirty tracking**: `src/server/dirty.ts` tracks which games changed in the last 300ms and broadcasts changes in batch intervals
- **Game lifecycle**: Create → Load → Start → Play rounds/phases → End → Delete

### Page Routing

Pages are loaded via code-splitting with `@loadable/component`. Key pages:
- `/` — Home (game creation)
- `/:gameId` — Active game tracker
- `/:gameId/status` — Same as above
- `/:gameId/players` — Player setup/view
- `/:gameId/planets` — Planet ownership and control tracking
- `/:gameId/objectives` — Public and secret objectives
- `/:gameId/results` — Game end results
- `/factions` — Faction reference (no game required)
- `/strategy-cards` — Strategy cards reference (no game required)

## TypeScript Configuration

Three `tsconfig` files with different targets:

- **tsconfig.json** — Base config (strict mode, baseUrl "src", path alias `common/*`)
- **tsconfig.server.json** — Server build (Node.Next module resolution)
- **tsconfig.web.json** — Client build (Bundler module resolution, ES6 target)

Webpack uses the appropriate tsconfig based on `TARGET` env var (`node` or `web`).

## Key Technologies

**Frontend:**
- React 18.2 + React Router 6
- Material-UI 5 (components, icons, theming)
- Emotion (CSS-in-JS)
- @loadable/component (code-splitting)
- canvas-confetti (animations)
- Superagent (HTTP client)

**Backend:**
- Express 4.19 (REST API)
- WebSocket (ws library, port 8080)
- Node 20.11+ (ES modules)

**Build & Dev:**
- Webpack 5 + webpack-dev-server
- TypeScript 5.4
- Babel (transpilation)
- Nodemon (dev server auto-reload)
- ts-loader + ts-node

## Code Style

- **Formatter**: Prettier (4-space tabs, 120-char line width, trailing commas)
- **Config**: `.prettierrc`
- **JSX single quotes**: False (uses double quotes)
- **Arrow functions**: Avoid parens when possible (`x => x + 1`)

## File Organization Notes

- **Shared types live in `src/common/Game.ts`** — Contains enums (Phase, StrategyCardIndex, Version), interfaces (GameStatus, StrategyCard, Faction, etc.). If adding new shared data structures, add them here.
- **API contracts in `src/common/api.ts`** — Define request/response types for each REST endpoint to ensure type safety across client and server.
- **Message types in `src/common/message.ts`** — WebSocket message types drive the client-server protocol. Adding a new message type requires updating both server handlers and client reducer.
- **Client components use Context** — Access global state via `useAppContext()` hook instead of prop drilling.
- **Server uses in-memory storage** — No persistence layer; data is lost on server restart. Suitable for session-based games.

## Development Tips

- **Hot reload issues**: If server changes don't reflect, type `rs` in the server terminal or restart manually
- **WebSocket issues**: Browser DevTools Network tab shows ws connections; check `WSS_PORT` constant matches server and client (8080)

## Build Outputs

- **Client**: `dist/` — Contains `index.html` + bundled JS/CSS for serving by Express
- **Server**: `build/` — Contains compiled `server.js` (production) or `server-dev.js` (development)
- Both are excluded from git (`.gitignore`)
