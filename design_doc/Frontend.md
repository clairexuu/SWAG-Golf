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

**StyleSelector** On the left 1/4 and upper 1/2 of the page, fetches and displays styles, radio selection. 

**StyleManager** On the left 1/4 and lower 1/2 of the page, user has three options: add image to an existing style, delete a style, or initialize a new style (with or without reference image).

**UserPromptIput** In the middle of the page, upper 1/2, takes user text input and a generate button.

**UserFeebackIput** In the middle of the page, lower 1/2, takes user text input (feedback of generated image) and a regenerate button or a submit button.

**SketchGrid** On the right 1/2 of the page, displays generated images (each image is labeled 1, 2,3, 4 etc.) in a 2x2 grid, allows user to download each image.

## Status

- Full UI/UX workflow
- Three-panel responsive layout
- Python backend integration (with mock fallback)
- Real image generation and display
