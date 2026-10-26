import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('./helpers/bounded-diagnostic.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { captureDiagnostic } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('a hung renderer diagnostic cannot discard a completed native window result', async () => {
    const renderer = captureDiagnostic(new Promise(() => {}));
    const windowState = [{ visible: false, loading: true }];
    const windows = captureDiagnostic(Promise.resolve(windowState));
    const result = Promise.all([renderer, windows]);
    await windows;
    assert.deepEqual(await result, [
        { status: 'timed-out' },
        { status: 'fulfilled', value: windowState },
    ]);
});

test('rejected diagnostics retain the failure without hiding successful reads', async () => {
    const result = await Promise.all([
        captureDiagnostic(Promise.reject(new Error('Renderer closed'))),
        captureDiagnostic(Promise.resolve('Native process answered')),
    ]);
    assert.deepEqual(result, [
        { status: 'rejected', message: 'Renderer closed' },
        { status: 'fulfilled', value: 'Native process answered' },
    ]);
});
