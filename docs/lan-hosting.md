# Desktop Wi-Fi sharing

The desktop keeps its original loopback listener and renderer origin. Enabling sharing adds a second listener bound to one selected private IPv4 adapter, at the same port. Both listeners use one Express app, SQLite writer, session owner, WebSocket server, and broadcast timer. Stopping sharing disconnects LAN clients and closes only that listener; the desktop can keep playing locally.

Two alternatives were considered. Restarting the whole backend on a selected adapter would interrupt the host window and change its origin. Binding a single wildcard listener would expose unselected interfaces. Separate WebSocket servers per listener would also race to consume the shared dirty-game queue. The selected design attaches both listeners to one WebSocket server and retains one broadcast owner.

The native preload exposes only hosting status and selecting or stopping a LAN listener. The main process verifies the sender's main frame, origin, and host cookie before forwarding a request to the backend. The backend rechecks that the address belongs to a current private IPv4 interface. Changes run in sequence. Switching adapters binds the replacement before retiring the old listener; a bind failure leaves the existing host and sharing session available.

The Host and Origin policy accepts loopback and the selected LAN address. Existing player and spectator authorization applies on both listeners. QR invitations contain guest capabilities, never the desktop's host capability. The lobby QR has no credential and lets already-paired devices reconnect using their cookie.

Windows firewall rules are not changed automatically. Users select a trusted private network and allow TIGHT on Private networks if Windows prompts. No router forwarding, internet account, or cloud service is required. Real Windows firewall and physical phone qualification remains tracked in issue #26.

## Joining and troubleshooting

Keep the PC awake and connect phones to the same trusted Wi-Fi. Enable sharing, then create a private invitation with **Pair device** inside the game. The lobby QR only opens the address; it does not grant access to a new device.

If a phone cannot connect, check that Windows permits TIGHT on Private networks and that the router does not isolate guests or wireless clients. Do not enable router port forwarding. Stopping sharing disconnects phones while keeping the desktop game open.

If the selected adapter disappears or its address changes, refresh the network list and select the current adapter. An address change also changes the browser origin, so issue fresh invitations for phones using the new address. Automated tests exercise real interface binding and decode rendered QR images; they do not replace physical phone camera and Windows firewall qualification.

## Reopening a shared game

TIGHT remembers the private adapter explicitly selected in **Wi-Fi sharing**. Reopening the app restores sharing only when that adapter's name and private IPv4 address still match the current network list. The backend validates the address again before binding. **Stop Wi-Fi sharing** clears the remembered selection, so reopening stays local. A first launch also stays local.

The preference contains only the adapter name and address in `sharing.json` under Electron's per-user profile. It contains no host credential, invitation token, game, or player identity. Approval and listener changes run in one native queue. At startup, TIGHT consumes the saved preference before binding. Active approval stays in memory and is written atomically only during graceful quit. A failed adapter change retains the previous in-memory approval. If the app crashes, enable sharing again when it reopens. A failure to consume the preference keeps sharing local and blocks manual sharing until the preference can be cleared. Stop still closes the listener, but reports a failure if the old preference cannot be forgotten; retry after fixing profile permissions. Backend recovery does not retry blocked approval automatically; a failure to save on quit shows a warning and does not leave an earlier consumed selection to replay. The normal host frame, origin, and cookie checks still protect these controls.

If the remembered network disappeared or the new listener cannot bind, TIGHT opens locally and explains how to choose a current network in **Wi-Fi sharing**. A resumed game can then create a fresh private QR invitation. Old invitation tokens are not stored or replayed after app restart. A new app session can use another port, so create a new invitation rather than reusing an old screenshot.
