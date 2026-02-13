# Electron Desktop App

## How It Works

The Electron app packages the entire SWAG Concept Sketch Agent into a single downloadable desktop application. When launched, it automatically orchestrates all three services:

```
Electron Main Process
    |
    |-- 1. Splash Screen (shows startup progress)
    |
    |-- 2. First-Run Setup
    |       - Copies bundled data (styles, embeddings, reference images, .env) to user data dir
    |       - Creates Python venv and installs dependencies (~5-10 min, first time only)
    |
    |-- 3. Python FastAPI Backend (child process, port 8000)
    |       - Spawned from auto-created .venv
    |       - Runs: python -m uvicorn api.main:app
    |       - Handles: generation pipeline, style management, RAG, feedback
    |
    |-- 4. Express API Server (embedded in main process, port 3001)
    |       - Proxies requests to Python backend
    |       - Serves static files (generated images, reference images)
    |       - Falls back to mock mode if Python is unavailable
    |
    |-- 5. React Frontend (loaded in BrowserWindow)
    |       - Built static files from control/frontend/dist/
    |       - Communicates with Express API via HTTP on localhost:3001
    |
    |-- 6. Cleanup on Quit
            - Kills Python process (SIGTERM)
            - Closes Express server
```

### Key Files

| File | Purpose |
|------|---------|
| `control/electron/main.ts` | Orchestrates startup: splash screen, Python setup, Express embed, window creation |
| `control/electron/python-manager.ts` | Auto-creates Python venv, spawns/monitors the Python backend process |
| `control/electron/paths.ts` | Resolves file paths for dev vs production (extraResources vs project root) |
| `control/electron/preload.ts` | Secure IPC bridge between main process and renderer |
| `control/electron/build-api.js` | esbuild script that bundles Express API (ESM) into CJS for Electron |
| `control/electron/package.json` | Dependencies, build scripts, and electron-builder config with extraResources |

### What Gets Bundled

The packaged `.dmg` / `.exe` includes:
- Electron runtime + Node.js
- Compiled React frontend (`control/frontend/dist/`)
- Bundled Express API (`control/electron/dist/api-server.js`)
- `.env` file with API keys
- `requirements.txt` for Python auto-setup
- All Python source code (`api/`, `generate/`, `prompt/`, `rag/`, `style/`, `feedback/`)
- Reference images, embedding cache, and style library

---

## For Developers

### Development Mode

Development mode runs all services independently with hot-reload:

```bash
cd control
./start-dev.sh
```

This starts:
1. Python API on port 8000 (with health check)
2. Express API on port 3001
3. Vite dev server on port 5173
4. Electron window loading from Vite

To stop all services:
```bash
cd control
./stop-dev.sh
```

### Project Structure (Electron-specific)

```
control/electron/
    main.ts              # Main process — startup orchestration
    preload.ts           # Renderer bridge (IPC)
    paths.ts             # Dev/prod path resolution
    python-manager.ts    # Python venv auto-setup + process lifecycle
    build-api.js         # esbuild bundler for Express API
    package.json         # Deps + electron-builder config
    tsconfig.json        # TypeScript config
    dist/                # Compiled output (git-ignored)
    release/             # Packaged app output (git-ignored)
```

---

## Building the Electron App

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+ (installed on your system — needed for the auto-setup to work)

### Build Steps

```bash
# 1. Build the React frontend
cd control/frontend
npm install
npm run build

# 2. Build and package the Electron app
cd ../electron
npm install
npm run build
```

This runs three steps:
1. **`build:api`** — esbuild bundles the Express API into `dist/api-server.js`
2. **`tsc`** — TypeScript compiles `main.ts`, `preload.ts`, `paths.ts`, `python-manager.ts` to `dist/`
3. **`electron-builder`** — packages everything into a distributable

### Platform-Specific Builds

```bash
npm run build:mac   # macOS: .dmg + .zip
npm run build:win   # Windows: NSIS installer + .zip
```

### Build Output

```
control/electron/release/
    SWAG Concept Sketch Agent-1.0.0-arm64.dmg       # macOS installer
    SWAG Concept Sketch Agent-1.0.0-arm64-mac.zip   # macOS portable
    mac-arm64/                                        # Unpacked .app
```

---

## Downloading and Installing

### macOS

1. Get the `.dmg` file from `control/electron/release/`
2. Double-click to open, drag "SWAG Concept Sketch Agent" to Applications
3. On first launch:
   - The app shows a splash screen while it sets up
   - It automatically creates a Python virtual environment and installs all dependencies
   - This takes ~5-10 minutes on first launch (one-time setup)
4. Subsequent launches start in ~5 seconds

### Windows

1. Get the NSIS installer (`.exe`) from `control/electron/release/`
2. Run the installer
3. First launch behavior is the same as macOS (auto Python setup)

### Requirements for End Users

- **Python 3.10+** must be installed on the system (the app auto-creates a venv from it)
- That's it — API keys (`.env`) and all data are bundled inside the app
