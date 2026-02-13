// esbuild script — bundles the Express API (ESM) into a single CJS file for Electron

const esbuild = require('esbuild');
const path = require('path');

esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../api/src/server.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.resolve(__dirname, 'dist/api-server.js'),
  // Keep these as external node_modules (installed in electron/package.json)
  external: ['express', 'cors'],
  // Handle import.meta.url used in the ESM source
  define: {
    'import.meta.url': 'importMetaUrl',
  },
  banner: {
    js: 'const importMetaUrl = require("url").pathToFileURL(__filename).href;',
  },
  sourcemap: true,
  logLevel: 'info',
});

console.log('Express API bundled to dist/api-server.js');
