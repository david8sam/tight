# Host traffic limits

One backend owns the allowances for both the loopback and selected Wi-Fi listeners. Limits use the TCP peer address, normalizing IPv4-mapped IPv6 addresses. The app does not trust Forwarded or X-Forwarded-For headers and does not support deployment behind a reverse proxy.

| Resource | Burst capacity | Refill or bound |
| --- | --- | --- |
| API HTTP requests per peer | 120 | 10 per second |
| Page and static-file HTTP requests per peer | 120 | 10 per second |
| Host or guest pairing claims per peer | 30 | One every two seconds |
| WebSocket upgrade attempts per peer | 40 | Two per second |
| WebSocket commands per peer | 60 | 10 per second, shared across connections |
| Open WebSockets | 64 total | 16 per peer |
| TCP connections per HTTP listener | 256 | Released when closed |
| Rate-limit peer records | 256 per limiter | Fully refilled idle entries are reclaimed |
| Queued WebSocket output | 1 MiB | A stalled reader is terminated before another send once above this bound |

HTTP throttling happens before static files, authorization, or body parsing and returns JSON with status 429, Cache-Control: no-store, and Retry-After. API paths and page/static-file paths use independent allowances. Loading the app cannot spend the API budget needed to manage saved games, and an API burst cannot prevent the recovery page from loading. Both classes remain bounded, share their allowances across listeners, and ignore forwarded-address headers. Pairing has an additional allowance. Upgrade throttling returns 429; a full connection budget returns 503. A command burst closes the offending socket with policy code 1008. Reconnecting does not reset its peer's command allowance. Existing connections are retained.

Listeners configure a ten-second header timeout, fifteen-second request timeout, five-second keep-alive timeout, and at most 1,000 requests per persistent connection. Node enforces request/header deadlines using its timeout-check interval. Shutdown still closes listeners and upgraded connections explicitly.

These bounds target accidental loops and local client abuse on a trusted private network. They do not provide protection against saturation of the network or operating system. Devices sharing a source IP share allowances. LAN HTTP remains unencrypted; pairing does not protect credentials against a hostile local network. Internet hosting is outside the supported scope.

Production entry and lazy scripts use content fingerprints in their filenames. Only those versioned public JavaScript files receive immutable, year-long browser caching. Reloads can reuse the same bytes without spending another request allowance for each script. HTML continues to revalidate so a new build selects new script URLs; session responses remain no-store. The request capacities above are unchanged, and requests that reach the server still pass through the limiter before static-file handling.
