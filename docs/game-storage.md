# Game storage and recovery

The backend stores games in `games.sqlite` using Node's built-in SQLite support. Use Node 24.19.0 (recommended) or at least 22.15.0. The database format is version 5. Versions 1 through 4 are validated and backed up under `backups/migrations` before migration. Version 2 added hashed device grants; version 3 added game incarnations, revisions, and bounded command receipts. Version 4 added saved-library metadata, and version 5 adds host-approved table-editing grants. Unknown versions remain untouched.

The default directory is `%LOCALAPPDATA%\TIGHT` on Windows, or `$XDG_DATA_HOME/tight` on other systems (falling back to `~/.local/share/tight`). `TIGHT_DATA_DIR` overrides the directory. Data stays outside the application installation and survives a server restart. The Electron launcher uses the same game-storage location and keeps its browser profile outside the installation folder.

For this cloud workspace, set `TIGHT_DATA_DIR=/workspace/.tight-data` before starting the server. Do not commit that directory. Automated server and browser tests use separate temporary directories and never use the normal game database.

## Commit behavior

One backend holds an exclusive SQLite lock for its lifetime. Starting another backend with the same directory fails before it starts listening. Closing or force-killing the first process releases the lock; no PID file needs removal.

Game creation, restart, import, and deletion write to SQLite before returning success. A WebSocket command commits its changed game before the next broadcast. If a write fails, the backend restores the previous game, pending broadcast flags, and socket player binding. It closes the sending connection with code 1011, and the interface offers reconnect. HTTP storage failures return 503. Reconnect to inspect the committed state before retrying. See [command confirmation](command-protocol.md) for acknowledgments and safe retries.

SQLite uses its rollback journal and `synchronous=FULL` for interrupted-write recovery. Games no longer expire after inactivity. Explicit deletion remains permanent in the current database.

## Backups and compatibility

After loading a valid, nonempty database at startup, the backend writes a complete SQLite backup under `backups/`. It keeps the three newest startup backups. These are startup snapshots, not a backup after every move. Keep separate exports for longer-term protection.

An unsupported schema version, malformed saved game, or invalid database stops startup. The backend does not replace the file with an empty database. Migration backups retain the original format so recovery can use a compatible application version. A version-5 database cannot be opened by a preview that supports only an earlier schema; restore a pre-migration backup into a separate data folder if a downgrade is necessary.

To restore a backup:

1. Stop every backend using the data directory.
2. Copy the entire data directory to a safe location.
3. Replace `games.sqlite` with the desired file from `backups/`.
4. Start the backend and open the saved game's existing code or URL.

Never copy or replace a live database by hand. If SQLite left a rollback journal after a crash, let the backend recover it before attempting manual recovery.

## Export and import API

`GET /api/game/export?gameId=ABCD` downloads a JSON envelope with `format: "tight-game"`, `version: 1`, and the complete game. Missing games return 404.

`POST /api/game/import` accepts the exported JSON with `Content-Type: application/json`, up to 1 MiB. It validates the complete snapshot before writing. An existing game code returns 409 and is never overwritten. Invalid or unsupported exports return 400. Successful imports retain the code, player names, factions, planets, scores, and game status.

The normal request limit remains 64 KiB. The home screen lists saved games, opens their existing URLs, downloads exports, and imports selected JSON files. Deletion requires confirmation. Duplicate imports preserve the existing game and show an error. Saved-game administration is host-only. Paired players and spectators cannot list, rename, archive, import, export, or delete the host’s saves.

## Verification

`npm test` runs real backend processes to test committed moves across forced termination, exclusive ownership, restart and deletion durability, backup integrity and rotation, export/import round trips, invalid database preservation, and failed writes. Write failures use SQLite abort triggers in disposable databases, without product-only test switches. CI runs these checks on Windows and Linux, including the minimum Node version on Linux.

## Saved-game library

Hosts can rename games with up to 80 characters, clear the name to use the game code, and archive or restore games. Archived games are hidden from the default home list. **Show archived games** reveals them. Archiving preserves the complete game, paired devices, and join links; it does not pause or lock a live game.

The list sorts by the last committed game change. Renaming, archiving, reading, and retrying an already committed command do not update this timestamp. A resumed game moves to the top after its next saved change. Imported games receive the import time.

Names, archive status, and the last-played timestamp belong to this host’s library. SQLite stores them beside the snapshot, separately from game state and command revisions. Organization changes therefore cannot stale an outstanding phone command. A whole-database backup preserves library details. Portable JSON exports keep the existing game-only format and do not include the name or archive status.

Database version 4 introduced these fields. Migration to version 5 preserves them and validates them before changing the database. Existing games begin unnamed and unarchived, with their creation time as the initial last-played value because older versions did not record it. Invalid persisted metadata stops startup while preserving the database.

Keeping these fields in game snapshots would change live revisions for library-only actions and alter portable exports. A separate JSON sidecar would lose SQLite’s write and backup guarantees. Columns on the existing game row keep creation, updates, deletion, and backups consistent without an additional synchronization step.

## Optional browser tab hints

The browser keeps game, display-name, and theme hints in tab storage when it is available. Those hints are separate from the host's SQLite saves and the device credential cookie. If a browser denies tab-storage access or an operation fails, the current document keeps hints in memory instead. Pairing, game reads, and state updates still use the host's authoritative session and data.

The fallback lasts only until the document closes or reloads. A host may need to choose its existing display name again and select a theme after reload. Player and spectator identity is restored from the valid device cookie and server grant. A failed hint removal cannot restore an old hint during the current document's lifetime. Native tab persistence continues normally when available.

Stored tab hints are parsed when read. Unsupported game codes, invalid display names, and unknown themes are ignored before they reach app state or a connection query. Valid hints retain their normal behavior. This does not change saved games, device credentials, or server permission checks.

A bare game address redirects to its status route before the game view loads. Saved-library Resume uses that same route boundary whether tab hints already restored a game or the host must select its existing player. The redirect does not wait for WebSocket game state, and invalid game-code addresses still show route recovery.
