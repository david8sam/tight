import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/client/utils/urls.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getApiUrl, getWebSocketUrl } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

for (const [origin, api, socket] of [
    ['http://localhost:18740', 'http://localhost:18740/api/game/create', 'ws://localhost:18740/socket'],
    ['https://example.test:8443', 'https://example.test:8443/api/game/create', 'wss://example.test:8443/socket'],
    ['http://192.168.1.42:3012', 'http://192.168.1.42:3012/api/game/create', 'ws://192.168.1.42:3012/socket'],
    ['http://[::1]:3000', 'http://[::1]:3000/api/game/create', 'ws://[::1]:3000/socket'],
]) {
    test(`API and WebSocket share the correct host and port for ${origin}`, () => {
        assert.equal(getApiUrl(origin, '/game/create'), api);
        assert.equal(getWebSocketUrl(origin), socket);
    });
}
