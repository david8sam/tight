# Windows desktop preview

The Electron launcher starts the bundled backend and opens TIGHT without requiring Node or a terminal on the user's PC. It starts on loopback with an available port. The host can enable Wi-Fi sharing on one selected private network and invite players from their phones.

## Run the preview

The Windows CI job builds and tests the source app, packages a Windows x64 app, and tests that packaged executable. After those steps pass, its `TIGHT-windows-x64-preview` artifact contains the app folder.

1. Download the artifact from the successful GitHub Actions run.
2. Extract the entire archive to a folder you can write to.
3. Open `TIGHT.exe`.
4. Create a game or resume a save from the home screen.
5. Open **Wi-Fi sharing**, select your Wi-Fi adapter, and start sharing. If Windows asks, allow TIGHT on Private networks.
6. Use **Pair device** in the game to create a player invitation. The player scans that private QR code on the same Wi-Fi.

Keep the executable, DLLs, and `resources` folder together. Closing the window offers Keep TIGHT open or Quit and save. Quitting stops the backend and closes player connections. Reopening restores committed games.

The artifact also includes a per-user setup executable. See [Windows installer preview](windows-installer.md) for installation, removal, and retained saves. This is an unsigned development preview. Signing, final license review, and clean-machine Windows qualification remain release work in #23 and #26. There is no automatic updater. Do not distribute this artifact as a production release.

## Storage

Game storage keeps the same default location as the standalone backend: `%LOCALAPPDATA%\TIGHT` on Windows. Chromium's profile uses Electron's normal per-user TIGHT profile. `TIGHT_DATA_DIR` overrides game storage and puts the desktop profile in a `desktop-profile` subfolder there. The launcher never writes saves into the installation folder.

Only the backend opens SQLite. A second desktop launch focuses the existing window. A separate backend already using the same data folder causes a startup error rather than two writers. Startup errors offer restart or quit; invalid saves are preserved. See [game storage and recovery](game-storage.md).

## Lifecycle and boundaries

`desktop/main.cjs` owns the single-instance lock, native window, process readiness, recovery, and shutdown. It launches `desktop/backend.cjs` through Electron's utility-process API. That entry imports the bundled backend, starts it on `127.0.0.1:0`, and reports a validated readiness message. The window loads only after readiness. Quit asks the backend to close sockets, clear broadcast and heartbeat timers, close HTTP, and release SQLite. A five-second timeout bounds shutdown if the child is unresponsive.

The backend exports `startBackend` from `src/server/bootstrap.ts`; the standalone CLI uses the same implementation. Startup failure releases storage and timers before returning an error. The desktop backend bundles its JavaScript dependencies, uses Electron's built-in Node/SQLite runtime, and requires no separate Node installation. Packaging stages an explicit file list and creates an ASAR archive, without copying the checkout or `node_modules` into the app.

An in-process backend would share failures and shutdown with Electron main. A separate Node executable would add another runtime to package and update. The utility process isolates backend failures while reusing Electron's runtime. Main owns process lifecycle; the backend owns game state and storage.

The renderer has Node integration disabled, context isolation and sandboxing enabled, denied permission requests, restricted navigation, blocked new windows/webviews, and a content-security policy for its backend origin. A narrow preload bridge exposes hosting status and network selection; main verifies the host frame and cookie for every call. The window title reflects local or Wi-Fi mode. Host/player authorization, pairing, and LAN Host/Origin checks apply to both listeners. Remaining hardening is tracked in #22.

## Development and verification

Use Node 24.19.0 and `npm ci --legacy-peer-deps`. `npm run desktop` builds and starts the source app. `npm run package:windows` builds a Windows x64 preview in `release/TIGHT-win32-x64`. Run Windows packaging on Windows so executable metadata can be applied natively.

`npm run test:desktop` builds the app and runs its Electron integration test. The same test can target an existing package by setting `TIGHT_DESKTOP_EXECUTABLE` to its executable and running `npx playwright test --config=playwright.desktop.config.ts`. It checks startup, a single instance, renderer Node isolation, blocked navigation, saved-game reopening, backend crash recovery, close cancellation, and that the old HTTP port stops answering after quit. Only native message-box responses are mocked.

Linux is a test environment, not a supported release target. A local virtual display is required for its Electron tests. In this restricted cloud environment, Chromium's OS sandbox cannot initialize, so tests explicitly use `TIGHT_ELECTRON_TEST_NO_SANDBOX=true`; this flag affects test launch arguments only. The production launcher never disables sandboxing. Windows CI runs without this flag and checks renderer OS sandbox status. Linux source and packaged-app checks do not replace Windows or real-phone qualification.

On this cloud proxy, Electron binary downloads need Node's proxy support: set `NODE_USE_ENV_PROXY=1` and `electron_config_cache=/workspace/.cache/electron` for the download or packaging command. Keep the configured CA trust and proxy settings. Normal Windows CI uses its standard network configuration.

Device pairing uses host-issued one-use invitations. The desktop installs its host cookie through native IPC before opening the UI; it never includes that credential in an invitation link. With sharing enabled, invitations use the selected LAN address. See [access sessions](access-sessions.md) and [Wi-Fi sharing](lan-hosting.md).

See [host diagnostics](host-diagnostics.md) for the native support export, bounded lifecycle logs, and sleep/resume behavior.
