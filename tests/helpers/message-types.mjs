import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../../src/common/message.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
export const { MessageType } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
