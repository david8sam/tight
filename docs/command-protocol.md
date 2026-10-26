# Command confirmation and concurrent edits

Every mutation travels in a `COMMAND_BATCH` envelope. It contains a UUID, the game's incarnation UUID and revision, and between 1 and 32 validated commands for that game. The host derives the principal from the authorized session and hashes the validated envelope. The browser cannot supply either digest. Host administration has a stable principal across backend restarts; paired devices use their persisted credential digest.

The client groups synchronous commands from one interaction into one transaction. Starting a game can set its initial status and start it atomically. Transferring planets can remove and acquire ownership together. Each inner command counts toward the existing per-address traffic limit. An envelope is limited to 64 KiB.

`GAME_LOAD` is a read-only subscription request. It selects an authorized game and an already registered identity and returns a full snapshot. It never registers a player, assigns a faction, or advances the game revision. Registration uses an acknowledged mutation; claiming a player invitation registers that approved identity on the host.

`BROADCAST_INITIALIZE` includes `loadedGameId`, the authorized subscription code or null for an unbound host connection. This identifies the response even when `game` is null because the game is missing. The browser and bundled backend must use the same protocol version. A load shares the ten-second recovery deadline, and snapshots from a previous subscription cannot complete that load.

## Save and acknowledgment

`GameStore.commitCommand` checks for a receipt before invoking the mutation callback. Repeating the same principal, command UUID, and payload returns `duplicate`, including when the completed action would now fail domain validation. Reusing that UUID with another payload returns `conflict`. A command based on another incarnation or an older revision returns `stale` without mutation.

One SQLite transaction commits the candidate snapshot, revision, and receipt. Each inner command is checked against the state produced by the preceding command. Any permission or domain rejection rolls back the whole batch, its in-memory changes, socket identity changes, and pending broadcast flags. No-op batches can keep their revision and still receive a receipt. A failed storage write rolls back state and receipt.

The server sends a full authorized snapshot and then `COMMAND_RESULT` after commit. Other subscribers receive versioned change broadcasts. Results identify the command and game and use these statuses:

- `saved` confirms a committed transaction.
- `duplicate` confirms that the identical transaction already committed.
- `stale`, `conflict`, `rejected`, and `missing` confirm that this attempt did not apply a change.
- `unconfirmed` means the host could not provide a trustworthy outcome. The connection closes with 1011 and storage needs attention.

Current authorization is checked before receipt lookup. Revoked credentials cannot retrieve a receipt or game snapshot. Reconnect begins with a full authorized snapshot. The client ignores older revisions from the same incarnation and requests a full snapshot when a change references another incarnation.

## Retry and recovery

The client retains up to 32 outstanding batches in memory. Each retains its original encoded bytes, ID, and base revision. After a 10-second acknowledgment timeout it retries those exact bytes, up to three deliveries. Reconnect also uses the same bytes and remaining attempts. It never silently rebases a stale edit or creates a replacement ID during retry.

The header shows Saving, Saved, Unconfirmed, or Not saved. Rejections show a dismissible message. An unconfirmed change keeps its pending identity and provides **Check last change**, which grants another bounded set of deliveries using that same identity. Controls that depend on the outstanding change wait for its confirmation. Connection recovery remains separately bounded to five attempts. Failed handshakes wait 3, 6, 12, and 24 seconds between attempts. After a working connection closes, the first reconnect waits 3 seconds. A successful connection resets the backoff; manual Reconnect starts a fresh attempt immediately.

Outstanding payloads are not written to browser storage. Closing or reloading a page discards them. After reloading, review the current game before repeating an uncertain action. A backend restart preserves committed receipts; a browser restart does not preserve unconfirmed local requests.

Returning to a visible game requests a full snapshot on the existing open socket and shows Connecting while waiting. A valid full snapshot cancels the ten-second deadline. Repeated visibility events share that pending request rather than extending its deadline. A failed send or an expired deadline retires the old socket before initiating its close handshake, so a silent connection cannot block normal bounded reconnection. Late events from the retired socket cannot change the current state or timers. This recovery keeps outstanding command IDs, bytes, and remaining attempts unchanged.

New connections also wait for their initial full snapshot with the same deadline. Opening a socket alone does not reset the connection-attempt budget or mark the connection ready. Only a validated full snapshot does that. Reconnecting delivers uncertain commands after this snapshot and keeps their original identities. A host that accepts sockets without initializing them therefore reaches the same five-attempt limit as failed handshakes. Browser suspension can delay timer execution; these deadlines run when the browser resumes JavaScript.

A synchronous command-send exception also retires the socket immediately instead of waiting for its close event. The change stays Unconfirmed until the existing bounded reconnect and snapshot path can replay it. Replay retains the exact command bytes, ID, base revision, and remaining delivery budget, including when the host may already have committed it. Repeated send failures do not renew that budget. After three delivery attempts, **Check last change** is required to grant further attempts with the same identity.

Policy and storage closes, codes 1008 and 1011, remain blocked across visibility changes. Only explicit **Reconnect**, **Check last change**, or reloading the page starts recovery from those closures. Foreground resynchronization does not override authorization or storage failures.

Receipts retain the most recent 2,000 per game and 10,000 overall. A pruned command that changed state has an old revision and cannot apply twice. If a pruned no-op is repeated without an intervening state change, it remains a no-op. Revisions never reset while a game exists, including game restart; a newly created or imported game receives a new incarnation. Metadata and receipts stay outside portable game exports.

If a game is explicitly deleted and a replacement with the same code is created or imported before the next broadcast, the replacement's full snapshot supersedes the queued deletion. The old tombstone cannot be sent with the new game's version and delete a fresh subscription. Deletion without a replacement still notifies subscribers normally. Old guest grants remain revoked; reusing the code does not restore them.

## Verification

Run `npm test` for real-client concurrency, duplicate, conflict, lost-response replay, rollback, restart, receipt-write failure, and reused-game-code tests. Run `npm run test:browser` for the host and phone journey and acknowledgment fault injection. The desktop suite decodes both rendered QR codes and checks their centers against the dialog's content stack. Physical Windows and phone qualification remains a separate release gate.
