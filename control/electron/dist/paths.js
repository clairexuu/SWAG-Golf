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
 * On first run in production, copy bundled data from extraResources
 * to the writable userData directory so styles/embeddings can be modified.
 */
function initializeUserData() {
    if (isDev)
        return;
    const userDataDir = electron_1.app.getPath('userData');
    const marker = path_1.default.join(userDataDir, '.initialized');
    console.log(`[Paths] userData directory: ${userDataDir}`);
    if (fs_1.default.existsSync(marker)) {
        const storedVersion = fs_1.default.readFileSync(marker, 'utf-8').trim();
        const currentVersion = electron_1.app.getVersion();
        if (storedVersion === currentVersion) {
            console.log('[Paths] Already initialized (same version), updating app config...');
            updateAppConfigFiles(userDataDir);
            return;
        }
        // App version changed — re-initialize everything
        console.log(`[Paths] App updated (${storedVersion} → ${currentVersion}), re-initializing...`);
        fs_1.default.unlinkSync(marker);
    }
    console.log('[Paths] First run detected — copying bundled data to userData...');
    const resourceData = path_1.default.join(process.resourcesPath, 'data');
    console.log(`[Paths] Resource data source: ${resourceData}`);
    if (!fs_1.default.existsSync(resourceData)) {
        console.error(`[Paths] ERROR: Bundled data directory not found at ${resourceData}`);
        return;
    }
    // Ensure userData directory exists
    fs_1.default.mkdirSync(userDataDir, { recursive: true });
    // Copy mutable data directories
    const dirsToCopy = ['rag', 'style', 'api', 'generate', 'prompt', 'feedback'];
    for (const dir of dirsToCopy) {
        const src = path_1.default.join(resourceData, dir);
        const dest = path_1.default.join(userDataDir, dir);
        if (fs_1.default.existsSync(src)) {
            try {
                copyDirSync(src, dest);
                console.log(`[Paths]   ✓ Copied ${dir}/`);
            }
            catch (err) {
                console.error(`[Paths]   ✗ Failed to copy ${dir}/: ${err}`);
            }
        }
        else {
            console.warn(`[Paths]   ⚠ Source not found, skipping: ${src}`);
        }
    }
    // Copy .env file
    const envSrc = path_1.default.join(resourceData, '.env');
    if (fs_1.default.existsSync(envSrc)) {
        try {
            fs_1.default.copyFileSync(envSrc, path_1.default.join(userDataDir, '.env'));
            console.log('[Paths]   ✓ Copied .env');
        }
        catch (err) {
            console.error(`[Paths]   ✗ Failed to copy .env: ${err}`);
        }
    }
    // Copy requirements.txt
    const reqSrc = path_1.default.join(resourceData, 'requirements.txt');
    if (fs_1.default.existsSync(reqSrc)) {
        try {
            fs_1.default.copyFileSync(reqSrc, path_1.default.join(userDataDir, 'requirements.txt'));
            console.log('[Paths]   ✓ Copied requirements.txt');
        }
        catch (err) {
            console.error(`[Paths]   ✗ Failed to copy requirements.txt: ${err}`);
        }
    }
    // Create writable output directories
    fs_1.default.mkdirSync(path_1.default.join(userDataDir, 'generated_outputs'), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(userDataDir, 'feedback', 'logs'), { recursive: true });
    // Verify critical directories exist before marking as initialized
    const criticalDirs = ['style/style_library', 'rag/reference_images', 'api'];
    const missing = criticalDirs.filter(d => !fs_1.default.existsSync(path_1.default.join(userDataDir, d)));
    if (missing.length > 0) {
        console.error(`[Paths] ERROR: Critical directories missing after copy: ${missing.join(', ')}`);
        console.error('[Paths] NOT marking as initialized — will retry on next launch.');
        return;
    }
    // Mark as initialized with app version
    fs_1.default.writeFileSync(marker, electron_1.app.getVersion());
    console.log('[Paths] Data initialization complete.');
}
/**
 * Always update app-managed config files (requirements.txt, .env).
 * These must stay in sync with the bundled app version.
 */
function updateAppConfigFiles(userDataDir) {
    const resourceData = path_1.default.join(process.resourcesPath, 'data');
    if (!fs_1.default.existsSync(resourceData))
        return;
    const configFiles = ['requirements.txt', '.env'];
    for (const file of configFiles) {
        const src = path_1.default.join(resourceData, file);
        const dest = path_1.default.join(userDataDir, file);
        if (fs_1.default.existsSync(src)) {
            try {
                fs_1.default.copyFileSync(src, dest);
                console.log(`[Paths]   ✓ Updated ${file}`);
            }
            catch (err) {
                console.error(`[Paths]   ✗ Failed to update ${file}: ${err}`);
            }
        }
    }
}
//# sourceMappingURL=paths.js.map