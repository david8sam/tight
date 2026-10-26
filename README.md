# TIGHT

TIGHT is a Twilight Imperium game helper and tracker. A Windows Electron app hosts the game; players join in their phone browsers over the same Wi-Fi. It tracks faction assignments, strategy cards, turns, phases, rounds, planets, objectives, and victory points.

This is an unsigned Windows x64 evaluation preview. It is not a production release or a complete rules engine.

## Run the Windows preview

1. Open [Build and regression tests in GitHub Actions](https://github.com/alvinxiao/tight/actions/workflows/ci.yml) and select a successful run for the source revision you want.
2. Download and extract the `TIGHT-windows-x64-preview` artifact.
3. Run the setup executable in its `installer` folder, then open **TIGHT** from the Start menu. Alternatively, open `TIGHT.exe` in the portable app folder. Keep its DLLs and `resources` folder together.
4. Create a game or resume one from the home screen.

The app includes Electron, the backend, and browser assets. Users do not need Node, Git, a terminal, or administrator elevation. The installer installs for the current Windows user. Windows may show publisher or reputation warnings because the preview is unsigned.

The app starts locally on an available port. Closing its window offers **Keep TIGHT open** or **Quit and save**. Quitting stops hosting and disconnects phones. Reopening restores committed games.

See the [desktop guide](docs/windows-desktop.md) and [installer guide](docs/windows-installer.md) for packaging, uninstall behavior, and manual updates.

## Join from a phone over Wi-Fi

1. Connect the PC and phones to the same trusted private Wi-Fi. Keep the PC awake and TIGHT running.
2. In the desktop app, open **Wi-Fi sharing**, select the private network adapter, and start sharing.
3. If Windows prompts, allow TIGHT on **Private networks**.
4. Inside the game, open **Pair a device**, choose player or spectator access, and enter the player's name for a player invitation.
5. Create the invitation. Have that person scan its private QR code or open its link in their phone browser.
6. Assign the player to a faction on the Players screen.

Invitations expire after five minutes and can be claimed once. A game code or the lobby QR alone does not authorize a new device. The lobby QR opens the host address so an already-paired browser can reconnect.

For a trusted helper, the host can check **Allow table-wide editing** before creating a player invitation. Leave it unchecked for ordinary player access.

In **Pair a device**, expand **Connected devices** to see connected player names, their editing permission, and the spectator-device count. The host is excluded, and multiple tabs in the same paired browser count once. The list refreshes while open and offers retry when a read fails. See [connected devices](docs/connected-devices.md).

**Stop Wi-Fi sharing** disconnects phones while leaving the desktop game open. After a normal quit, sharing can resume only if the previously approved adapter name and private IPv4 address still match. After a crash or an address change, select the current network and create fresh invitations. A new app session can use a different port, so do not rely on old invitation screenshots.

If a phone cannot connect, check Windows Private-network firewall access and router guest/client isolation. TIGHT does not change firewall rules automatically. Do not disable the firewall or forward router ports. LAN sharing uses HTTP and does not encrypt traffic against a hostile local network. Internet hosting is outside the supported workflow.

See [Wi-Fi sharing and troubleshooting](docs/lan-hosting.md).

## Permissions

Permissions are enforced by the backend. Display names and game codes are labels, not credentials.

| Access | What it permits |
| --- | --- |
| Host | Administer all local games, setup and faction assignments, start/end/restart games, manage saves, and pair or revoke devices. The host can read private objectives. |
| Paired player | Read the paired game and edit gameplay for assigned factions, including their private objectives. |
| Player with table-wide editing | Also edit every faction's public scores, planets, and strategy cards, plus public objectives, turn, phase, round, speaker, and agenda controls in the paired game. |
| Paired spectator | Read the paired game without changing it. |
| Unpaired browser | Reference catalog access only. A host invitation is required to access a game. |

Table-wide editing does not grant faction assignment, game start/end, saved-game administration, device pairing, or desktop/network administration. It does not reveal or permit editing another player's unscored private objectives. Scored objectives and ended games are public.

Device grants persist across backend restarts while the browser retains its cookie. Claiming a new player invitation with the same name replaces that player's previous device grant. To remove table-wide editing, issue and claim a replacement invitation with the option unchecked. To revoke everyone immediately, use **Disconnect paired devices** in the pairing dialog. This also invalidates outstanding invitations for that game.

## Saved games and recovery

The home screen supports resume, rename, archive/restore, export/import, and confirmed deletion. Archived games remain playable and retain their paired devices. **Show archived games** reveals them. Search saved games by name or code, sort by Last played or Name, and use Clear search to restore the list. Search and sorting stay local to the current home screen and do not change saves. Games do not expire after inactivity.

Windows saves live in `%LOCALAPPDATA%\TIGHT\games.sqlite`, outside the installation folder. Uninstalling preserves saves and the browser profile. `TIGHT_DATA_DIR` overrides game storage. Only one backend can own a data directory at a time.

Changes commit to SQLite before acknowledgment. The app shows Saving, Saved, Unconfirmed, or Not saved. After an uncertain result, use **Check last change** or reconnect and review the saved state before repeating an action. Reloading discards unconfirmed requests held in browser memory.

The backend keeps the three newest startup backups for valid, nonempty databases. Schema migrations create separate pre-migration backups under `backups/migrations`. The current schema is version 5, which adds table-editing grants. Older previews may not read it. Invalid or unsupported saves stop startup rather than being replaced with an empty database.

Export important games before changing versions. Portable JSON exports contain the game, including private objectives, but exclude device credentials and host library names/archive status. Imports preserve the game code and reject a code that already exists. Deletion removes the live game and its grants; it does not erase existing exports or backups.

See [storage and recovery](docs/game-storage.md) and [command confirmation](docs/command-protocol.md).

## Develop from source

Use Node `24.19.0` from `.nvmrc` and npm `11.9.0` from `packageManager`. CI also tests the minimum supported Node `22.15.0` on Linux.

```sh
npm install --global npm@11.9.0
npm ci
npm run desktop
```

The checked-in `.npmrc` enables `legacy-peer-deps` for the existing MUI styling dependency. Use frozen `npm ci` installs. Dependency changes must commit both manifests.

To run a standalone browser host:

```sh
npm run build
npx cross-env TIGHT_USE_HTTP=true TIGHT_HOST=127.0.0.1 PORT=3000 TIGHT_DATA_DIR=.tight-data/dev npm start
```

Open the one-use **Host access** URL printed at startup to authorize the host browser. Visiting the address alone does not grant host access. For standalone HTTPS, configure `SSL_TIGHT_KEY_PATH` and `SSL_TIGHT_CRT_PATH` instead of enabling HTTP.

For development, run these in separate terminals:

1. `npm run server:dev`
2. `npm run client:dev`
3. After both builds finish, `npx cross-env TIGHT_USE_HTTP=true TIGHT_HOST=127.0.0.1 PORT=3000 TIGHT_DATA_DIR=.tight-data/dev npm run start:dev`

The backend serves watched browser assets and API from one origin. Reload after a client rebuild. Node watch mode restarts the backend after a server rebuild.

## Verify changes

| Command | Coverage |
| --- | --- |
| `npm run typecheck` | All browser-app and Node-backend TypeScript source, checked with their respective build configurations. |
| `npm run typecheck:browser` | Browser and Electron test code. |
| `npm test` | Backend, domain, validation, permissions, concurrent commands, persistence, migrations, and recovery with disposable servers and databases. |
| `npx playwright install chromium`, then `npm run test:browser` | Real Chromium host and independent phone-sized browser journeys, including pairing, gameplay, saved games, permission boundaries, and request recovery. |
| `npm run test:desktop` | Electron startup, isolation, lifecycle, sharing, persistence, and recovery. Linux needs a virtual display. |
| `npm run audit:runtime` and `npm audit --audit-level=low` | Runtime and full dependency advisory checks. |
| `npm run installer:windows:preview` | Build the unsigned Windows installer on Windows. |

CI covers Linux and Windows server/build checks, Linux browser journeys, Electron integration on both platforms, and the packaged Windows executable. Windows checks also exercise installer refusal during live hosting, in-place installation, uninstall/reinstall, and preserved saves and grants.

These automated checks do not establish physical phone or clean-machine release qualification. Use the [Windows and phone qualification procedure](docs/windows-phone-qualification.md) and its blank evidence record for those tests.

## Remaining release limitations

- The preview is unsigned. Publisher signing, final dependency/license review, and rights to distribute Twilight Imperium names, rules text, and artwork remain release work. The source MIT license does not resolve those distribution rights.
- Windows 11 x64 is the qualification target. Clean standard-user Windows machines, SmartScreen, firewall allow/deny, Android Chrome, iOS Safari, multiple real phones, and extended play still need recorded qualification. ARM64 is not supported by this build. Linux is a test environment, not a supported release target.
- There is no automatic updater or automatic application rollback. Export and back up before manual updates. Signed cross-version upgrades, failed-update recovery, offline qualification, host sleep/reboot, and phone background/resume still require release testing.
- Input validation and permissions are implemented, but TIGHT does not enforce every Twilight Imperium rule or prerequisite. Players remain responsible for legal moves and scoring.
- Accessibility and full release security/experience qualification remain ongoing. Automated browser and Electron checks do not replace manual review.

Track current status in [GitHub issues](https://github.com/alvinxiao/tight/issues), especially [signed distribution #23](https://github.com/alvinxiao/tight/issues/23), [safe updates #24](https://github.com/alvinxiao/tight/issues/24), and [Windows/phone qualification #26](https://github.com/alvinxiao/tight/issues/26). The [readiness backlog](docs/production-readiness.md) records the original findings and acceptance criteria.

Further reference: [network boundaries](docs/network-boundaries.md), [dependency security and notices](docs/dependency-security.md), and [host diagnostics](docs/host-diagnostics.md).
