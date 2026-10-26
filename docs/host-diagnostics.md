# Host diagnostics

The Windows desktop has a **Help > Export diagnostics...** command. Choose a writable folder for its JSON file. A startup failure also offers **Export diagnostics** before restarting or quitting. Review the file before sharing it with support.

The report contains the app, bundled backend, Electron, and Node versions, the operating system and architecture, the current backend state, the number of open connections and connected paired player devices, the number of private network adapters, and whether Wi-Fi sharing is enabled. Storage `open` means the backend owns an open database. It does not certify free disk space or that the next write will succeed. A stopped or unreachable backend reports storage unavailable.

The bundled backend uses the app version. Packaged apps also include the full source revision and whether the build checkout had changes. Builds without a usable Git checkout and unpackaged development launches report both values as null. This identifies the source checkout; it is not a signature or a guarantee that a locally produced binary is authentic. The running app never needs Git. Build metadata is bounded and filtered before export; paths and arbitrary fields are excluded.

Runtime save failures add a `storage.write-failed` event with an allowed operating-system or SQLite error code. Unknown codes become `UNKNOWN`. Raw error messages, including database paths and SQL text, never enter the report. A failed save remains unconfirmed or rejected as defined by the command protocol; diagnostics do not change that outcome. Nested save and command failures produce one event for the underlying failure. If SQLite already rolled back the transaction, cleanup preserves and reports the original write failure.

Lifecycle events cover startup, startup failure, bind failures, sharing changes, backend crashes, shutdown, sleep, and resume. Known operating-system error codes appear without their error messages. The report excludes cookies, host credentials, invitations, addresses, game codes, player names, game data, installation paths, and the data-folder path. It does not copy standard output, stack traces, request bodies, or the game database.

The desktop stores up to three 64 KiB event files in a `diagnostics` folder inside its Electron profile. With `TIGHT_DATA_DIR`, they live in that data folder instead. Exports include at most the latest 200 valid events. Unwritable logging storage, unreadable log files, or log files exceeding the size limit do not stop hosting; the report marks persistent logs unavailable and includes at most 200 events retained in memory for the current launch.

WebSocket traffic logs use a generated connection UUID, direction, message type, and timestamp. They do not include game codes, player names, command bodies, or response bodies, including in development and debug mode. Connection open/close and heartbeat termination logs use the same UUID. This protects private objective text from routine traffic logging while preserving connection-level troubleshooting. Raw error output is separate from this traffic-log policy and is not included in diagnostic exports. The standalone CLI still prints its one-use host-claim URL at startup; treat that startup output as a credential.

## Closing and sleeping

Closing the window asks whether to keep hosting. The prompt includes the current number of paired player devices if the backend responds. Quitting closes both listeners and player sockets, clears timers, and releases the database. The native launcher allows five seconds before terminating an unresponsive backend. Changes confirmed by the command protocol are already committed; quitting does not wait for an unconfirmed browser action.

Before sleep, TIGHT disables Wi-Fi sharing and closes guest connections. After resume, it tries the previously selected address again. The backend validates that the address still belongs to a private adapter. If the address changed, sharing stays off and TIGHT asks the host to choose the current network. Keep the PC awake during a game. Operating-system suspension can happen before asynchronous cleanup completes, so guest devices must still treat a silent connection as disconnected and reconnect after resume.

The launcher handles the Windows window session-end event and supported native power shutdown events by stopping the backend without a confirmation dialog. Forced process termination still relies on SQLite's committed-write recovery. Actual Windows sleep, shutdown timing, firewall behavior, and a physical phone remain release qualification in issue #26. Automated Electron tests emit the native power events; they do not suspend the cloud machine.

Sleep temporarily stops the LAN listener without forgetting approved sharing. Resume uses the same preference controller as manual changes, so an explicit Stop takes precedence. Operating-system session end prepares the sharing preference and stops hosting without an interactive warning.
