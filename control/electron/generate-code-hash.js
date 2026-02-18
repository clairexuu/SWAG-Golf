// Generates a hash of all Python app code files.
// The hash file (.code-hash) is bundled with the app and compared at startup
// to detect when code needs to be re-synced to the userData directory.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const CODE_DIRS = ['api', 'generate', 'prompt', 'rag', 'style', 'feedback'];

function collectPyFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPyFiles(full));
    } else if (entry.name.endsWith('.py')) {
      files.push(full);
    }
  }
  return files;
}

const hash = crypto.createHash('sha256');
for (const dir of CODE_DIRS) {
  const files = collectPyFiles(path.join(PROJECT_ROOT, dir));
  files.sort();
  for (const file of files) {
    const rel = path.relative(PROJECT_ROOT, file);
    hash.update(rel);
    hash.update(fs.readFileSync(file));
  }
}

const digest = hash.digest('hex');
fs.writeFileSync(path.join(PROJECT_ROOT, '.code-hash'), digest);
console.log(`Code hash: ${digest.slice(0, 12)}...`);
