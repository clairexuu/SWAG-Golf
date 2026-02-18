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
| `control/electron/auto-updater.ts` | Auto-update module — checks GitHub Releases and applies updates |
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


### Python Setup
On first launch, the app downloads a standalone Python 3.12.12 (~300MB) from astral-sh/python-build-standalone on GitHub. Then install all dependencies from @requirements.txt. It follows the following steps to initialize

```
Initializing application data... — copies bundled resources to userData
Checking Python environment... — downloads Python if not present (shows download %)
Setting up pip... / Installing Python dependencies... — pip install
Starting Python backend... — launches FastAPI via uvicorn on port 8000
Starting API server... — Express API on port 3001
Loading interface... — main window appears
```
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
    auto-updater.ts      # Auto-update via GitHub Releases (electron-updater)
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

---

## Auto-Update

The app uses `electron-updater` to automatically check for and apply updates from GitHub Releases. Users do not need to redownload the app when a new version is released.

### How It Works

1. **On launch** (5 seconds after startup) and **every 4 hours**, the app checks GitHub Releases for a newer version
2. If an update is found, the user sees a native dialog: *"Version X.Y.Z is available. Download?"*
3. On consent, the update downloads in the background while the user continues working
4. Once downloaded: *"Update ready. Restart now or later?"*
5. If the user chooses "Later", the update auto-installs on the next quit

### Data Separation: What Updates vs What Persists

When the app updates, only app code is replaced. User data is never overwritten.

| Category | Content | On Update |
|----------|---------|-----------|
| **App Code** (updates) | Python source (`api/`, `generate/`, `rag/*.py`, `style/*.py`, `feedback/*.py`), prompt templates, frontend, Electron main process, Express API | Always overwritten with new version |
| **App Config** (updates) | `requirements.txt`, `.env.encrypted`, `visual_rule_template.json` | Always overwritten |
| **User Data** (persists) | `style/style_library/`, `rag/reference_images/`, `rag/cache/` | Seeded on first install (includes default "general" style), **never overwritten** |
| **User Output** (persists) | `generated_outputs/`, `feedback/logs/` | Created on first install, never touched |

On first install, the bundled default styles (including the "general" style and its reference images) are copied to the user's local data directory. After that, they belong to the user and are never overwritten by updates.

---

## Releasing a New Version (For Developers)

### Git vs App Release — They Are Separate

The Electron app release is **completely independent** from git commits and pushes:

- **Git commits/pushes**: Normal version control. Push code as often as you like. This does NOT trigger any app update for users.
- **App release**: A separate manual step. You only run the release command when you're ready for users to get the new version.

```
Git workflow:     commit -> push -> commit -> push -> commit -> push
                                                          |
App release:                                    bump version -> npm run release:mac
                                                          |
User's app:                              auto-detects new version -> downloads -> restarts
```

### Step-by-Step Release Process

When you've implemented a new feature and want users to get it:

```bash
# 1. Build the React frontend
cd control/frontend
npm run build

# 2. Bump the version number in control/electron/package.json
#    e.g., "version": "1.0.0" -> "version": "1.1.0"
#    Use semver: MAJOR.MINOR.PATCH

# 3. Set your GitHub token (needed to upload to GitHub Releases)
export GH_TOKEN="ghp_your_github_personal_access_token"
#    Token needs 'repo' scope (or 'contents:write' for fine-grained tokens)

# 4. Build, sign, notarize, and publish to GitHub Releases
cd control/electron
npm run release:mac     # macOS build + upload
npm run release:win     # Windows build + upload (run on Windows machine)

```

This creates a GitHub Release containing:
- `.dmg` + `.zip` (macOS)
- `.exe` NSIS installer (Windows)
- `latest-mac.yml` / `latest.yml` (metadata files that `electron-updater` reads)

### Build Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run build:mac` | Local macOS build only (no upload to GitHub) |
| `npm run build:win` | Local Windows build only (no upload to GitHub) |
| `npm run release:mac` | macOS build + upload to GitHub Releases |
| `npm run release:win` | Windows build + upload to GitHub Releases |

### Important Notes

- **Version must increase**: `electron-updater` compares semver versions. Every release must have a higher version number than the previous one.
- **macOS code signing**: Required for auto-update. The `notarize.js` afterSign hook handles Apple notarization. Needs `APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`, and the AuthKey `.p8` file.
- **First release with auto-update**: Existing users on older versions (before auto-update was added) must manually download this version once. After that, all future updates are automatic.
- **Differential updates**: `electron-builder` generates `.blockmap` files automatically. `electron-updater` uses these to download only changed blocks (~10-50MB instead of the full app size).
- **Python dependencies**: If `requirements.txt` changes, the app automatically reinstalls Python deps on next launch (handled by `ensurePythonDeps()` via hash comparison).
