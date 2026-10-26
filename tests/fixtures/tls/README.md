# Local TLS test fixture

These are public test credentials. Never use them for a deployed host.

The self-signed certificate covers `localhost` and `127.0.0.1` and expires in October 2036. Backend tests explicitly trust this certificate for their own HTTPS and WSS connections. They also check that an ordinary client rejects it. Browser tests accept the self-signed certificate only in their disposable browser contexts; production certificate settings remain unchanged.

The host helper copies both files into paths containing spaces, Unicode, and a literal `#` before starting the real configured HTTPS server. This checks that certificate configuration treats paths as filesystem paths.

Regenerate both files together with OpenSSL when the fixture expires:

```sh
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout tests/fixtures/tls/localhost-key.pem \
  -out tests/fixtures/tls/localhost-cert.pem \
  -days 3650 -subj '/CN=TIGHT localhost test fixture' \
  -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
```
