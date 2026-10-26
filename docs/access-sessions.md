# Local host and paired devices

Access-control contract for issue #4. The desktop starts locally; the host can explicitly enable sharing on a private network.

## Usage and ownership

The backend creates a random host capability at startup. Electron receives it through trusted utility-process IPC and installs an HttpOnly, SameSite=Strict cookie before opening the interface. The standalone server prints a separate one-use host claim URL. Its fragment is exchanged for the cookie and removed from browser history. Neither capability is included in a guest invitation or game export.

The host creates an invitation for one game and an approved player display name, or for a spectator. Invitations expire after five minutes and can be claimed once. Claiming mints a random device capability. Only its SHA-256 digest is stored in SQLite. Player grants survive backend restarts. Pairing a replacement device for the same name revokes its previous grants. The host can revoke all devices and outstanding invitations for a game without deleting its data. Deleting a game also deletes its grants, preventing a later reused game code from inheriting permissions.

The host removes an expired invitation link and QR code and offers a new invitation. It checks the server's expiration timestamp on a timer and when the window regains focus or visibility, including after suspension. This display change does not revoke devices that already joined. Server checks remain authoritative.

Invitation state stores the issued token and expiration, while the displayed address comes from the current hosting state. A response that arrives after a network change cannot restore the previous network address. If sharing has stopped, the link is local to this PC and no phone QR code appears. Existing displayed invitations are cleared when the network address changes.

A retry from the already-claiming device returns the same grant while the invitation is valid; replaying its link from another browser is rejected. Failed grant writes retain the unused invitation and the previous device grant.

The browser remembers a successful claim response for the current document. If reading that response body or the following device-session check fails, Try again reads the session instead of submitting the invitation again. A consumed invitation receipt expires after five minutes even though its device grant remains valid. Claims that have not returned success still retry normally. Every session read remains authoritative, including after revocation.

Claim failures distinguish rejected links from temporary host failures. HTTP 400/403 still request a replacement link. HTTP 429 asks the user to wait and retry, and other unsuccessful responses ask the user to check the host and retry the same link. These messages do not extend invitation expiry or retry automatically; the server still decides whether a later claim is valid.

Try again and Check pairing own one request at a time. A manual action reserves its cancellation controller before the read begins; further activation is ignored until it settles. The control stays mounted, focusable, and busy while checking. Failed checks keep keyboard focus available for another attempt, including when Check pairing changes to Try again or a retry returns to the unpaired screen. Closing the document cancels its active read. Successful claims still skip repeat POSTs as described above.

Opening a replacement invitation in the same tab works after a pairing error, from the unpaired screen, or while viewing another game. An invitation fragment triggers a fresh app load so the new device identity replaces the previous session and game state. The existing claim flow removes the fragment before contacting the host. Other URL fragments do not reload the app.

The session module owns credential parsing, invitation consumption, and the permission matrix. The game store owns durable guest grants. HTTP adapters reject unauthorized game operations before invoking their handlers. WebSocket adapters resolve the grant for each command, check game and faction scope, and bind the subscription to that same scope. Display names and four-letter codes never establish permission.

## Permission matrix

| Action | Host | Ordinary player | Table editor | Spectator | Unpaired |
| --- | --- | --- | --- | --- | --- |
| Catalog reference data | Read | Read | Read | Read | Read |
| Game state | Any game | Paired game | Paired game | Paired game | Denied |
| Saved-game administration | Allowed | Denied | Denied | Denied | Denied |
| Setup, faction assignments, game start/end/restart | Allowed | Denied | Denied | Denied | Denied |
| Public faction gameplay | Any faction | Assigned factions | Any faction in paired game | Denied | Denied |
| Private objective editing | Any faction | Assigned factions | Assigned factions | Denied | Denied |
| Public objectives, turn, phase, round, speaker, agenda controls | Allowed | Denied | Allowed in paired game | Denied | Denied |
| Pair, replace, or revoke devices | Allowed | Denied | Denied | Denied | Denied |

A table editor is a paired player whose host explicitly checked **Allow table-wide editing** when creating the invitation. The grant persists in database schema version 5 and applies only to the paired game. It does not expose another faction's unscored private objectives or grant desktop/network administration.

To remove the grant, create a replacement invitation for the same player name with the option unchecked and have the intended device claim it. Claiming replaces the previous device grant and disconnects its sockets. **Disconnect paired devices** immediately revokes all device grants and outstanding invitations for the game.

The host can expand **Connected devices** in the pairing dialog for a live, game-scoped list. Player names and their current table-editing grants appear only while connected. Spectators appear as a device count. Multiple tabs with the same credential count once. The host-only endpoint excludes credentials, hashes, addresses, and private game data. See [connected devices](connected-devices.md) for refresh and disconnect behavior.

## Alternatives

Trusting the game code or chosen name preserves the current impersonation flaw. Trusting loopback addresses alone does not distinguish the desktop host from other local clients and does not extend safely to LAN hosting. Public-key device identities add key management without removing the need for host approval and recovery. Random bearer capabilities with server-side grants fit the local host and browser clients, and support immediate revocation.

## Failure paths

A grant is persisted before a claim is acknowledged. A failed write retains the unused invitation for retry. Revocation is checked for existing sockets as well as new connections. Unsupported storage versions fail without replacing the original database. Migrating version 1 first creates a recoverable backup. UI state reflects the role, while server checks remain authoritative.

## Verification and current limits

Backend integration tests cover anonymous and forged credentials, one-use and expired invitations, lost-response retry, host-only HTTP operations, cross-game and cross-faction commands, read-only spectators, secret objective filtering, revocation of open sockets, failed grant writes, restart persistence, code reuse after deletion, and a recoverable version-one migration. Browser tests cover issuing a player link, using it in an independent phone-sized browser, removing its fragment, and reloading with the device cookie. These are simulated browser clients, not physical Wi-Fi qualification.

Replacement-link browser tests also cover failed player/spectator pairing, an unpaired tab, and switching from a spectator in one game to a player in another. They verify fresh app state, the actual server-issued role and game, retained host-only restrictions, and identity after reload.

Claim-recovery tests cover player and spectator sessions after failed session reads or malformed successful claim bodies. They verify recovery with one accepted claim, real device cookies, host-only restrictions, and reload. Separate controls retry rejected claims. Backend tests advance a test-only clock past receipt expiration and verify that the same device cookie still reads and subscribes to its game.

Invitation-display tests cover player and spectator expiry on the timer, window focus, and visibility changes. A controlled browser clock exercises the real server-issued deadline, removal of both link and QR code, and creation and successful claiming of a replacement invitation. Only native interface enumeration is simulated to render a LAN QR code. These tests do not qualify physical sleep or Wi-Fi behavior.

The desktop retains its loopback listener while optional Wi-Fi sharing adds one selected private interface. Player invitations include QR codes, and the sharing dialog explains Private-network firewall access. See [Wi-Fi sharing](lan-hosting.md). Physical Windows/phone testing remains tracked in #26. The standalone server can be bound explicitly with TIGHT_HOST and uses the same authorization boundary.

The host is trusted to administer every game, including its private objective data. Paired players receive their assigned factions' private objectives; other unscored descriptions are removed from snapshots and broadcasts. Scored objectives and ended games are public. Display names remain the game's labels and assignment keys; possession of a name never grants access.

The app initializes player identity from the checked session before opening its first WebSocket. A player uses the granted player name and a spectator sends no player name, even if the tab contains an earlier host or player hint. Hosts retain their optional display-name hint. The backend continues to reject guest connections that request another identity.
