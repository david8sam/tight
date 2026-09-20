import fs from 'fs';
import path from 'path';

const { SSL_TIGHT_KEY_PATH: keyPath, SSL_TIGHT_CRT_PATH: crtPath, TIGHT_USE_HTTP } = process.env;
const useHTTP = TIGHT_USE_HTTP?.toLowerCase() === 'true';

let key: Buffer | undefined;
let cert: Buffer | undefined;
if (!useHTTP && keyPath && crtPath) {
    key = fs.readFileSync(new URL(`file://${path.normalize(keyPath)}`));
    cert = fs.readFileSync(new URL(`file://${path.normalize(crtPath)}`));
}

export { key, cert };
