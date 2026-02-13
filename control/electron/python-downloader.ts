// python-downloader.ts — Downloads standalone Python if not available on system

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { execFileSync } from 'child_process';
import { BrowserWindow } from 'electron';

// ---------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------

const PYTHON_VERSION = '3.12.12';
const RELEASE_TAG = '20260203';
const VERSION_MARKER = `cpython-${PYTHON_VERSION}+${RELEASE_TAG}`;

const ARCH_MAP: Record<string, string> = {
  arm64: 'aarch64',
  x64: 'x86_64',
};

const PLATFORM_MAP: Record<string, string> = {
  darwin: 'apple-darwin',
  win32: 'pc-windows-msvc',
};

function getDownloadUrl(): string {
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

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------

export interface StandalonePythonPaths {
  pythonBin: string;
  baseDir: string;
}

/**
 * Get the path to the Python binary inside a standalone installation,
 * accounting for platform differences.
 */
function getStandalonePythonBin(baseDir: string): string {
  if (process.platform === 'win32') {
    return path.join(baseDir, 'python', 'python.exe');
  }
  return path.join(baseDir, 'python', 'bin', 'python3');
}

/**
 * Get the expected directory where standalone Python is installed.
 */
export function getStandalonePythonDir(userDataDir: string): string {
  return path.join(userDataDir, 'python-standalone');
}

/**
 * Check if a valid standalone Python is already downloaded.
 */
export function isStandalonePythonInstalled(userDataDir: string): boolean {
  const baseDir = getStandalonePythonDir(userDataDir);
  const markerPath = path.join(baseDir, '.version');
  const pythonBin = getStandalonePythonBin(baseDir);

  if (!fs.existsSync(pythonBin)) return false;
  if (!fs.existsSync(markerPath)) return false;

  try {
    const installed = fs.readFileSync(markerPath, 'utf-8').trim();
    return installed === VERSION_MARKER;
  } catch {
    return false;
  }
}

/**
 * Get paths to the standalone Python installation.
 * Returns null if not installed.
 */
export function getStandalonePythonPaths(userDataDir: string): StandalonePythonPaths | null {
  const baseDir = getStandalonePythonDir(userDataDir);
  const pythonBin = getStandalonePythonBin(baseDir);

  if (!fs.existsSync(pythonBin)) return null;

  return { pythonBin, baseDir };
}

/**
 * Download and install standalone Python.
 * Reports progress to the splash window.
 */
export async function downloadStandalonePython(
  userDataDir: string,
  splashWindow?: BrowserWindow | null,
): Promise<StandalonePythonPaths> {
  const baseDir = getStandalonePythonDir(userDataDir);
  const url = getDownloadUrl();

  console.log(`[Python-DL] Downloading standalone Python from: ${url}`);
  console.log(`[Python-DL] Target directory: ${baseDir}`);

  // Clean up any partial previous installation
  const pythonDir = path.join(baseDir, 'python');
  if (fs.existsSync(pythonDir)) {
    fs.rmSync(pythonDir, { recursive: true, force: true });
  }
  fs.mkdirSync(baseDir, { recursive: true });

  // Step 1: Download with progress
  sendSplashMessage(splashWindow, 'Downloading Python runtime...');
  const tarGzPath = path.join(baseDir, 'python.tar.gz');

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
  fs.unlinkSync(tarGzPath);

  // Step 4: Verify extraction
  const pythonBin = getStandalonePythonBin(baseDir);
  if (!fs.existsSync(pythonBin)) {
    const contents = fs.existsSync(baseDir) ? fs.readdirSync(baseDir).join(', ') : '(dir missing)';
    throw new Error(
      `Python extraction failed: expected binary at ${pythonBin} not found. ` +
      `Contents of ${baseDir}: ${contents}`
    );
  }

  // Step 5: Ensure executable permission (macOS/Linux)
  if (process.platform !== 'win32') {
    fs.chmodSync(pythonBin, 0o755);
  }

  // Step 5b: Verify the binary is actually runnable
  try {
    execFileSync(pythonBin, ['--version'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10_000,
    });
  } catch (err) {
    throw new Error(
      `Python binary exists at ${pythonBin} but failed to execute: ${err}`
    );
  }

  // Step 6: Write version marker
  fs.writeFileSync(path.join(baseDir, '.version'), VERSION_MARKER);

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
function downloadFileWithProgress(
  url: string,
  destPath: string,
  onProgress: (percent: number) => void,
  maxRedirects: number = 5,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    function doRequest(currentUrl: string, redirectsLeft: number): void {
      const client = currentUrl.startsWith('https') ? https : http;

      client.get(currentUrl, (response) => {
        // Handle redirects
        if (
          response.statusCode &&
          [301, 302, 303, 307, 308].includes(response.statusCode) &&
          response.headers.location
        ) {
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

        response.on('data', (chunk: Buffer) => {
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
          fs.unlink(destPath, () => {});
          reject(err);
        });

        response.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    doRequest(url, maxRedirects);
  });
}

function sendSplashMessage(win: BrowserWindow | null | undefined, message: string): void {
  if (!win || win.isDestroyed()) return;
  win.webContents.executeJavaScript(
    `document.getElementById('status').textContent = ${JSON.stringify(message)};`
  ).catch(() => {});
}
