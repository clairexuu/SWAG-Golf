// Electron main process — orchestrates all services

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { ChildProcess, execSync } from 'child_process';
import { getResourcePath, getUserDataPath, getFrontendPath, initializeUserData } from './paths';
import { initAutoUpdater } from './auto-updater';
import {
  findOrDownloadPython, ensurePythonDeps, startPythonBackend,
  waitForPythonHealth, getRecentPythonOutput, getPythonLogPath,
  isPortInUse, isPythonProcessAlive, getPythonExitCode,
  PythonConfig, HealthCheckResult,
} from './python-manager';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let apiServer: import('http').Server | null = null;
let pythonProcess: ChildProcess | null = null;
let pythonConfig: PythonConfig | null = null;

// ---------------------------------------------------------------------------
// Splash screen (shown during startup / first-run setup)
// ---------------------------------------------------------------------------

function createSplashWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>
      body {
        margin: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; height: 100vh;
        background: #1a1a2e; color: #39FF14; font-family: -apple-system, sans-serif;
      }
      h1 { font-size: 24px; margin-bottom: 12px; }
      #status { font-size: 14px; color: #aaa; text-align: center; padding: 0 24px; }
      .spinner {
        width: 36px; height: 36px; border: 3px solid #333;
        border-top-color: #39FF14; border-radius: 50%;
        animation: spin 0.8s linear infinite; margin-bottom: 20px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style></head>
    <body>
      <div class="spinner"></div>
      <h1>SWAG Concept Sketch Agent</h1>
      <p id="status">Starting up...</p>
    </body>
    </html>
  `;

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return win;
}

function updateSplash(message: string): void {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  splashWindow.webContents.executeJavaScript(
    `document.getElementById('status').textContent = ${JSON.stringify(message)};`
  ).catch(() => {});
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#fafafa',
    titleBarStyle: 'default',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Frontend is served by Express on port 3001
    mainWindow.loadURL('http://localhost:3001');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
}

// ---------------------------------------------------------------------------
// Startup sequence
// ---------------------------------------------------------------------------

const MAX_PYTHON_RETRIES = 2;

/**
 * Kill lingering Python process (if any) before a retry.
 */
function killPythonProcess(): void {
  if (pythonProcess && pythonProcess.pid) {
    console.log('[Startup] Killing previous Python process before retry...');
    if (process.platform === 'win32') {
      try { execSync(`taskkill /F /T /PID ${pythonProcess.pid}`, { stdio: 'ignore' }); } catch { /* already dead */ }
    } else {
      pythonProcess.kill('SIGTERM');
    }
    pythonProcess = null;
  }
}

/**
 * Attempt to start the Python backend and wait for it to become healthy.
 * Returns the health check result.
 */
async function attemptPythonStart(pythonConfig: PythonConfig): Promise<HealthCheckResult> {
  // Check for port conflict before spawning
  const portBusy = await isPortInUse(pythonConfig.port);
  if (portBusy) {
    // Port is taken — check if it's already a healthy Python backend
    // (e.g. started by start-dev.sh or a previous run)
    try {
      const res = await fetch(`http://127.0.0.1:${pythonConfig.port}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        console.log(`[Startup] Existing healthy Python backend found on port ${pythonConfig.port}, reusing it.`);
        return { status: 'healthy' };
      }
    } catch {
      // Not a healthy backend
    }
    console.warn(`[Startup] Port ${pythonConfig.port} is already in use by a non-Python process.`);
    return { status: 'crashed', exitCode: null };
  }

  updateSplash('Starting Python backend...');
  pythonProcess = startPythonBackend(pythonConfig);
  return await waitForPythonHealth(pythonConfig.port, 90_000, splashWindow);
}

/**
 * Build a user-friendly error message based on the failure type.
 */
function buildErrorMessage(result: HealthCheckResult, portBusy: boolean): string {
  const logPath = getPythonLogPath();
  const pythonOutput = getRecentPythonOutput();
  const logHint = logPath ? `\n\nLog file: ${logPath}` : '';
  const outputSection = pythonOutput ? `\n\nRecent output:\n${pythonOutput}` : '\n\n(no output captured)';

  if (portBusy) {
    return `Port 8000 is already in use by another application.\n\n` +
      `Please close the other application using port 8000 and try again, ` +
      `or restart your computer.${logHint}`;
  }

  if (result.status === 'crashed') {
    const code = result.exitCode != null ? ` (exit code ${result.exitCode})` : '';
    return `The Python backend crashed during startup${code}.\n` +
      `This usually means a missing dependency or import error.${logHint}${outputSection}`;
  }

  // timeout
  return `The Python backend did not respond within 90 seconds.\n` +
    `It may still be loading or is hung.${logHint}${outputSection}`;
}

async function startup(): Promise<void> {
  console.log('Electron app ready');

  // Show splash
  splashWindow = createSplashWindow();

  try {
    // Step 1: Initialize user data (first-run copy)
    updateSplash('Initializing application data...');
    initializeUserData();

    // Step 2: Determine paths
    const dataDir = isDev
      ? path.resolve(__dirname, '../../..')
      : app.getPath('userData');

    // Step 3: Find or download Python, then ensure deps are installed
    updateSplash('Checking Python environment...');
    const pythonBinary = await findOrDownloadPython(dataDir, splashWindow);

    pythonConfig = {
      pythonBin: pythonBinary,
      dataDir,
      envFilePath: isDev
        ? path.join(dataDir, '.env')
        : path.join(dataDir, '.env.encrypted'),
      requirementsPath: path.join(dataDir, 'requirements.txt'),
      port: 8000,
    };

    await ensurePythonDeps(pythonConfig, splashWindow);

    // Step 4: Start Python backend (with retry)
    let result: HealthCheckResult = { status: 'timeout' };
    let attempts = 0;

    while (attempts <= MAX_PYTHON_RETRIES) {
      result = await attemptPythonStart(pythonConfig);

      if (result.status === 'healthy') {
        console.log('[Startup] Python backend is healthy.');
        break;
      }

      // Build error context
      const portBusy = await isPortInUse(pythonConfig.port);
      const errorMsg = buildErrorMessage(result, portBusy);
      console.warn(`[Startup] Python backend failed (attempt ${attempts + 1}):`, result.status);
      console.warn('[Startup] Recent Python output:\n' + getRecentPythonOutput());

      if (attempts < MAX_PYTHON_RETRIES) {
        // Offer retry
        updateSplash('Python backend failed to start');
        const { response } = await dialog.showMessageBox({
          type: 'warning',
          title: 'Python Backend Failed',
          message: errorMsg,
          buttons: ['Retry', 'Quit'],
          defaultId: 0,
          cancelId: 1,
        });

        if (response === 0) {
          // Retry
          killPythonProcess();
          attempts++;
          continue;
        }
        // User chose to quit
        app.quit();
        return;
      } else {
        // Final attempt exhausted
        updateSplash('Python backend failed to start');
        await dialog.showMessageBox({
          type: 'error',
          title: 'Python Backend Error',
          message: `Failed after ${attempts + 1} attempts.\n\n${errorMsg}` +
            `\n\nThe application cannot run without the Python backend.`,
          buttons: ['Quit'],
        });
        app.quit();
        return;
      }
    }

    // Step 5: Start Express API (embedded) — skip if already running (e.g. start-dev.sh)
    const apiPort = 3001;
    const apiBusy = await isPortInUse(apiPort);
    if (apiBusy) {
      console.log(`[Startup] Express API already running on port ${apiPort}, reusing it.`);
    } else {
      updateSplash('Starting API server...');
      const { startApiServer } = require('./api-server');
      const frontendDir = isDev ? undefined : path.join(process.resourcesPath, 'frontend');
      apiServer = await startApiServer({
        port: apiPort,
        generatedImagesPath: getUserDataPath('generated_outputs'),
        referenceImagesPath: getUserDataPath('rag/reference_images'),
        frontendPath: frontendDir,
      });
    }

    // Step 6: Create main window
    updateSplash('Loading interface...');
    createWindow();

    // Step 7: Initialize auto-updater (non-blocking, production only)
    if (!isDev && mainWindow) {
      initAutoUpdater(mainWindow);
    }

  } catch (err) {
    console.error('[Startup] Fatal error:', err);
    dialog.showErrorBox('Startup Error', `Failed to start: ${err}`);
    app.quit();
  }
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-python-status', async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/health');
    return res.ok ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
});

ipcMain.handle('restart-python-backend', async (): Promise<{ success: boolean; error?: string }> => {
  if (!pythonConfig) {
    return { success: false, error: 'Application not fully initialized yet' };
  }

  console.log('[IPC] Restart generation service requested');

  try {
    killPythonProcess();
    await new Promise(r => setTimeout(r, 1000));

    const result = await attemptPythonStart(pythonConfig);

    if (result.status === 'healthy') {
      console.log('[IPC] Generation service restarted successfully');
      return { success: true };
    }

    const portBusy = await isPortInUse(pythonConfig.port);
    console.warn('[IPC] Generation service restart failed:', result.status);
    return {
      success: false,
      error: portBusy
        ? 'Port is in use by another application'
        : result.status === 'crashed'
          ? 'Service crashed during startup'
          : 'Service did not respond in time'
    };
  } catch (err) {
    console.error('[IPC] Restart error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.on('ready', startup);

app.on('before-quit', () => {
  if (pythonProcess && pythonProcess.pid) {
    console.log('[Cleanup] Killing Python backend...');
    if (process.platform === 'win32') {
      // Kill entire process tree on Windows (/T = tree, /F = force)
      try {
        execSync(`taskkill /F /T /PID ${pythonProcess.pid}`, { stdio: 'ignore' });
      } catch {
        // Process may already be dead
      }
    } else {
      pythonProcess.kill('SIGTERM');
    }
    pythonProcess = null;
  }
  if (apiServer) {
    console.log('[Cleanup] Closing Express server...');
    apiServer.close();
    apiServer = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
