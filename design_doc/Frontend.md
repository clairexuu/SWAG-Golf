# Frontend: Web App

A three-panel web application: left-side style selector, center chat input, right-side sketch grid with quick actions.

## Architecture

```
React Frontend (5173) → Express API (3001) → Python FastAPI (8000)
                              ↓                      ↓
                        Static images          Generation Pipeline
```

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Desktop**: Electron
- **API Layer**: Express.js (port 3001)
- **Backend**: Python FastAPI (port 8000)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with Python backend status |
| `/api/styles` | GET | Available styles from `style/style_library/` |
| `/api/generate` | POST | Generate sketches (runs full pipeline) |
| `/api/generated/*` | GET | Serve generated images |

## Data Flow

1. User selects style and enters description
2. Frontend → Express → Python FastAPI
3. Python runs: Style → Prompt Compilation → RAG Retrieval → Image Generation
4. Generated images saved to `generated_outputs/`
5. Frontend displays images via `/api/generated/`

## Prerequisites

- Node.js 18+ and npm
- All other requirements as in @Backend.SetUp.md

```bash
# Install Node dependencies (first time only)
cd control/api && npm install
cd ../frontend && npm install
cd ../electron && npm install
```

## Usage

```bash
cd control
./start-dev.sh
```

Starts all services:
- Python API: http://localhost:8000
- Express API: http://localhost:3001
- Frontend: http://localhost:5173
- Electron app

## Project Structure

```
control/
├── shared/schema/     # TypeScript types mirroring Python dataclasses
├── api/               # Express API server
├── frontend/          # React application
└── electron/          # Desktop wrapper

api/                   # Python FastAPI server
├── main.py            # Entry point
├── routes/            # /styles, /generate endpoints
└── services/          # PipelineService wraps backend components
```

## Components

**StyleSelector** (Left Panel) - Fetches and displays styles, radio selection

**ChatInput** (Center Panel) - Text input, generate button, Cmd+Enter shortcut

**SketchGrid** (Right Panel) - 2x2 grid, download/regenerate/flag actions

## Status

- Full UI/UX workflow
- Three-panel responsive layout
- Python backend integration (with mock fallback)
- Real image generation and display
