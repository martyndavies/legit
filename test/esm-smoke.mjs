// Smoke test: verifies the ESM entry point exports the function correctly.
// Run with: node test/esm-smoke.mjs  (requires a prior `npm run build`)
import assert from 'node:assert/strict';
import legit from '../dist/index.mjs';

assert.strictEqual(typeof legit, 'function',
  `Expected legit to be a function but got ${typeof legit}. ` +
  'This means the ESM entry point is broken — consumers would see ' +
  '"legit is not a function" when using native ESM imports.'
);

console.log('ESM smoke test passed ✓  (typeof legit === "function")');
