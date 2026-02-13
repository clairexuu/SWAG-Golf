"use strict";
// Electron main process — orchestrates all services
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
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const paths_1 = require("./paths");
const python_manager_1 = require("./python-manager");
const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let splashWindow = null;
let apiServer = null;
let pythonProcess = null;
// ---------------------------------------------------------------------------
// Splash screen (shown during startup / first-run setup)
// ---------------------------------------------------------------------------
function createSplashWindow() {
    const win = new electron_1.BrowserWindow({
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
function updateSplash(message) {
    if (!splashWindow || splashWindow.isDestroyed())
        return;
    splashWindow.webContents.executeJavaScript(`document.getElementById('status').textContent = ${JSON.stringify(message)};`).catch(() => { });
}
// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
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
async function startup() {
    console.log('Electron app ready');
    // Show splash
    splashWindow = createSplashWindow();
    try {
        // Step 1: Initialize user data (first-run copy)
        updateSplash('Initializing application data...');
        (0, paths_1.initializeUserData)();
        // Step 2: Determine paths
        const dataDir = isDev
            ? path.resolve(__dirname, '../../..')
            : electron_1.app.getPath('userData');
        // Step 3: Find or download Python, then ensure deps are installed
        updateSplash('Checking Python environment...');
        const pythonBinary = await (0, python_manager_1.findOrDownloadPython)(dataDir, splashWindow);
        const pythonConfig = {
            pythonBin: pythonBinary,
            dataDir,
            envFilePath: path.join(dataDir, '.env'),
            requirementsPath: path.join(dataDir, 'requirements.txt'),
            port: 8000,
        };
        await (0, python_manager_1.ensurePythonDeps)(pythonConfig, splashWindow);
        // Step 4: Start Python backend
        updateSplash('Starting Python backend...');
        pythonProcess = (0, python_manager_1.startPythonBackend)(pythonConfig);
        const pythonReady = await (0, python_manager_1.waitForPythonHealth)(pythonConfig.port, 90_000);
        if (!pythonReady) {
            const pythonOutput = (0, python_manager_1.getRecentPythonOutput)();
            console.warn('[Startup] Python backend did not become healthy in time.');
            console.warn('[Startup] Recent Python output:\n' + pythonOutput);
            electron_1.dialog.showErrorBox('Python Backend Warning', 'The Python backend did not start in time. The app will run with limited functionality (mock mode).\n\n' +
                'Recent Python output:\n' + (pythonOutput || '(no output captured)'));
        }
        else {
            console.log('[Startup] Python backend is healthy.');
        }
        // Step 5: Start Express API (embedded)
        updateSplash('Starting API server...');
        const { startApiServer } = require('./api-server');
        const frontendDir = isDev ? undefined : path.join(process.resourcesPath, 'frontend');
        apiServer = await startApiServer({
            port: 3001,
            generatedImagesPath: (0, paths_1.getUserDataPath)('generated_outputs'),
            referenceImagesPath: (0, paths_1.getUserDataPath)('rag/reference_images'),
            frontendPath: frontendDir,
        });
        // Step 6: Create main window
        updateSplash('Loading interface...');
        createWindow();
    }
    catch (err) {
        console.error('[Startup] Fatal error:', err);
        electron_1.dialog.showErrorBox('Startup Error', `Failed to start: ${err}`);
        electron_1.app.quit();
    }
}
// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------
electron_1.ipcMain.handle('get-python-status', async () => {
    try {
        const res = await fetch('http://127.0.0.1:8000/health');
        return res.ok ? 'connected' : 'disconnected';
    }
    catch {
        return 'disconnected';
    }
});
// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
electron_1.app.on('ready', startup);
electron_1.app.on('before-quit', () => {
    if (pythonProcess && pythonProcess.pid) {
        console.log('[Cleanup] Killing Python backend...');
        if (process.platform === 'win32') {
            // Kill entire process tree on Windows (/T = tree, /F = force)
            try {
                (0, child_process_1.execSync)(`taskkill /F /T /PID ${pythonProcess.pid}`, { stdio: 'ignore' });
            }
            catch {
                // Process may already be dead
            }
        }
        else {
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
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
//# sourceMappingURL=main.js.map