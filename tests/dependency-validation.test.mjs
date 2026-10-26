import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';

// GHSA-mrhx-c7xc-m3w5: collection limits must run before parsing their members.
// A sparse input and a throwing getter prove early rejection without an OOM test.
test('oversized constrained arrays are rejected before any element is read', () => {
    const input = new Array(1_000_000);
    Object.defineProperty(input, 0, {
        get() { throw new Error('Oversized collection was traversed'); },
    });
    for (const schema of [z.array(z.string()).max(32), z.array(z.string()).length(3)]) {
        const result = schema.safeParse(input);
        assert.equal(result.success, false);
        assert.deepEqual(result.error.issues.map(issue => issue.code), ['too_big']);
    }
});
