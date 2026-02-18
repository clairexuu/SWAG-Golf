"use strict";
// Path resolution utility for dev vs production Electron builds
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourcePath = getResourcePath;
exports.getUserDataPath = getUserDataPath;
exports.getFrontendPath = getFrontendPath;
exports.initializeUserData = initializeUserData;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const electron_1 = require("electron");
const isDev = process.env.NODE_ENV === 'development';
// In dev: 3 levels up from electron/dist/ → project root
// In prod: extraResources are at process.resourcesPath/data/
const PROJECT_ROOT = path_1.default.resolve(__dirname, '../../..');
/**
 * Resolve path to bundled read-only resource data.
 * Dev: project root. Prod: extraResources/data/.
 */
function getResourcePath(relativePath) {
    if (isDev) {
        return path_1.default.resolve(PROJECT_ROOT, relativePath);
    }
    return path_1.default.join(process.resourcesPath, 'data', relativePath);
}
/**
 * Resolve path to user-writable data directory.
 * Dev: project root. Prod: app.getPath('userData')/.
 */
function getUserDataPath(relativePath) {
    if (isDev) {
        return path_1.default.resolve(PROJECT_ROOT, relativePath);
    }
    return path_1.default.join(electron_1.app.getPath('userData'), relativePath);
}
/**
 * Get path to the built frontend index.html.
 */
function getFrontendPath() {
    if (isDev) {
        // In dev, __dirname is control/electron/dist/, frontend is at control/frontend/dist/
        return path_1.default.join(__dirname, '../../frontend/dist/index.html');
    }
    // In prod, frontend is in extraResources/frontend/
    return path_1.default.join(process.resourcesPath, 'frontend', 'index.html');
}
/**
 * Recursively copy a directory.
 */
function copyDirSync(src, dest) {
    fs_1.default.mkdirSync(dest, { recursive: true });
    const entries = fs_1.default.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        }
        else {
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * Copy .py files from src to dest, skipping user-data subdirectories.
 * Used for mixed directories that contain both app code and user data.
 */
function copyPyFilesOnly(src, dest, skipSubdirs) {
    fs_1.default.mkdirSync(dest, { recursive: true });
    const entries = fs_1.default.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (entry.isDirectory()) {
            if (skipSubdirs.includes(entry.name))
                continue;
            copyPyFilesOnly(srcPath, destPath, []);
        }
        else if (entry.name.endsWith('.py')) {
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * Sync bundled data to userData on launch.
 *
 * - App code (api/, generate/, prompt/, *.py in mixed dirs) is synced when the
 *   build-time code hash changes (or on first run). This catches code updates
 *   even without a version bump, while skipping unnecessary I/O when unchanged.
 * - Config files (.env.encrypted, requirements.txt, etc.) are ALWAYS synced.
 * - User data (style_library, reference_images, cache, generated_outputs,
 *   feedback/logs) is seeded on FIRST RUN only — never overwritten.
 */
function initializeUserData() {
    if (isDev)
        return;
    const userDataDir = electron_1.app.getPath('userData');
    const marker = path_1.default.join(userDataDir, '.initialized');
    const resourceData = path_1.default.join(process.resourcesPath, 'data');
    const currentVersion = electron_1.app.getVersion();
    console.log(`[Paths] userData directory: ${userDataDir}`);
    if (!fs_1.default.existsSync(resourceData)) {
        console.error(`[Paths] ERROR: Bundled data directory not found at ${resourceData}`);
        return;
    }
    fs_1.default.mkdirSync(userDataDir, { recursive: true });
    const isFirstRun = !fs_1.default.existsSync(marker);
    // Detect code changes via build-time hash (catches updates without version bump)
    const bundledHashFile = path_1.default.join(resourceData, '.code-hash');
    const storedHashFile = path_1.default.join(userDataDir, '.code-hash');
    const bundledHash = fs_1.default.existsSync(bundledHashFile)
        ? fs_1.default.readFileSync(bundledHashFile, 'utf-8').trim()
        : '';
    const storedHash = fs_1.default.existsSync(storedHashFile)
        ? fs_1.default.readFileSync(storedHashFile, 'utf-8').trim()
        : '';
    const codeChanged = !bundledHash || bundledHash !== storedHash;
    if (isFirstRun) {
        console.log('[Paths] First run detected — full initialization...');
    }
    else if (codeChanged) {
        console.log('[Paths] Code change detected — syncing app code...');
    }
    else {
        console.log('[Paths] App code unchanged, updating config only...');
    }
    // ── Sync app code when changed (or first run) ──
    if (isFirstRun || codeChanged) {
        const appCodeDirs = ['api', 'generate', 'prompt'];
        for (const dir of appCodeDirs) {
            const src = path_1.default.join(resourceData, dir);
            const dest = path_1.default.join(userDataDir, dir);
            if (fs_1.default.existsSync(src)) {
                try {
                    copyDirSync(src, dest);
                    console.log(`[Paths]   (app-code) Synced ${dir}/`);
                }
                catch (err) {
                    console.error(`[Paths]   ✗ Failed to sync ${dir}/: ${err}`);
                }
            }
        }
        // Mixed directories: sync .py files only, preserve user data subdirs
        const mixedDirs = [
            { name: 'rag', userSubdirs: ['reference_images', 'cache'] },
            { name: 'style', userSubdirs: ['style_library'] },
            { name: 'feedback', userSubdirs: ['logs'] },
        ];
        for (const { name, userSubdirs } of mixedDirs) {
            const src = path_1.default.join(resourceData, name);
            const dest = path_1.default.join(userDataDir, name);
            if (fs_1.default.existsSync(src)) {
                try {
                    copyPyFilesOnly(src, dest, userSubdirs);
                    console.log(`[Paths]   (app-code) Synced ${name}/*.py (preserved: ${userSubdirs.join(', ')})`);
                }
                catch (err) {
                    console.error(`[Paths]   ✗ Failed to sync ${name}/*.py: ${err}`);
                }
            }
        }
        // Update stored hash
        if (bundledHash) {
            fs_1.default.writeFileSync(storedHashFile, bundledHash);
        }
    }
    // ── ALWAYS: update app config files ──
    updateAppConfigFiles(userDataDir);
    // ── FIRST RUN ONLY: seed user data directories from bundled defaults ──
    if (isFirstRun) {
        const userDataSeeds = [
            { src: 'style/style_library', dest: 'style/style_library' },
            { src: 'rag/reference_images', dest: 'rag/reference_images' },
            { src: 'rag/cache', dest: 'rag/cache' },
        ];
        for (const seed of userDataSeeds) {
            const srcPath = path_1.default.join(resourceData, seed.src);
            const destPath = path_1.default.join(userDataDir, seed.dest);
            if (fs_1.default.existsSync(srcPath) && !fs_1.default.existsSync(destPath)) {
                try {
                    copyDirSync(srcPath, destPath);
                    console.log(`[Paths]   (user-data) Seeded ${seed.dest}/`);
                }
                catch (err) {
                    console.error(`[Paths]   ✗ Failed to seed ${seed.dest}/: ${err}`);
                }
            }
            else if (fs_1.default.existsSync(destPath)) {
                console.log(`[Paths]   (user-data) ${seed.dest}/ already exists, skipping`);
            }
        }
        // Create writable output directories
        fs_1.default.mkdirSync(path_1.default.join(userDataDir, 'generated_outputs'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(userDataDir, 'feedback', 'logs'), { recursive: true });
        console.log('[Paths]   (user-data) Created output directories');
    }
    // Verify critical directories exist before marking as initialized
    const criticalDirs = ['api', 'generate', 'prompt'];
    const missing = criticalDirs.filter(d => !fs_1.default.existsSync(path_1.default.join(userDataDir, d)));
    if (missing.length > 0) {
        console.error(`[Paths] ERROR: Critical directories missing: ${missing.join(', ')}`);
        console.error('[Paths] NOT marking as initialized — will retry on next launch.');
        return;
    }
    // Mark as initialized with app version
    if (isFirstRun) {
        fs_1.default.writeFileSync(marker, currentVersion);
    }
    console.log('[Paths] Data initialization complete.');
}
/**
 * Always update app-managed config files.
 * These must stay in sync with the bundled app version.
 */
function updateAppConfigFiles(userDataDir) {
    const resourceData = path_1.default.join(process.resourcesPath, 'data');
    if (!fs_1.default.existsSync(resourceData))
        return;
    const configFiles = ['requirements.txt', '.env.encrypted', 'style/visual_rule_template.json'];
    for (const file of configFiles) {
        const src = path_1.default.join(resourceData, file);
        const dest = path_1.default.join(userDataDir, file);
        if (fs_1.default.existsSync(src)) {
            try {
                fs_1.default.mkdirSync(path_1.default.dirname(dest), { recursive: true });
                fs_1.default.copyFileSync(src, dest);
                console.log(`[Paths]   (config) Updated ${file}`);
            }
            catch (err) {
                console.error(`[Paths]   ✗ Failed to update ${file}: ${err}`);
            }
        }
    }
}
//# sourceMappingURL=paths.js.map