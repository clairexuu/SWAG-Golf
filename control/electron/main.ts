// Electron main process — orchestrates all services

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { ChildProcess, execSync } from 'child_process';
import { getResourcePath, getUserDataPath, getFrontendPath, initializeUserData } from './paths';
import { findOrDownloadPython, ensurePythonDeps, startPythonBackend, waitForPythonHealth, getRecentPythonOutput, PythonConfig } from './python-manager';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let apiServer: import('http').Server | null = null;
let pythonProcess: ChildProcess | null = null;

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

    const pythonConfig: PythonConfig = {
      pythonBin: pythonBinary,
      dataDir,
      envFilePath: isDev
        ? path.join(dataDir, '.env')
        : path.join(dataDir, '.env.encrypted'),
      requirementsPath: path.join(dataDir, 'requirements.txt'),
      port: 8000,
    };

    await ensurePythonDeps(pythonConfig, splashWindow);

    // Step 4: Start Python backend
    updateSplash('Starting Python backend...');
    pythonProcess = startPythonBackend(pythonConfig);

    const pythonReady = await waitForPythonHealth(pythonConfig.port, 90_000);
    if (!pythonReady) {
      const pythonOutput = getRecentPythonOutput();
      console.warn('[Startup] Python backend did not become healthy in time.');
      console.warn('[Startup] Recent Python output:\n' + pythonOutput);
      dialog.showErrorBox(
        'Python Backend Warning',
        'The Python backend did not start in time. The app will run with limited functionality (mock mode).\n\n' +
        'Recent Python output:\n' + (pythonOutput || '(no output captured)'),
      );
    } else {
      console.log('[Startup] Python backend is healthy.');
    }

    // Step 5: Start Express API (embedded)
    updateSplash('Starting API server...');
    const { startApiServer } = require('./api-server');
    const frontendDir = isDev ? undefined : path.join(process.resourcesPath, 'frontend');
    apiServer = await startApiServer({
      port: 3001,
      generatedImagesPath: getUserDataPath('generated_outputs'),
      referenceImagesPath: getUserDataPath('rag/reference_images'),
      frontendPath: frontendDir,
    });

    // Step 6: Create main window
    updateSplash('Loading interface...');
    createWindow();

  } catch (err) {
    console.error('[Startup] Fatal error:', err);
    dialog.showErrorBox('Startup Error', `Failed to start: ${err}`);
    app.quit();
  }
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('get-python-status', async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/health');
    return res.ok ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
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
