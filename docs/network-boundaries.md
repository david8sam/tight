# HTTP and WebSocket boundaries

The backend accepts requests addressed to localhost, loopback IPs, and its configured interface addresses, at its actual bound port. With an explicit `TIGHT_HOST`, it accepts that address and loopback hostnames. With a wildcard/default bind, it snapshots the machine's interface IPs at startup. `TIGHT_HOST` accepts an IP address or localhost, without an IPv6 zone identifier.

Unexpected Host headers return 421. Browser requests must carry the exact same origin as the requested host and protocol; foreign, opaque `null`, malformed, or repeated Origin headers return 403. The same policy runs before HTTP routes/static files and before a WebSocket handshake. Rejected requests do not reach game operations. The server no longer grants permissive CORS access.

Requests without Origin remain supported for non-browser clients. This is a browser isolation boundary, not player authentication. Host/player permissions and pairing are still required before enabling desktop Wi-Fi hosting. The desktop preview continues to listen only on loopback. HTTP on a LAN does not encrypt traffic.

Responses also deny framing, disable MIME sniffing, restrict cross-origin resource embedding, and suppress referrers. Electron retains its separate renderer CSP and navigation restrictions.

## Development and deployment

Production browser requests use the page's own origin. The client development proxy rewrites Host and Origin to the backend it targets, for both HTTP and WebSocket traffic. Hot reload remains on the development server. Development-server access should remain limited to the developer's trusted machine.

This LAN-first policy supports literal IP URLs and localhost. Arbitrary public domain names and unconfigured reverse proxies are rejected. A trusted reverse proxy must forward the backend's Host and Origin consistently; forwarded-host headers alone are not trusted. Interface addresses are refreshed when the backend restarts. Selecting interfaces and reacting to network changes remain part of #21.

Standalone CLI startup prints the configured interface URL when `TIGHT_HOST` is explicit. The backend readiness result also reports that interface, rather than always reporting IPv4 loopback. Desktop startup still requests `127.0.0.1` and an available high port.

## Verification

`npm test` runs real HTTP and WebSocket requests for matching origins, cross-origin reads and mutations, preflights, DNS-rebinding-style Host headers, duplicate headers, and response security headers. The existing browser and desktop journeys verify normal clients keep working. CI runs the backend suite on Linux and Windows.

## Configured HTTPS

For standalone HTTPS, set `SSL_TIGHT_KEY_PATH` and `SSL_TIGHT_CRT_PATH` to the private key and certificate files and leave `TIGHT_USE_HTTP` unset or false. These settings accept operating-system filesystem paths, including spaces, Unicode, and `#`. Relative paths resolve from the backend's working directory. Use a certificate trusted by the participating browsers; the desktop's managed local HTTP listener does not need one.

`tests/https.test.mjs` starts an actual configured HTTPS listener on an available nondefault port. Its HTTPS and WSS clients trust only the local test certificate. It verifies matching origins work, an HTTP origin cannot access the HTTPS backend, and an ordinary client rejects the self-signed fixture. `tests/browser/https.spec.ts` covers setup, starting a game, phone pairing, Unicode identities, and reload against the HTTPS origin. Self-signed acceptance is limited to those disposable browser contexts. The existing desktop suite covers the managed window and packaged Windows executable.
