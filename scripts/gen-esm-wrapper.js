'use strict';
// Generates dist/index.mjs after tsc compiles the CJS build.
// The wrapper re-exports the default so that native ESM consumers
// (Node.js without a bundler) get the function, not the module.exports object.
const fs   = require('fs');
const path = require('path');

const content = [
  // In Node.js native ESM, importing a CJS module gives you the entire
  // module.exports as the default — not the .default property on it.
  // So we import the CJS object and explicitly re-export its .default.
  "import cjs from './index.js';",
  'export default cjs.default;',
  '',
].join('\n');

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'index.mjs'), content);
console.log('generated dist/index.mjs');
