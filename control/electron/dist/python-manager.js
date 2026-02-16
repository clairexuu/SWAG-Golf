"use strict";
// Python process manager — handles dependency install and backend lifecycle.
// Installs packages directly into the standalone Python (no venv needed since
// the standalone build is already isolated to this app).
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptEnvFile = decryptEnvFile;
exports.findOrDownloadPython = findOrDownloadPython;
exports.ensurePythonDeps = ensurePythonDeps;
exports.getRecentPythonOutput = getRecentPythonOutput;
exports.getPythonLogPath = getPythonLogPath;
exports.isPythonProcessAlive = isPythonProcessAlive;
exports.getPythonExitCode = getPythonExitCode;
exports.isPortInUse = isPortInUse;
exports.startPythonBackend = startPythonBackend;
exports.waitForPythonHealth = waitForPythonHealth;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const net_1 = __importDefault(require("net"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const python_downloader_1 = require("./python-downloader");
// Must match the passphrase used in encrypt-env.js
const ENV_PASSPHRASE = 'swag-concept-sketch-agent-2025';
/**
 * Decrypt an .env.encrypted file and return all key-value pairs
 * (both the plaintext config and the decrypted sensitive keys).
 */
function decryptEnvFile(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return {};
    const raw = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
    const result = { ...(raw.config || {}) };
    if (raw.data && raw.iv && raw.authTag) {
        const key = (0, crypto_1.createHash)('sha256').update(ENV_PASSPHRASE).digest();
        const iv = Buffer.from(raw.iv, 'hex');
        const authTag = Buffer.from(raw.authTag, 'hex');
        const encrypted = Buffer.from(raw.data, 'hex');
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        const sensitive = JSON.parse(decrypted.toString('utf-8'));
        Object.assign(result, sensitive);
    }
    return result;
}
/**
 * Ensure standalone Python is available. Downloads it if not present.
 * This app always uses its own managed Python build — never system Python.
 */
async function findOrDownloadPython(dataDir, splashWindow) {
    // Check if our standalone Python is already installed and valid
    if ((0, python_downloader_1.isStandalonePythonInstalled)(dataDir)) {
        const paths = (0, python_downloader_1.getStandalonePythonPaths)(dataDir);
        if (paths) {
            console.log(`[Python] Standalone Python found at ${paths.pythonBin}`);
            return paths.pythonBin;
        }
    }
    // Not installed (or corrupt) — download it
    console.log('[Python] Standalone Python not found. Downloading...');
    const result = await (0, python_downloader_1.downloadStandalonePython)(dataDir, splashWindow);
    return result.pythonBin;
}
/**
 * Ensure all Python dependencies are installed.
 * Installs directly into the standalone Python — no venv needed.
 * Uses a hash of requirements.txt to detect when reinstallation is needed.
 */
async function ensurePythonDeps(config, splashWindow) {
    const depsMarker = path_1.default.join(config.dataDir, '.deps-installed');
    // Check if deps are already installed and up-to-date
    const currentHash = hashFile(config.requirementsPath);
    if (fs_1.default.existsSync(depsMarker)) {
        const storedHash = fs_1.default.readFileSync(depsMarker, 'utf-8').trim();
        if (storedHash === currentHash) {
            console.log('[Python] Dependencies already installed and up to date.');
            return;
        }
        console.log('[Python] Requirements changed, reinstalling dependencies...');
    }
    // Step 1: Ensure pip is available
    sendSplashMessage(splashWindow, 'Setting up pip...');
    await runAsync(config.pythonBin, ['-m', 'ensurepip', '--upgrade'], {}, 'set up pip');
    // Step 2: Install requirements
    sendSplashMessage(splashWindow, 'Installing Python dependencies (this may take several minutes)...');
    await runAsync(config.pythonBin, ['-m', 'pip', 'install', '-r', config.requirementsPath], {}, 'install Python dependencies', splashWindow);
    // Mark deps as installed with requirements hash
    fs_1.default.writeFileSync(depsMarker, currentHash);
    console.log('[Python] Dependencies installed successfully.');
    sendSplashMessage(splashWindow, 'Python setup complete!');
}
/**
 * Run a command asynchronously (non-blocking) and return a promise.
 * This keeps the Electron event loop free so the UI stays responsive.
 */
function runAsync(command, args, opts, label, splashWindow) {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)(command, args, { stdio: ['pipe', 'pipe', 'pipe'], ...opts });
        let stderr = '';
        proc.stdout?.on('data', (data) => {
            const line = data.toString().trim();
            if (line)
                console.log(`[pip] ${line}`);
        });
        proc.stderr?.on('data', (data) => {
            const line = data.toString().trim();
            stderr += data.toString();
            if (line) {
                console.error(`[pip] ${line}`);
                // Show pip progress on splash (e.g. "Downloading torch...")
                if (splashWindow && (line.startsWith('Downloading') || line.startsWith('Installing') || line.startsWith('Collecting'))) {
                    sendSplashMessage(splashWindow, line.slice(0, 80));
                }
            }
        });
        proc.on('error', (err) => {
            reject(new Error(`Failed to ${label}: ${err.message}`));
        });
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Failed to ${label} (exit code ${code}):\n${stderr.slice(-2000)}`));
            }
        });
    });
}
function hashFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf-8');
    return (0, crypto_1.createHash)('sha256').update(content).digest('hex');
}
/**
 * Parse a .env file and return key-value pairs.
 */
function parseEnvFile(envPath) {
    const env = {};
    if (!fs_1.default.existsSync(envPath))
        return env;
    const content = fs_1.default.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1)
            continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        else {
            // Strip inline comments (e.g., "value # comment") for unquoted values
            const hashIdx = value.indexOf(' #');
            if (hashIdx !== -1) {
                value = value.slice(0, hashIdx).trim();
            }
        }
        env[key] = value;
    }
    return env;
}
// ---------------------------------------------------------------------------
// Python process state & logging
// ---------------------------------------------------------------------------
const MAX_RECENT_OUTPUT = 50;
let recentPythonOutput = [];
let pythonExited = false;
let pythonExitCode = null;
let logFilePath = null;
let logStream = null;
/**
 * Get recent Python output (for diagnostics when health check fails).
 */
function getRecentPythonOutput() {
    return recentPythonOutput.slice(-20).join('\n');
}
/**
 * Returns the path to the Python backend log file (if logging is active).
 */
function getPythonLogPath() {
    return logFilePath;
}
/**
 * Returns true if the Python process has exited (crashed or stopped).
 */
function isPythonProcessAlive() {
    return !pythonExited;
}
/**
 * Returns the exit code of the Python process, or null if still running.
 */
function getPythonExitCode() {
    return pythonExitCode;
}
function appendLog(line) {
    recentPythonOutput.push(line);
    if (recentPythonOutput.length > MAX_RECENT_OUTPUT) {
        recentPythonOutput.shift();
    }
    if (logStream) {
        logStream.write(`${new Date().toISOString()} ${line}\n`);
    }
}
// ---------------------------------------------------------------------------
// Port conflict detection
// ---------------------------------------------------------------------------
/**
 * Check if a TCP port is already in use.
 * Returns true if the port is occupied.
 */
function isPortInUse(port) {
    return new Promise((resolve) => {
        const socket = new net_1.default.Socket();
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
}
// ---------------------------------------------------------------------------
// Python backend lifecycle
// ---------------------------------------------------------------------------
/**
 * Start the Python FastAPI backend as a child process.
 * Logs all output to {dataDir}/python-backend.log.
 */
function startPythonBackend(config) {
    // Load env vars: use decryptEnvFile for .env.encrypted, parseEnvFile for plain .env
    const envVars = config.envFilePath.endsWith('.env.encrypted')
        ? decryptEnvFile(config.envFilePath)
        : parseEnvFile(config.envFilePath);
    // Reset state for fresh start
    recentPythonOutput = [];
    pythonExited = false;
    pythonExitCode = null;
    // Set up log file (truncate on each fresh start)
    logFilePath = path_1.default.join(config.dataDir, 'python-backend.log');
    if (logStream) {
        logStream.end();
    }
    logStream = fs_1.default.createWriteStream(logFilePath, { flags: 'w' });
    appendLog(`Starting Python backend at ${new Date().toISOString()}`);
    appendLog(`Python binary: ${config.pythonBin}`);
    appendLog(`Working directory: ${config.dataDir}`);
    appendLog(`Port: ${config.port}`);
    const pythonBinDir = path_1.default.dirname(config.pythonBin);
    console.log(`[Python] Starting: ${config.pythonBin} -m uvicorn api.main:app`);
    console.log(`[Python] cwd: ${config.dataDir}`);
    console.log(`[Python] Log file: ${logFilePath}`);
    const proc = (0, child_process_1.spawn)(config.pythonBin, [
        '-m', 'uvicorn',
        'api.main:app',
        '--host', '127.0.0.1',
        '--port', String(config.port),
    ], {
        cwd: config.dataDir,
        env: {
            ...process.env,
            ...envVars,
            PYTHONIOENCODING: 'utf-8', // Prevent cp1252 encoding crashes on Windows
            PATH: `${pythonBinDir}${path_1.default.delimiter}${process.env.PATH}`,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    proc.stdout?.on('data', (data) => {
        const line = data.toString().trim();
        console.log(`[Python] ${line}`);
        appendLog(`[stdout] ${line}`);
    });
    proc.stderr?.on('data', (data) => {
        const line = data.toString().trim();
        console.error(`[Python] ${line}`);
        appendLog(`[stderr] ${line}`);
    });
    proc.on('error', (err) => {
        console.error('[Python] Failed to start:', err);
        appendLog(`SPAWN ERROR: ${err.message}`);
        pythonExited = true;
        pythonExitCode = -1;
    });
    proc.on('exit', (code) => {
        console.log(`[Python] Process exited with code ${code}`);
        appendLog(`EXITED with code ${code}`);
        pythonExited = true;
        pythonExitCode = code;
    });
    return proc;
}
/**
 * Wait for the Python backend to respond to health checks.
 * Returns early if the process crashes (no point waiting 90s).
 * Updates the splash window with elapsed time.
 */
async function waitForPythonHealth(port = 8000, maxWaitMs = 30_000, splashWindow) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
        // Early exit: process already crashed
        if (pythonExited) {
            return { status: 'crashed', exitCode: pythonExitCode };
        }
        try {
            const res = await fetch(`http://127.0.0.1:${port}/health`);
            if (res.ok)
                return { status: 'healthy' };
        }
        catch {
            // Not ready yet
        }
        // Update splash with elapsed time
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        sendSplashMessage(splashWindow, `Starting Python backend... (${elapsed}s elapsed)`);
        await new Promise((r) => setTimeout(r, 1000));
    }
    return { status: 'timeout' };
}
/**
 * Send a status message to the splash window.
 */
function sendSplashMessage(win, message) {
    if (!win || win.isDestroyed())
        return;
    win.webContents.executeJavaScript(`document.getElementById('status').textContent = ${JSON.stringify(message)};`).catch(() => { });
}
//# sourceMappingURL=python-manager.js.map