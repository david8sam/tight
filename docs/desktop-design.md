# Windows desktop host design

The Windows Electron app owns a bundled backend and opens the saved-game home screen. The host creates or resumes a game, enables Wi-Fi sharing on a selected adapter, and issues a player or spectator invitation. A phone scans the invitation QR code and joins in its browser. The PC stores committed changes and must stay awake while hosting.

Electron, portable Windows packaging, and an unsigned per-user installer are implemented. See [the desktop preview](windows-desktop.md), [Windows installer](windows-installer.md), and [Wi-Fi sharing](lan-hosting.md) for the current behavior and verification limits. Publisher signing, distribution-rights review, and physical Windows and phone qualification remain release gates.

This document explains the architecture and records the original option comparison. The module map and TypeScript signatures below are design sketches. The linked implementation guides and [README](../README.md) describe the current app.

## What exists today

The React UI calls same-origin HTTP APIs and maintains a WebSocket for state updates. Express serves the production UI and API. The WebSocket handler mutates a cached game map, and a 300 ms timer broadcasts dirty portions to subscribed clients. The backend now commits games to a per-user SQLite store before success or broadcast. The short game code locates a game on one particular backend; it does not locate a host PC across a network.

The implementation retains the client/server/common split. Electron owns the native lifecycle, while the backend owns sessions, game commands, and SQLite writes.

## Compare the viable options

| Option | Reuse and user experience | Cost and constraints | Decision |
| --- | --- | --- | --- |
| Electron with bundled Node backend | Reuses the React UI and Node runtime. One installer can manage hosting and show native errors. Phones keep the browser UI. | Larger download and memory footprint. Chromium/Electron security updates, process management, and signing are ongoing responsibilities. | Recommended for the first Windows release. |
| Tauri with a Node sidecar | Reuses React and can provide a smaller webview shell. | Existing server still needs a bundled Node sidecar or a backend rewrite. Adds Rust/native build and WebView2 compatibility work. Measure the whole artifact, not only the shell. | Reconsider if download size becomes a demonstrated problem. |
| Browser/PWA plus separately installed local host service | Reuses the web app and can simplify the guest experience. | A PWA alone cannot launch the existing Node server or act as its persistent LAN host. Nontechnical users still need a service installer and lifecycle UI. | Good guest interface, insufficient alone for the requested host experience. |

This original comparison led to the Electron implementation. CI now exercises native startup, the packaged Windows executable, and the unsigned installer lifecycle. Those checks do not establish download size, memory consumption, or physical-device qualification.

## Ownership and module map

```text
desktop/main        -> Electron lifecycle, single instance, backend process, windows
 desktop/preload    -> narrow native actions, such as save-file and diagnostics export
server/bootstrap    -> create/start/stop backend, own timers and connections
server/commands     -> validated commands, permissions, idempotency, game transitions
server/storage      -> SQLite transactions, migrations, backups
server/rest-api     -> HTTP parsing and responses; call commands
server/websocket    -> connection/session boundary; call commands; publish events
common/protocol     -> authoritative command schemas and derived transport types
common/game         -> pure game rules and invariants
client              -> rendering, forms, pending/error state, connection resynchronization
```

Paths describe responsibilities to add or refine, not files claimed to exist today. Keep abstractions small. Do not introduce a generic repository framework or a second game engine for desktop use.

Electron main launches the backend in a utility process so a parse/storage failure cannot take down the native lifecycle UI. The backend is the only writer to game storage. Neither Electron main nor a renderer writes the SQLite file alongside it. A phone and the desktop renderer go through the same backend command path.

## Important contracts

Use signatures like these as a design sketch, with concrete schema-derived command variants replacing placeholders during implementation:

```typescript
type GameId = string & { readonly __brand: 'GameId' };
type CommandId = string & { readonly __brand: 'CommandId' };
type Revision = number & { readonly __brand: 'Revision' };

type HostMode =
  | { kind: 'local' }
  | { kind: 'lan'; interfaceAddress: string };

type BackendReady = {
  origin: string;
  mode: HostMode;
  protocolVersion: number;
};

type ApplyResult =
  | { kind: 'accepted'; commandId: CommandId; revision: Revision }
  | { kind: 'rejected'; commandId: CommandId; code: string; message: string };

// Schemas parse unknown network input into individual command variants.
// Sessions, commands, and snapshots use dedicated domain types.
// Do not implement these as any or a bag of optional fields.
```

Backend lifecycle exposes `startBackend`, `stopBackend`, and a readiness result with the actual origin. The bootstrap accepts storage path, host mode, and requested port as explicit options. Keep port selection and server readiness authoritative in the backend, then hand the result to Electron main.

The command entry point accepts the authenticated session, command ID, expected revision, and parsed command. It checks authorization and game invariants, commits a transaction, returns an acknowledgment, and publishes the committed update. A stored command result prevents retries from applying the same operation twice. On reconnect, return the current snapshot and revision before accepting further edits.

Session identity is an opaque credential, separate from a player's display name. A short code locates a game and does not grant access. Host-issued one-use invitations establish player or spectator sessions. The backend enforces host administration, player ownership, spectator read-only access, and optional host-approved table editing. See [access sessions](access-sessions.md) for the permission contract.

## Startup and hosting flow

1. Windows starts Electron main. A second launch focuses the existing instance.
2. Main locates the per-user data directory and starts the bundled backend. The backend opens storage, runs safe migrations, and binds an available nonprivileged port.
3. Backend reports readiness and its exact origin. Main then loads the local UI with a secure BrowserWindow configuration. No production watcher or inspector starts.
4. A new installation opens a local-only home screen with Create Game, Join Game, and Saved games. Resume opens a saved game. Phones need the same Wi-Fi and the PC must stay awake.
5. Host on Wi-Fi explicitly enables LAN access on the selected usable interface. Show the Windows Private-network firewall prompt/guidance when needed. The additional listener preserves the local client connection; startup never quietly exposes the host.
6. Pair device issues a one-use player or spectator invitation. Its URL and QR code use the selected LAN address and actual port. The invitation never contains the reusable host credential. Expired links require a replacement invitation.
7. Phones load the same web UI and connect to the same backend origin. Server validates their session and allowed actions.
8. Accepted changes commit to SQLite before acknowledgment. The UI shows saved status. Guests can resume after a transient disconnect using their device session and a fresh snapshot.

A stable LAN hostname through mDNS can be an optional convenience later. A copyable IP-based URL and QR code are sufficient for the initial release if address changes are handled clearly. Wi-Fi client isolation and a sleeping host cannot be fixed by a QR code, so the UI needs precise troubleshooting text.

## Security and failure behavior

Keep Node access out of the renderer. Use context isolation, sandboxing, a tested CSP, restricted navigation/window creation, and minimal validated preload IPC. The backend listens on loopback until LAN hosting is chosen. Guest APIs, session checks, Origin checks, request limits, and WebSocket limits remain necessary even on home Wi-Fi.

The initial local-network product can use HTTP with an explicit trusted-network scope. That provides no defense against a hostile device intercepting local traffic. Never claim pairing tokens provide encryption. Secure-context browser features and encrypted LAN transport require a separate certificate/trust design if they become requirements; asking casual users to configure certificate paths is not an acceptable default.

If the backend crashes, show a native recovery state and restart it against durable storage. If storage is unavailable or a migration fails, preserve the data and show recovery choices before accepting mutations. A phone reconnect receives a full snapshot. A stale command receives an explicit conflict rather than silently overwriting newer state.

Closing a window must have a declared hosting policy. For the first release, warn about connected guests and offer Keep hosting or Quit and save. Avoid a hidden background host unless its tray presence and stop behavior are clear. On sleep/resume or network changes, refresh the join address and reconnect clients. Never promise hosting continues while Windows sleeps.

## Release and review boundaries

Use a maintained Windows packager with native Windows CI. Start with Windows x64 and explicitly declare supported Windows versions after testing. Include all runtime dependencies, built static assets, notices, and app metadata. Store user data outside the installation directory. Sign release installers and executables using release-system credentials, never credentials embedded in the app.

A beta can update through a manually downloaded signed installer. Automatic updates require verified artifacts, safe migration, and a host-controlled restart point so an active game is not interrupted. Offline startup and play must work independently of the update server.

Windows 11 x64 is the qualification target. Publisher credentials, completed distribution-rights review, clean standard-user Windows testing, real Android and iOS phones, firewall behavior, sleep and reboot recovery, extended play, and manual accessibility review remain open. Automated CI does not close these gates. TIGHT also does not enforce every game rule or prerequisite. See the [remaining release limitations](../README.md#remaining-release-limitations) and issues #23, #24, and #26.
