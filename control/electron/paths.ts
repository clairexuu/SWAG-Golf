// Path resolution utility for dev vs production Electron builds

import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const isDev = process.env.NODE_ENV === 'development';

// In dev: 3 levels up from electron/dist/ → project root
// In prod: extraResources are at process.resourcesPath/data/
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

/**
 * Resolve path to bundled read-only resource data.
 * Dev: project root. Prod: extraResources/data/.
 */
export function getResourcePath(relativePath: string): string {
  if (isDev) {
    return path.resolve(PROJECT_ROOT, relativePath);
  }
  return path.join(process.resourcesPath, 'data', relativePath);
}

/**
 * Resolve path to user-writable data directory.
 * Dev: project root. Prod: app.getPath('userData')/.
 */
export function getUserDataPath(relativePath: string): string {
  if (isDev) {
    return path.resolve(PROJECT_ROOT, relativePath);
  }
  return path.join(app.getPath('userData'), relativePath);
}

/**
 * Get path to the built frontend index.html.
 */
export function getFrontendPath(): string {
  if (isDev) {
    // In dev, __dirname is control/electron/dist/, frontend is at control/frontend/dist/
    return path.join(__dirname, '../../frontend/dist/index.html');
  }
  // In prod, frontend is in extraResources/frontend/
  return path.join(process.resourcesPath, 'frontend', 'index.html');
}

/**
 * Recursively copy a directory.
 */
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * On first run in production, copy bundled data from extraResources
 * to the writable userData directory so styles/embeddings can be modified.
 */
export function initializeUserData(): void {
  if (isDev) return;

  const userDataDir = app.getPath('userData');
  const marker = path.join(userDataDir, '.initialized');

  console.log(`[Paths] userData directory: ${userDataDir}`);

  if (fs.existsSync(marker)) {
    const storedVersion = fs.readFileSync(marker, 'utf-8').trim();
    const currentVersion = app.getVersion();
    if (storedVersion === currentVersion) {
      console.log('[Paths] Already initialized (same version), updating app config...');
      updateAppConfigFiles(userDataDir);
      return;
    }
    // App version changed — re-initialize everything
    console.log(`[Paths] App updated (${storedVersion} → ${currentVersion}), re-initializing...`);
    fs.unlinkSync(marker);
  }

  console.log('[Paths] First run detected — copying bundled data to userData...');
  const resourceData = path.join(process.resourcesPath, 'data');
  console.log(`[Paths] Resource data source: ${resourceData}`);

  if (!fs.existsSync(resourceData)) {
    console.error(`[Paths] ERROR: Bundled data directory not found at ${resourceData}`);
    return;
  }

  // Ensure userData directory exists
  fs.mkdirSync(userDataDir, { recursive: true });

  // Copy mutable data directories
  const dirsToCopy = ['rag', 'style', 'api', 'generate', 'prompt', 'feedback'];
  for (const dir of dirsToCopy) {
    const src = path.join(resourceData, dir);
    const dest = path.join(userDataDir, dir);
    if (fs.existsSync(src)) {
      try {
        copyDirSync(src, dest);
        console.log(`[Paths]   ✓ Copied ${dir}/`);
      } catch (err) {
        console.error(`[Paths]   ✗ Failed to copy ${dir}/: ${err}`);
      }
    } else {
      console.warn(`[Paths]   ⚠ Source not found, skipping: ${src}`);
    }
  }

  // Copy .env.encrypted file
  const envSrc = path.join(resourceData, '.env.encrypted');
  if (fs.existsSync(envSrc)) {
    try {
      fs.copyFileSync(envSrc, path.join(userDataDir, '.env.encrypted'));
      console.log('[Paths]   ✓ Copied .env.encrypted');
    } catch (err) {
      console.error(`[Paths]   ✗ Failed to copy .env.encrypted: ${err}`);
    }
  }

  // Copy requirements.txt
  const reqSrc = path.join(resourceData, 'requirements.txt');
  if (fs.existsSync(reqSrc)) {
    try {
      fs.copyFileSync(reqSrc, path.join(userDataDir, 'requirements.txt'));
      console.log('[Paths]   ✓ Copied requirements.txt');
    } catch (err) {
      console.error(`[Paths]   ✗ Failed to copy requirements.txt: ${err}`);
    }
  }

  // Create writable output directories
  fs.mkdirSync(path.join(userDataDir, 'generated_outputs'), { recursive: true });
  fs.mkdirSync(path.join(userDataDir, 'feedback', 'logs'), { recursive: true });

  // Verify critical directories exist before marking as initialized
  const criticalDirs = ['style/style_library', 'rag/reference_images', 'api'];
  const missing = criticalDirs.filter(d => !fs.existsSync(path.join(userDataDir, d)));
  if (missing.length > 0) {
    console.error(`[Paths] ERROR: Critical directories missing after copy: ${missing.join(', ')}`);
    console.error('[Paths] NOT marking as initialized — will retry on next launch.');
    return;
  }

  // Mark as initialized with app version
  fs.writeFileSync(marker, app.getVersion());
  console.log('[Paths] Data initialization complete.');
}

/**
 * Always update app-managed config files (requirements.txt, .env).
 * These must stay in sync with the bundled app version.
 */
function updateAppConfigFiles(userDataDir: string): void {
  const resourceData = path.join(process.resourcesPath, 'data');
  if (!fs.existsSync(resourceData)) return;

  const configFiles = ['requirements.txt', '.env.encrypted'];
  for (const file of configFiles) {
    const src = path.join(resourceData, file);
    const dest = path.join(userDataDir, file);
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`[Paths]   ✓ Updated ${file}`);
      } catch (err) {
        console.error(`[Paths]   ✗ Failed to update ${file}: ${err}`);
      }
    }
  }
}
