// Python process manager — handles dependency install and backend lifecycle.
// Installs packages directly into the standalone Python (no venv needed since
// the standalone build is already isolated to this app).

import { spawn, ChildProcess, SpawnOptions } from 'child_process';
import { createHash, createDecipheriv } from 'crypto';
import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import { isStandalonePythonInstalled, getStandalonePythonPaths, downloadStandalonePython } from './python-downloader';

// Must match the passphrase used in encrypt-env.js
const ENV_PASSPHRASE = 'swag-concept-sketch-agent-2025';

/**
 * Decrypt an .env.encrypted file and return all key-value pairs
 * (both the plaintext config and the decrypted sensitive keys).
 */
export function decryptEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const result: Record<string, string> = { ...(raw.config || {}) };

  if (raw.data && raw.iv && raw.authTag) {
    const key = createHash('sha256').update(ENV_PASSPHRASE).digest();
    const iv = Buffer.from(raw.iv, 'hex');
    const authTag = Buffer.from(raw.authTag, 'hex');
    const encrypted = Buffer.from(raw.data, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const sensitive = JSON.parse(decrypted.toString('utf-8'));
    Object.assign(result, sensitive);
  }

  return result;
}

export interface PythonConfig {
  pythonBin: string;        // Standalone Python binary
  dataDir: string;          // Working directory for Python (where api/, generate/, etc. live)
  envFilePath: string;      // Path to .env file
  requirementsPath: string;
  port: number;
}


/**
 * Ensure standalone Python is available. Downloads it if not present.
 * This app always uses its own managed Python build — never system Python.
 */
export async function findOrDownloadPython(
  dataDir: string,
  splashWindow?: BrowserWindow | null,
): Promise<string> {
  // Check if our standalone Python is already installed and valid
  if (isStandalonePythonInstalled(dataDir)) {
    const paths = getStandalonePythonPaths(dataDir);
    if (paths) {
      console.log(`[Python] Standalone Python found at ${paths.pythonBin}`);
      return paths.pythonBin;
    }
  }

  // Not installed (or corrupt) — download it
  console.log('[Python] Standalone Python not found. Downloading...');
  const result = await downloadStandalonePython(dataDir, splashWindow);
  return result.pythonBin;
}

/**
 * Ensure all Python dependencies are installed.
 * Installs directly into the standalone Python — no venv needed.
 * Uses a hash of requirements.txt to detect when reinstallation is needed.
 */
export async function ensurePythonDeps(
  config: PythonConfig,
  splashWindow?: BrowserWindow | null,
): Promise<void> {
  const depsMarker = path.join(config.dataDir, '.deps-installed');

  // Check if deps are already installed and up-to-date
  const currentHash = hashFile(config.requirementsPath);
  if (fs.existsSync(depsMarker)) {
    const storedHash = fs.readFileSync(depsMarker, 'utf-8').trim();
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
  await runAsync(
    config.pythonBin,
    ['-m', 'pip', 'install', '-r', config.requirementsPath],
    {},
    'install Python dependencies',
    splashWindow,
  );

  // Mark deps as installed with requirements hash
  fs.writeFileSync(depsMarker, currentHash);
  console.log('[Python] Dependencies installed successfully.');
  sendSplashMessage(splashWindow, 'Python setup complete!');
}

/**
 * Run a command asynchronously (non-blocking) and return a promise.
 * This keeps the Electron event loop free so the UI stays responsive.
 */
function runAsync(
  command: string,
  args: string[],
  opts: SpawnOptions,
  label: string,
  splashWindow?: BrowserWindow | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], ...opts });
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (line) console.log(`[pip] ${line}`);
    });

    proc.stderr?.on('data', (data: Buffer) => {
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
      } else {
        reject(new Error(`Failed to ${label} (exit code ${code}):\n${stderr.slice(-2000)}`));
      }
    });
  });
}

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Parse a .env file and return key-value pairs.
 */
function parseEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
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

// Collects recent Python stderr output for error reporting
let recentPythonOutput: string[] = [];

/**
 * Get recent Python output (for diagnostics when health check fails).
 */
export function getRecentPythonOutput(): string {
  return recentPythonOutput.slice(-20).join('\n');
}

/**
 * Start the Python FastAPI backend as a child process.
 */
export function startPythonBackend(config: PythonConfig): ChildProcess {
  // Load env vars: use decryptEnvFile for .env.encrypted, parseEnvFile for plain .env
  const envVars = config.envFilePath.endsWith('.env.encrypted')
    ? decryptEnvFile(config.envFilePath)
    : parseEnvFile(config.envFilePath);
  recentPythonOutput = [];

  const pythonBinDir = path.dirname(config.pythonBin);

  console.log(`[Python] Starting: ${config.pythonBin} -m uvicorn api.main:app`);
  console.log(`[Python] cwd: ${config.dataDir}`);

  const proc = spawn(config.pythonBin, [
    '-m', 'uvicorn',
    'api.main:app',
    '--host', '127.0.0.1',
    '--port', String(config.port),
  ], {
    cwd: config.dataDir,
    env: {
      ...process.env,
      ...envVars,
      PYTHONIOENCODING: 'utf-8',  // Prevent cp1252 encoding crashes on Windows
      PATH: `${pythonBinDir}${path.delimiter}${process.env.PATH}`,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  proc.stdout?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    console.log(`[Python] ${line}`);
    recentPythonOutput.push(line);
  });

  proc.stderr?.on('data', (data: Buffer) => {
    const line = data.toString().trim();
    console.error(`[Python] ${line}`);
    recentPythonOutput.push(line);
  });

  proc.on('error', (err) => {
    console.error('[Python] Failed to start:', err);
    recentPythonOutput.push(`SPAWN ERROR: ${err.message}`);
  });

  proc.on('exit', (code) => {
    console.log(`[Python] Process exited with code ${code}`);
    recentPythonOutput.push(`EXITED with code ${code}`);
  });

  return proc;
}

/**
 * Wait for the Python backend to respond to health checks.
 */
export async function waitForPythonHealth(
  port: number = 8000,
  maxWaitMs: number = 30_000,
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return true;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/**
 * Send a status message to the splash window.
 */
function sendSplashMessage(win: BrowserWindow | null | undefined, message: string): void {
  if (!win || win.isDestroyed()) return;
  win.webContents.executeJavaScript(
    `document.getElementById('status').textContent = ${JSON.stringify(message)};`
  ).catch(() => { /* splash may be closed */ });
}
