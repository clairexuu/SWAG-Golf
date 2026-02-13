"use strict";
// python-downloader.ts — Downloads standalone Python if not available on system
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandalonePythonDir = getStandalonePythonDir;
exports.isStandalonePythonInstalled = isStandalonePythonInstalled;
exports.getStandalonePythonPaths = getStandalonePythonPaths;
exports.downloadStandalonePython = downloadStandalonePython;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tar = __importStar(require("tar"));
const child_process_1 = require("child_process");
// ---------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------
const PYTHON_VERSION = '3.12.12';
const RELEASE_TAG = '20260203';
const VERSION_MARKER = `cpython-${PYTHON_VERSION}+${RELEASE_TAG}`;
const ARCH_MAP = {
    arm64: 'aarch64',
    x64: 'x86_64',
};
const PLATFORM_MAP = {
    darwin: 'apple-darwin',
    win32: 'pc-windows-msvc',
};
function getDownloadUrl() {
    const arch = ARCH_MAP[process.arch];
    if (!arch) {
        throw new Error(`Unsupported architecture: ${process.arch}`);
    }
    const platform = PLATFORM_MAP[process.platform];
    if (!platform) {
        throw new Error(`Unsupported platform: ${process.platform}. Only macOS and Windows are supported.`);
    }
    const filename = `cpython-${PYTHON_VERSION}+${RELEASE_TAG}-${arch}-${platform}-install_only.tar.gz`;
    return `https://github.com/astral-sh/python-build-standalone/releases/download/${RELEASE_TAG}/${filename}`;
}
/**
 * Get the path to the Python binary inside a standalone installation,
 * accounting for platform differences.
 */
function getStandalonePythonBin(baseDir) {
    if (process.platform === 'win32') {
        return path_1.default.join(baseDir, 'python', 'python.exe');
    }
    return path_1.default.join(baseDir, 'python', 'bin', 'python3');
}
/**
 * Get the expected directory where standalone Python is installed.
 */
function getStandalonePythonDir(userDataDir) {
    return path_1.default.join(userDataDir, 'python-standalone');
}
/**
 * Check if a valid standalone Python is already downloaded.
 */
function isStandalonePythonInstalled(userDataDir) {
    const baseDir = getStandalonePythonDir(userDataDir);
    const markerPath = path_1.default.join(baseDir, '.version');
    const pythonBin = getStandalonePythonBin(baseDir);
    if (!fs_1.default.existsSync(pythonBin))
        return false;
    if (!fs_1.default.existsSync(markerPath))
        return false;
    try {
        const installed = fs_1.default.readFileSync(markerPath, 'utf-8').trim();
        return installed === VERSION_MARKER;
    }
    catch {
        return false;
    }
}
/**
 * Get paths to the standalone Python installation.
 * Returns null if not installed.
 */
function getStandalonePythonPaths(userDataDir) {
    const baseDir = getStandalonePythonDir(userDataDir);
    const pythonBin = getStandalonePythonBin(baseDir);
    if (!fs_1.default.existsSync(pythonBin))
        return null;
    return { pythonBin, baseDir };
}
/**
 * Download and install standalone Python.
 * Reports progress to the splash window.
 */
async function downloadStandalonePython(userDataDir, splashWindow) {
    const baseDir = getStandalonePythonDir(userDataDir);
    const url = getDownloadUrl();
    console.log(`[Python-DL] Downloading standalone Python from: ${url}`);
    console.log(`[Python-DL] Target directory: ${baseDir}`);
    // Clean up any partial previous installation
    const pythonDir = path_1.default.join(baseDir, 'python');
    if (fs_1.default.existsSync(pythonDir)) {
        fs_1.default.rmSync(pythonDir, { recursive: true, force: true });
    }
    fs_1.default.mkdirSync(baseDir, { recursive: true });
    // Step 1: Download with progress
    sendSplashMessage(splashWindow, 'Downloading Python runtime...');
    const tarGzPath = path_1.default.join(baseDir, 'python.tar.gz');
    await downloadFileWithProgress(url, tarGzPath, (percent) => {
        sendSplashMessage(splashWindow, `Downloading Python runtime... ${percent}%`);
    });
    console.log(`[Python-DL] Download complete. Extracting...`);
    // Step 2: Extract
    sendSplashMessage(splashWindow, 'Extracting Python runtime...');
    await tar.extract({
        file: tarGzPath,
        cwd: baseDir,
    });
    // Step 3: Clean up tar.gz to save disk space
    fs_1.default.unlinkSync(tarGzPath);
    // Step 4: Verify extraction
    const pythonBin = getStandalonePythonBin(baseDir);
    if (!fs_1.default.existsSync(pythonBin)) {
        const contents = fs_1.default.existsSync(baseDir) ? fs_1.default.readdirSync(baseDir).join(', ') : '(dir missing)';
        throw new Error(`Python extraction failed: expected binary at ${pythonBin} not found. ` +
            `Contents of ${baseDir}: ${contents}`);
    }
    // Step 5: Ensure executable permission (macOS/Linux)
    if (process.platform !== 'win32') {
        fs_1.default.chmodSync(pythonBin, 0o755);
    }
    // Step 5b: Verify the binary is actually runnable
    try {
        (0, child_process_1.execFileSync)(pythonBin, ['--version'], {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 10_000,
        });
    }
    catch (err) {
        throw new Error(`Python binary exists at ${pythonBin} but failed to execute: ${err}`);
    }
    // Step 6: Write version marker
    fs_1.default.writeFileSync(path_1.default.join(baseDir, '.version'), VERSION_MARKER);
    console.log(`[Python-DL] Standalone Python installed successfully at ${pythonBin}`);
    sendSplashMessage(splashWindow, 'Python runtime ready!');
    return { pythonBin, baseDir };
}
// ---------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------
/**
 * Download a file via HTTPS with redirect following and progress callback.
 * GitHub releases redirect (302) to a CDN, so we handle redirects manually.
 */
function downloadFileWithProgress(url, destPath, onProgress, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        const file = fs_1.default.createWriteStream(destPath);
        function doRequest(currentUrl, redirectsLeft) {
            const client = currentUrl.startsWith('https') ? https_1.default : http_1.default;
            client.get(currentUrl, (response) => {
                // Handle redirects
                if (response.statusCode &&
                    [301, 302, 303, 307, 308].includes(response.statusCode) &&
                    response.headers.location) {
                    if (redirectsLeft <= 0) {
                        reject(new Error('Too many redirects while downloading Python'));
                        return;
                    }
                    response.resume();
                    doRequest(response.headers.location, redirectsLeft - 1);
                    return;
                }
                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed with HTTP ${response.statusCode} from ${currentUrl}`));
                    return;
                }
                const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedBytes = 0;
                let lastReportedPercent = -1;
                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (totalBytes > 0) {
                        const percent = Math.floor((downloadedBytes / totalBytes) * 100);
                        if (percent !== lastReportedPercent) {
                            lastReportedPercent = percent;
                            onProgress(percent);
                        }
                    }
                });
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve());
                });
                file.on('error', (err) => {
                    fs_1.default.unlink(destPath, () => { });
                    reject(err);
                });
                response.on('error', (err) => {
                    fs_1.default.unlink(destPath, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                fs_1.default.unlink(destPath, () => { });
                reject(err);
            });
        }
        doRequest(url, maxRedirects);
    });
}
function sendSplashMessage(win, message) {
    if (!win || win.isDestroyed())
        return;
    win.webContents.executeJavaScript(`document.getElementById('status').textContent = ${JSON.stringify(message)};`).catch(() => { });
}
//# sourceMappingURL=python-downloader.js.map