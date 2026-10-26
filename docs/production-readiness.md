# TIGHT production-readiness backlog

Target: Windows desktop host, with phones and browsers joining on the same Wi-Fi. No accounts, internet hosting, router port forwarding, or cloud subscription are required for this first release.

Reviewed commit: `d23ae0ca997174667780730f112d00b92b9ab917`. This records the baseline audit and acceptance criteria. Implementation is tracked in `readiness-issues.json` and the linked GitHub issues. That baseline predates the current unsigned Electron installer and its CI lifecycle checks. See the [README](../README.md) for current behavior and limitations, and the [Windows and phone qualification procedure](windows-phone-qualification.md) for the remaining physical release gate. The findings below retain their original audit wording.

Recommendation: fix the data-loss and trust-boundary problems before distributing a desktop build. Reuse the React interface and Node server inside Electron. Give one backend sole ownership of game state, durable storage, command validation, and permissions. Packaging alone does not fix the defects below.

## Evidence and limits

The earlier onboarding run built production and development outputs. This review ran the production server in isolated child processes, used real HTTP and WebSocket requests, and used system Chromium for the web interface. `probe-results.json` contains nine reproduced findings. These checks report current defects successfully reproduced, not nine passing product requirements. The malformed-message check intentionally crashes only its own disposable server, after its other checks finish.

`walkthrough-results.json` records a completed browser journey: create a two-player game, register the host, assign factions/colors, start, and join from an independent phone-sized browser. No browser page or console errors were recorded in that successful journey. The strategy view fit a 390 px viewport without document overflow. This did not exercise every gameplay screen or a complete match. Screenshots are supplementary evidence. A phone-sized Chromium viewport is not a real phone or a same-Wi-Fi network test. Windows installation, firewall prompts, sleep, signing, and updating remain untested. The review does not certify all Twilight Imperium rule combinations or accessibility compliance.

Original raw audit files are retained in `/workspace/tight-review` in the review environment. The committed regression suite is under `tests/`; `docs/readiness-issues.json` links every backlog item to GitHub.

`dependency-audit.json` is the result of `npm audit --omit=dev --json` against the committed dependency graph. It reports 53 affected dependency entries: 4 critical, 14 high, 32 moderate, and 3 low. Entries include transitive and inherited advisories. This is not 53 independently demonstrated vulnerabilities in this app. Assess which vulnerable functions are reachable, compare with the installed graph, update supported dependencies, and verify behavior. In particular, `ip` is used to print a local address here, so its SSRF advisory alone does not prove an SSRF path in this application.

Priorities: P0 blocks a distributed release. P1 is required before a public beta for nontechnical users. P2 improves support and longer-term maintenance. IDs are local backlog IDs, not published GitHub issues.

## Data, safety, and correctness

### R01 · P0 · Persist games and recover from interrupted writes

Evidence: `src/server/database/game.ts:24` holds all games in `_games`. The restart probe creates a game, restarts the backend, and confirms it no longer exists.

Implement a versioned SQLite store in Electron's per-user application-data directory. Persist accepted commands transactionally before acknowledging or broadcasting them. Keep one writer. Add schema migrations, backup rotation, export/import, and recovery for interrupted writes. Do not store user games in the installed application directory.

Acceptance: reopen the application and resume identical game state, scores, players, and round. Forced termination cannot lose acknowledged changes or corrupt other games. A failed migration preserves a recoverable original. Export/import round-trips successfully. Depends on R03 and the shared command boundary in D01.

### R02 · P0 · Contain invalid WebSocket messages without crashing the host

Evidence: `src/server/handleMessage.ts:59` calls `JSON.parse` without containment. Sending `{` closes the disposable server with exit code 1. One client can end every player's session, and today's in-memory games are then lost.

Parse unknown input at the WebSocket boundary. Handle parse, schema, and command failures with bounded errors. Register connection error handling and enforce message-size limits. Do not mask internal programming errors with blanket success responses.

Acceptance: malformed JSON, unexpected JSON values, unknown commands, binary frames, and oversized messages receive defined rejection or closure. A separate healthy client continues playing. Test each case against the actual server.

### R03 · P0 · Validate REST and WebSocket input at the boundary

Evidence: `src/server/rest-api/game.ts:22` forwards the body directly to `createGame`. The probe successfully creates a zero-player game. `src/server/handleMessage.ts:91` spreads arbitrary faction fields, and status updates accept supplied values. TypeScript types do not validate network input.

Define runtime command schemas with explicit allowed fields. Validate player counts, configured round and point ranges, game IDs, faction names, colors, planet IDs, array bounds, string lengths, and allowed phase transitions. Reject unknown fields that could overwrite internal state. Keep validated domain operations shared between transports.

Acceptance: invalid input returns a bounded 4xx or protocol error without mutation. Negative, out-of-range, nonnumeric, huge, and unknown-field payloads have regression tests. Valid commands retain current supported behavior. Avoid scattering duplicate validators across UI and server internals.

### R04 · P0 · Give hosts, players, and spectators enforceable permissions

Evidence: `src/server/handleMessage.ts:66` chooses the game from incoming `gameId`, without tying mutation rights to the connection. An anonymous socket that never joins a game advances its round. REST restart and delete operations also have no authorization check. `PlayerNameDialog.tsx` uses a chosen display name as player identity.

Create host and player session capabilities with opaque identifiers, separate from display names and the short join code. Define a permission matrix for shared table actions, host administration, faction actions, and spectators. Enforce it in the backend for both transports. Joining by code must not grant host powers. Support host-approved recovery when someone loses a device.

Acceptance: another game, a spectator, an unpaired browser, and a spoofed display name cannot mutate or administer the game. The intended host can explicitly grant table-wide editing if desired. Cover positive and negative permissions in integration tests. No internet account system is needed for the LAN release.

### R05 · P0 · Update vulnerable dependencies and remove unused runtime packages

Evidence: see `dependency-audit.json`, particularly Express, ws, body-parser, path-to-regexp, and their affected dependencies. The current production start command also includes nodemon as a runtime dependency.

Upgrade supported packages in reviewed groups, remove verified unused packages, and keep build/watch tools out of the distributed runtime. Preserve package integrity verification. Do not apply `npm audit fix --force` as an unattended substitute for compatibility testing.

Acceptance: runtime-reachable high and critical issues are resolved or explicitly assessed with evidence and an expiry. Install, builds, protocol tests, and browser tests pass. Produce a runtime dependency and license inventory for the Windows artifact. Development-tool advisories are assessed separately.

### R06 · P1 · Restore a deterministic installation and CI release gate

Evidence: onboarding `npm ci --legacy-peer-deps` fails because `fsevents@2.3.3` is missing from the lockfile. The current workaround disables lockfile use and can resolve new transitive versions. `package.json` has no test script, and this checkout has no CI workflow.

Repair and commit the lockfile in a coding change, resolve or document the peer dependency policy, and pin supported Node/npm versions. Add CI for clean installation, type checking, production builds, domain tests, integration tests, and representative browser tests. Add a native Windows packaging lane.

Acceptance: a clean Linux checkout and a clean Windows checkout install from the committed lockfile without modifying it. CI fails on a failing regression, missing test execution, or broken build. Test result files belong to the current run. Depends on the first useful tests in R14–R16.

### R07 · P1 · Honor the selected round limit

Evidence: `NewGameForm.tsx:29` offers 1–20 rounds, while `handleMessage.ts:201` hardcodes `round < 10`. Runtime probes advance a 2-round game to round 4 and stop a 20-round game at round 10.

Use the configured game limit and define what the host sees at the final round. Keep phase and end-game rules in the backend.

Acceptance: games configured for 1, 2, 10, and 20 rounds stop advancing at their own limit, with a clear final-round state. Tests cover exact boundaries and attempts to advance again.

### R08 · P1 · Make repeated planet acquisition preserve consistent ownership

Evidence: `handleMessage.ts:332` pushes the planet and then filters the previous owner's list. If the previous owner is the same faction, the planet disappears from that faction's list while `planet.owner` still names it. Reproduced using Mecatol Rex.

Make acquiring an already-owned planet a defined no-op or rejection. Give planet ownership one authoritative representation or one operation that updates both representations consistently.

Acceptance: take, repeat take, transfer, lose, and repeated lose preserve the ownership invariant. A retried acquisition cannot unexpectedly exhaust a planet or change totals. Add a focused regression test before the fix.

### R09 · P1 · Notify every subscribed client when a game is deleted

Evidence: `src/server/rest-api/game.ts:41` deletes directly. It does not publish a deletion change. The probe observes successful deletion with no deletion packet over more than three broadcast intervals.

Route deletion through the shared command operation. Coordinate persisted deletion and the final notification, then clear subscriptions and any retained activity metadata. Align explicit deletion with automatic cleanup.

Acceptance: all clients viewing the deleted game transition to a clear deleted-game page. Other games remain unaffected. Repeat deletion has a defined result. Test with at least two subscribers.

### R10 · P1 · End restart requests with a defined missing-game response

Evidence: `src/server/rest-api/game.ts:37` sets status 422 but does not end the response. A missing-game restart hangs until the probe aborts after one second.

Return a completed structured error, using a consistent not-found contract. Ensure all REST paths terminate and unknown `/api` paths do not return the SPA HTML as a successful API response.

Acceptance: missing-game restart returns promptly with the agreed status and JSON body. Client handles the error without an endless spinner. Include a request timeout in the regression test.

### R11 · P1 · Resolve HTTP and WebSocket endpoints consistently, including ports

Evidence: `src/client/App.tsx:35` builds a WebSocket URL using `window.location.hostname`, discarding the port. A page at port 18740 repeatedly attempts port 80 and displays the connection error. API calls use `location.host`, creating different behavior between transports.

Resolve one backend origin from desktop startup or the browser origin, preserve its port, and use URL/URLSearchParams for encoded parameters. Make development proxy behavior explicit. Electron should load the UI from the managed backend origin or supply a validated endpoint; a plain `file://` wrapper will not work with the current routing and API assumptions.

Acceptance: the full browser flow works at an arbitrary nonprivileged port, on HTTP, on a configured HTTPS origin, and in the packaged desktop window. Player names with spaces, ampersands, and Unicode round-trip correctly. Depends on D01 for desktop endpoint handoff.

### R12 · P1 · Acknowledge commands and recover connections without silent lost actions

Evidence: `src/client/hooks/useWebSocket.ts:143` silently skips a command when the socket is not open. Retrying is capped, timers are not retained for cancellation, and the protocol has no per-command acknowledgment or state revision. Client state changes arrive later through broadcasts.

Add command IDs, bounded acknowledgment timeouts, server state revisions, and full resynchronization after reconnect. Define duplicate-command behavior before adding automatic retries. Show pending, saved, disconnected, and failed states. Cancel retry timers on unmount and apply backoff with a manual retry option.

Acceptance: phone background/resume, Wi-Fi loss, backend restart, duplicate requests, and two simultaneous editors cannot silently lose or double-apply an acknowledged action. Reject stale commands or reconcile them according to a documented policy. Depends on R01, R03, and R04.

### R13 · P1 · Give every request a recoverable error path

Evidence: `src/client/utils/api.ts:33` and `:52` parse JSON without checking status or bounding duration. `NewGameDialog.tsx:58` does not handle a rejected create request. `GameWrapper.tsx` awaits catalog and game requests without a visible recovery path.

Use a small typed request boundary with encoded queries, status checking, timeout/cancellation, and normalized user-facing failures. Add retry and dismiss actions where appropriate. Always release busy state after failure. Provide a React error boundary for unexpected render failures.

Acceptance: create/join/restart and initial loading recover from timeout, 4xx, 5xx, malformed responses, and interrupted requests. Failed actions do not appear saved. Browser tests verify error messages and usable retry controls.

### R14 · P1 · Add domain regression tests for real game behavior

Evidence: no application test suite is configured. `src/common/Game.ts:186`, `:207`, `:231`, and `:290` contain turn, ordering, and scoring behavior. Mutation rules live in `handleMessage.ts`.

Start with round boundaries and repeated planet acquisition. Add score calculation, objective toggles, strategy-card ownership, speaker order, Naalu ordering, pass/next-turn rules, restart preservation, and phase transitions. Extract only the operations needed to test business rules without starting a network server. Use Vitest or Node's test runner with a supported TypeScript workflow.

Acceptance: tests fail against the known defects and pass with their fixes. Include invariants for unique cards, consistent planet ownership, and configured bounds. Avoid tests that only repeat implementation expressions. Depends on the shared command shape from R03/D01.

### R15 · P1 · Add server integration tests with real clients and storage

Implement HTTP/WebSocket tests for malformed input containment, permissions, independent game isolation, two-client synchronization, deletion, restart responses, duplicate commands, and reconnect snapshots. Add real temporary SQLite tests for restart, migrations, backup, and recovery.

Acceptance: each test owns its server, ports, temporary data directory, and sockets, with deterministic cleanup. No test can crash or mutate a developer's running host. Failures preserve logs. The ad hoc review probes become failing regressions in the normal test suite, rather than permanent tests that pass when defects are observed. Depends on R01–R04 and R12.

### R16 · P1 · Add browser journeys for host and phone clients

Use Playwright to cover create, player assignment, start, strategy picks, turns, planets, scoring, next round, rejoin, and results. Include host and guest in independent browser contexts, phone layouts, network interruption, rejected requests, and reload/resume.

Acceptance: CI runs the journeys and records traces/screenshots on failure. Phone viewport checks include dialogs and tables. Tests assert synchronized state, not only that pages load. Real Windows-to-phone testing remains required under D08.

### R17 · P1 · Repair accessible naming, keyboard flows, and unknown routes

Evidence: browser automation could see the faction and color dropdowns but could not find them by accessible label. Their `aria-labelledby` referenced generated IDs inconsistent with the rendered element IDs. This is a concrete signal to verify and fix accessible names, not a complete accessibility audit. `src/client/Router.tsx:42` declares a fallback Route without `path="*"`. The browser visit to `/no-such-route` is interpreted as a game ID and misleadingly says the game was deleted due to inactivity, rather than distinguishing unknown, expired, and deleted games.

Give every control a working accessible name. Audit keyboard-only setup and play, dialog focus, error announcements, contrast, zoom, and controls whose state depends on color. Add an actual wildcard route with a useful recovery screen.

Acceptance: role-and-name queries find setup controls, keyboard users can complete a game setup, focus returns correctly after dialogs, and an unknown URL displays a recovery action. Run axe plus manual keyboard checks; automated scans alone do not establish compliance.

### R18 · P1 · Make saved games and identity survive ordinary use

Evidence: `src/client/reducer.ts:38` stores identity in sessionStorage. `PlayerNameDialog.tsx` allows choosing another display name as identity. `src/server/dirty.ts:8` automatically deletes tracked games after four hours without a dirty update, which can remove an intentionally paused game.

Build a saved-game home screen with named games, last played time, resume, export, archive, and explicit deletion. Retain local device credentials securely enough for the chosen LAN trust model, separate from visible names. Remove automatic deletion of durable user games, or make retention explicit and opt-in.

Acceptance: close/reopen, a new tab, overnight pause, and host reboot have understandable recovery flows. No unexplained four-hour deletion. Destructive operations require clear intent and preserve a backup where appropriate. Depends on R01 and R04.

## Windows desktop and same-Wi-Fi release

### D01 · P1 · Package a managed backend and React UI in Electron

Implement the architecture in `desktop-design.md`. Electron main owns app lifecycle and starts one backend utility process. The backend owns domain state and SQLite. The renderer remains an unprivileged web client. Use an available high port, return the actual origin, and wait for readiness before opening the UI. Reuse the same backend operations for desktop and phone clients.

Acceptance: launch from Start Menu with no Node installation, console, environment variables, certificate selection, or administrator privileges. Double launch focuses the existing application. A backend failure offers restart with saved state intact. Paths work with spaces and non-ASCII usernames. Depends on R01–R04 and R11.

### D02 · P1 · Add a host lobby with a shareable phone join flow

Show Host game, Resume game, and Join instructions in ordinary language. After hosting, show a QR code, copyable LAN URL, game code, and connected-player list. The game code alone cannot discover an unhosted PC; the QR code must take the phone to the selected host and game. Avoid requiring guests to install an application.

Acceptance: a new user opens the Windows app, hosts, scans on a phone on the same Wi-Fi, enters a display name, and joins. The host can see and approve players when pairing is enabled. Text explains that the PC must remain running. Depends on D01, D03, R04, and R18.

### D03 · P1 · Handle Windows Firewall and multi-adapter networks clearly

Evidence: `src/server/index.ts:48` currently listens without an explicit host, and `ip.address()` prints one address without interface selection. There is no application flow for choosing whether to expose a game to the LAN.

Default to local-only until the user chooses Host on Wi-Fi. Select a usable local interface, prefer Private-network firewall access, and show clear instructions when the OS blocks incoming connections. Handle VPN, Ethernet plus Wi-Fi, guest-network isolation, occupied ports, and address changes. Never ask users to disable their firewall or forward a router port.

Acceptance: the packaged executable works on a normal Private Windows network. A denied firewall prompt and isolated guest Wi-Fi produce actionable guidance. Public-network exposure requires explicit intent. Firewall rules, when used, reference the installed signed executable. Depends on D01 and D02.

### D04 · P0 · Restrict the desktop and LAN security boundaries

Keep Electron current. Use `nodeIntegration: false`, `contextIsolation: true`, and sandboxed renderers. Expose only narrowly typed preload capabilities. Validate IPC senders and arguments. Block unexpected window creation/navigation and restrict external-link protocols. Apply a tested CSP and response headers. Restrict HTTP origins, validate WebSocket Origin, add pairing/session checks and bounded request/connection rates.

Acceptance: a remote website or unpaired LAN client cannot administer the host, read arbitrary local files, invoke privileged IPC, or navigate the desktop window to privileged remote content. Document the LAN HTTP trust limits: pairing does not encrypt traffic against a hostile local network. Public internet hosting is out of scope. Depends on R03–R05 and D01.

### D05 · P1 · Build a signed Windows installer and document distribution rights

Use Electron Forge or a compatible maintained packaging tool to produce a per-user Windows x64 installer containing its runtime and built assets. Include application identity, icon, version metadata, uninstall behavior, dependency notices, and license notices. Preserve the repository's existing MIT notice. Review rights to redistributed Twilight Imperium names, rules text, and any artwork independently of the source-code license.

Acceptance: install, launch, uninstall, and reinstall work as a standard user on a clean Windows machine with no Node/Git tools. Sign release artifacts with publisher credentials managed in the release pipeline. Document expected OS reputation prompts; signing alone cannot guarantee their absence. Confirm supported Windows versions and add ARM64 only if tested. Depends on D01, D04, R05, and R06.

### D06 · P1 · Update safely without interrupting a live game

Implement verified release updates with an explicit install/restart point. Never apply an update during hosting without the host's action. Back up data before migration and make failure recoverable. A manually downloaded signed installer is an acceptable beta update path if clearly documented.

Acceptance: upgrade with existing games preserves data and permissions. Failed downloads and failed migrations preserve the working app and saved games. Launch and LAN play work without internet access. Do not claim automatic rollback works until tested. Depends on R01, D05, and R12.

### D07 · P2 · Add host diagnostics and clear shutdown behavior

Evidence: `src/server/log.ts:19` logs incoming payloads, and `index.ts` has no application lifecycle interface. Timers and sockets are created globally with no exposed coordinated shutdown.

Expose backend start/stop/health ownership, bounded rotated logs, app/backend versions, storage status, connected-player count, and a user-triggered diagnostic export that excludes session secrets and unnecessary player data. Explain whether closing the window ends hosting, and warn while players are connected. Recover from resume/address changes and save before shutdown.

Acceptance: support can diagnose startup, bind, storage, and connectivity failures from a redacted export. Logs are bounded. Closing, quitting, and Windows shutdown preserve acknowledged changes. Sleeping the host clearly disconnects guests and resuming restores a joinable host. Critical crash/shutdown behavior is required for beta even if the fuller support interface waits. Depends on R01, R12, and D01.

### D08 · P1 · Validate the actual Windows-and-phone release experience

Test the signed packaged artifact on the declared Windows versions, not just an unpackaged Electron development process. Include a standard user, clean machine, paths with spaces/Unicode, offline startup, firewall allow/deny, port conflicts, two or more real phones, Android Chrome, iOS Safari, phone background/resume, host sleep/reboot, app update, and recovery from abrupt termination. Add a multi-hour session with representative player counts and repeated edits.

Acceptance: someone who has never used the repository can install, host, pair phones, finish a representative game flow, close, and resume without a terminal. Record build SHA, installer checksum, OS/browser versions, and outcomes. Do not claim this gate from Linux browser emulation. Depends on the preceding P0/P1 work.

## Delivery order

1. Establish the regression harness and clean CI installation. Add failing tests for R02, R07–R11, then fix those defects. Implement the validated command boundary, permissions, and dependency upgrades.
2. Add transactional persistence and a resume/export flow. Cover crash recovery, reconnects, duplicate commands, and multi-client consistency.
3. Implement the Electron host, secure boundaries, high-port origin handoff, and local lifecycle. Keep it Windows-focused.
4. Add the host lobby, phone QR join flow, interface selection, and firewall guidance. Run the browser journeys and accessibility checks.
5. Build/sign the installer, test upgrades and offline use, and complete D08 with real Windows and phone devices.

Do not postpone all tests until the end. Add each issue's regression with its implementation. A Kubernetes deployment, public cloud service, account system, or rewrite in another frontend framework is unnecessary for this release.
