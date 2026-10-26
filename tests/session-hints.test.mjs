import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

function compile(source) {
    return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
}
function moduleUrl(source) {
    return `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`;
}
let source = await readFile(new URL('../src/client/utils/sessionHints.ts', import.meta.url), 'utf8');
for (const name of ['gameCode', 'playerName']) {
    const dependency = await readFile(new URL(`../src/common/${name}.ts`, import.meta.url), 'utf8');
    source = source.replaceAll(`'common/${name}'`, JSON.stringify(moduleUrl(dependency)));
}
const { createSessionHints } = await import(moduleUrl(source));

function backing() {
    const values = new Map();
    return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
}

test('healthy hints observe storage changes and preserve native writes and removals', () => {
    const storage = backing();
    const hints = createSessionHints(() => storage);
    assert.equal(hints.getItem('theme'), null);
    storage.values.set('theme', 'dark');
    assert.equal(hints.getItem('theme'), 'dark');
    hints.setItem('playerId', 'Current player');
    assert.equal(storage.values.get('playerId'), 'Current player');
    hints.removeItem('playerId');
    assert.equal(storage.values.has('playerId'), false);
});

test('a denied storage getter still permits document-local hints without leaking to a new owner', () => {
    const denied = () => { throw new Error('Storage denied'); };
    const hints = createSessionHints(denied);
    assert.equal(hints.getItem('gameId'), null);
    hints.setItem('gameId', 'AAAA');
    assert.equal(hints.getItem('gameId'), 'AAAA');
    hints.removeItem('gameId');
    assert.equal(hints.getItem('gameId'), null);
    hints.setItem('theme', 'dark');
    assert.equal(createSessionHints(denied).getItem('theme'), null);
});

test('a failed write retains the intended value and previously read hints without reverting to stale backing', () => {
    const storage = backing();
    storage.values.set('gameId', 'AAAA');
    storage.values.set('theme', 'dark');
    const hints = createSessionHints(() => storage);
    assert.equal(hints.getItem('gameId'), 'AAAA');
    assert.equal(hints.getItem('theme'), 'dark');
    storage.setItem = () => { throw new Error('Quota exceeded'); };
    hints.setItem('gameId', 'BBBB');
    assert.equal(storage.values.get('gameId'), 'AAAA');
    assert.equal(hints.getItem('gameId'), 'BBBB');
    assert.equal(hints.getItem('theme'), 'dark');
    storage.values.set('gameId', 'CCCC');
    assert.equal(hints.getItem('gameId'), 'BBBB');
});

test('a failed removal cannot resurrect a stale player hint in the current document', () => {
    const storage = backing();
    storage.values.set('playerId', 'Earlier player');
    const hints = createSessionHints(() => storage);
    assert.equal(hints.getItem('playerId'), 'Earlier player');
    storage.removeItem = () => { throw new Error('Removal denied'); };
    hints.removeItem('playerId');
    assert.equal(storage.values.get('playerId'), 'Earlier player');
    assert.equal(hints.getItem('playerId'), null);
});

test('stored game hints use the shared game-code contract', () => {
    const storage = backing();
    const hints = createSessionHints(() => storage);
    for (const value of ['../not-a-game', 'abcd', 'ABCDE', '']) {
        storage.values.set('gameId', value);
        assert.equal(hints.getItem('gameId'), null);
    }
    storage.values.set('gameId', 'ABCD');
    assert.equal(hints.getItem('gameId'), 'ABCD');
});

test('stored player hints reject reserved, blank, and oversized names while retaining valid names', () => {
    const storage = backing();
    const hints = createSessionHints(() => storage);
    for (const value of ['constructor', '__proto__', 'prototype', '   ', 'X'.repeat(81), '']) {
        storage.values.set('playerId', value);
        assert.equal(hints.getItem('playerId'), null);
    }
    for (const value of ['Saved host', 'X'.repeat(80), ' Name with spaces ']) {
        storage.values.set('playerId', value);
        assert.equal(hints.getItem('playerId'), value);
    }
});

test('stored theme hints accept only the supported choices and cannot revive an invalid cached value', () => {
    const storage = backing();
    const hints = createSessionHints(() => storage);
    for (const value of ['light', 'dark']) {
        storage.values.set('theme', value);
        assert.equal(hints.getItem('theme'), value);
    }
    storage.values.set('theme', 'system');
    assert.equal(hints.getItem('theme'), null);
    storage.getItem = () => { throw new Error('Reads denied'); };
    assert.equal(hints.getItem('theme'), null);
});
