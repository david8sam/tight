# Connected devices

The host opens **Pair a device** inside a game, then expands **Connected devices**. The list shows connected paired player names, ordinary or table-wide editing permission, and a count of spectator devices. It schedules a refresh five seconds after each completed read while expanded. **Refresh connected devices** requests an immediate update. Failed reads hide the old list and offer retry.

Only active game connections appear. An invitation or a saved device grant alone does not establish presence. The host is excluded. Multiple tabs using the same device cookie count once. Revoked and replaced grants stop contributing immediately, even before an old socket closes. Closing a phone connection removes it from the next refresh. A silent network loss can remain visible until the heartbeat detects it. Names identify approved players, not physical hardware or people verified by the app.

This panel does not add per-device revocation. Use the existing replacement invitation or **Disconnect paired devices** controls. They retain their current confirmation and permission behavior. Successful revocation immediately replaces the displayed snapshot with a fresh read and keeps the panel expanded.

## Ownership and boundaries

The WebSocket server owns live connections. It derives a game-scoped snapshot from open sockets and current authorization. Credentials are used only to deduplicate internally. The response contains player names, a table-editing boolean, and the spectator count. It contains no socket IDs, credentials, credential hashes, addresses, private objectives, or data from other games.

`GET /api/session/connections?gameId=ABCD` requires host authorization, validates the query, returns 404 for a missing game, and disables caching. All guests, including table editors, receive 403. `gameConnectionsSchema` defines the shared response shape; the browser parses the network response at that boundary.

The UI starts a read only when the host expands the panel. Reads run serially with a bounded response timeout. Collapsing the panel, closing the dialog, or changing games aborts active reads and cancels future refreshes. A manual refresh cancels the previous read before starting another. The panel does not change game revisions or stored grants.

## Design choices

A durable list of paired devices would show offline credentials rather than the requested connected players. A WebSocket presence broadcast would add a new protocol message and subscriptions for host-only data. A host-only read derived from the existing connection owner keeps presence ephemeral and leaves gameplay synchronization unchanged.

A permanent setup panel would compete with the faction slots that must fit on the host screen. A separate toolbar button and dialog would add another place to manage invitations. A collapsed section in the existing pairing dialog follows the app's accordion pattern and keeps connection status beside invitation and recovery controls.

## Verification

The backend access suite uses real sockets to cover host-only access, game isolation, same-device tabs, spectator counts, ordinary and table-editing permissions, last-tab disconnect, replacement, revocation, invalid queries, and missing games. The browser journey exercises the host panel with independent player and spectator contexts, failed reads, retry, refresh, and cancellation.

This advances issue #20. It does not establish physical Windows firewall, phone camera, background/resume, or Wi-Fi qualification under #26.
