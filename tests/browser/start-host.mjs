import { startBackend } from '../../build/backend.js';
const backend = await startBackend({
    host: '127.0.0.1',
    port: Number(process.env.PORT),
    dataDirectory: process.env.TIGHT_DATA_DIR,
    hostToken: process.env.TIGHT_TEST_HOST_TOKEN,
});
process.send?.({ origin: backend.origin });
const stop = () => void backend.stop().then(() => process.exit(0));
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
