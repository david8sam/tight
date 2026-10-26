# Recovering from connection failures

Browser HTTP requests have a 15-second deadline, including reading the response body. Catalog, game, and saved-game requests share this boundary. Catalog failures show a retry action rather than leaving the app on a spinner.

Create, join, and restart dialogs allow only one pending request. Closing a dialog cancels its request and ignores its eventual result. A failed or timed-out request releases the submit button and preserves the form. Create and restart failures ask users to inspect saved games or the current state before retrying, because losing an HTTP response does not prove the host rejected the change. Requests are never replayed automatically.

WebSocket connections have bounded opening waits and five attempts. Failed handshakes back off by 3, 6, 12, and 24 seconds; losing an established connection starts recovery after three seconds. Closing or unmounting the app clears connection, foreground-snapshot, and command timers. Policy and storage closures require explicit recovery, including after a tab or phone returns to the foreground. Sending while disconnected immediately offers Reconnect instead of silently dropping the command. Player registration waits for the player to appear in the game state and stops waiting after 15 seconds.

Returning to a visible game asks the host for a full snapshot. If an open socket cannot send the request or returns no full snapshot within ten seconds, the client retires it and uses normal bounded reconnection. It does not wait for a dead close handshake. Repeated foreground events do not restart the deadline. A successful snapshot cancels it. This is client recovery using the existing protocol; it adds no heartbeat message or server-side state.

Navigation, foreground resynchronization, and reads triggered by a changed game incarnation share one snapshot-send boundary. A synchronous read-send failure uses normal connection recovery instead of reporting an unsupported host reply. Reply validation still rejects malformed host data.

A newly opened socket also needs a valid initial snapshot within ten seconds. The app keeps Connecting visible and does not reset its retry budget until that snapshot arrives. Repeated open-but-uninitialized connections stop after five attempts and offer Reconnect. Browser suspension can delay these timers until JavaScript resumes.

Mutations use command IDs, acknowledgments after durable writes, and revision checks. Retries keep the original bytes and identity rather than repeating an action under a new ID. See [command confirmation](command-protocol.md) for retry budgets, stale edits, and uncertain outcomes. A successful WebSocket `send` alone still means only that the browser queued bytes.

Saved-game loads share the ten-second snapshot deadline. If no matching full snapshot arrives or sending the load request throws, the client retires that socket and uses bounded reconnection instead of leaving an open socket behind the Reconnect screen. Navigation records its validated target before sending the load request. The replacement connection uses that target even if the previous game is still loaded in memory, so switching saved games recovers the requested game. Full snapshots identify the subscription even when the game is missing. A late response or change from the previous game cannot satisfy the new load or extend its deadline.

Each accepted full snapshot also triggers the loading page to recheck its result, including when both the previous and new game values are null. If a game disappears between validation and loading, the existing unavailable-game page offers a return to Home. Loading a game remains a read operation and does not replay an edit under a new identity.

Browser regressions exercise HTTP errors, a stalled request, dialog cancellation, catalog retry, commands attempted after socket closure, lost acknowledgments, and foreground recovery with native socket fault injection. They cover a missing snapshot, a synchronous send exception, a held close handshake, successful deadline cancellation, and explicit recovery after policy/storage closes. These controlled visibility and socket faults do not replace physical phone background/resume or Wi-Fi qualification under #26. Native desktop tests exercise quitting, reopening, and restarting the utility process.

CI browser and desktop runs use Playwright's `--fail-on-flaky-tests` policy. A test that succeeds only on retry fails the check, so the existing failure-artifact step retains its trace and diagnostic context. A green retry alone is not accepted as verification.

The player-selection keyboard journey waits for the menu to be visible and its intended option to hold focus before choosing it. Its game cleanup runs in a separate teardown hook with a bounded request, preserving the original failure when a test times out.

The native desktop setup journey starts renderer/network tracing before waiting for the first window. Failure diagnostics bound renderer and main-process reads independently, preserving an available window result when the renderer does not answer. A bounded trace capture is attached on failure. The startup assertion and its deadline remain unchanged; the diagnostics do not claim to fix an unexplained native startup failure.
