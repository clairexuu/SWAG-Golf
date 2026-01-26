# SWAG Concept Sketch Agent - Setup Guide

This document covers all dependencies and setup steps for both the Python backend and TypeScript/JavaScript frontend.

## System Requirements

### Required Software

1. **Python 3.13+**
   - Check: `python3 --version`
   - Download: https://www.python.org/downloads/

2. **Node.js 18+ and npm**
   - Check: `node --version` and `npm --version`
   - Download: https://nodejs.org/

3. **Git**
   - Check: `git --version`
   - Included with macOS Xcode Command Line Tools

---

## Backend Setup (Python)

### 1. Create Virtual Environment

```bash
# From project root
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate    # Windows
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Current dependencies:**
- `Pillow>=10.0.0` - Image manipulation
- `openai>=1.0.0` - GPT API for prompt compilation
- `ipython>=8.0.0` - Interactive Python

**Future ML dependencies** (commented out, uncomment when needed):
- `torch>=2.0.0`
- `transformers>=4.30.0`
- `clip` - OpenAI CLIP for image embeddings

### 3. Environment Variables

Create a `.env` file in the project root:

```bash
# .env
OPENAI_API_KEY=your_api_key_here
```

---

## Frontend Setup (Node.js/TypeScript)

The frontend consists of three separate npm projects. Each needs dependencies installed.

### 1. API Server

```bash
cd control/api
npm install
```

**Key dependencies:**
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `tsx` - TypeScript execution and watch mode
- `typescript` - TypeScript compiler
- `@types/express`, `@types/node` - TypeScript definitions

### 2. React Frontend

```bash
cd control/frontend
npm install
```

**Key dependencies:**
- `react`, `react-dom` - React framework
- `axios` - HTTP client
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - Vite React plugin
- `tailwindcss` - CSS framework
- `postcss`, `autoprefixer` - CSS processing
- `typescript` - TypeScript compiler
- `@types/react`, `@types/react-dom` - TypeScript definitions

### 3. Electron Desktop App

```bash
cd control/electron
npm install
```

**Key dependencies:**
- `electron` - Desktop app framework
- `electron-builder` - Packaging and distribution
- `electron-store` - Persistent storage
- `typescript` - TypeScript compiler
- `@types/node` - TypeScript definitions

---

## Quick Setup (All at Once)

From the project root:

```bash
# Python backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend projects
cd control/api && npm install && cd ..
cd frontend && npm install && cd ..
cd electron && npm install && cd ../..
```
---

## Running the Application

### Option 1: Quick Start Script

```bash
cd control
./start-dev.sh
```

This starts all three services:
- API server on port 3001
- Frontend on port 5173
- Electron desktop app

### Option 2: Manual (Three Terminals)

**Terminal 1 - API Server:**
```bash
cd control/api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd control/frontend
npm run dev
```

**Terminal 3 - Electron:**
```bash
cd control/electron
npm run dev
```

### Option 3: Browser Only

```bash
# Terminal 1
cd control/api
npm run dev

# Terminal 2
cd control/frontend
npm run dev

# Then open http://localhost:5173 in browser
```

## Next Steps

After setup:
1. Run the application using one of the methods above
2. Test the workflow (see [control/GETTING_STARTED.md](control/GETTING_STARTED.md))
3. Review the testing checklist (see [control/TESTING_CHECKLIST.md](control/TESTING_CHECKLIST.md))
4. Start development or integration work

For architecture details, see [design_doc/Overview.md](design_doc/Overview.md)
