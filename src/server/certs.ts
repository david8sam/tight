import fs from 'fs';

const { SSL_TIGHT_KEY_PATH: keyPath, SSL_TIGHT_CRT_PATH: crtPath, TIGHT_USE_HTTP } = process.env;
const useHTTP = TIGHT_USE_HTTP?.toLowerCase() === 'true';

let key: Buffer | undefined;
let cert: Buffer | undefined;
if (!useHTTP && keyPath && crtPath) {
    key = fs.readFileSync(keyPath);
    cert = fs.readFileSync(crtPath);
}

export { key, cert };
