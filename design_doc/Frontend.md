# Frontend: Web App

A three-page web application with top navigation: **Studio** (sketch generation), **Styles** (style management), and **Archive** (generation history).

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

## Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | StudioPage | Sketch generation with style selection, prompt input, and results grid |
| `/styles` | StyleLibraryPage | CRUD management for styles and reference images |
| `/archive` | ArchivePage | Browse past generations filtered by style |

Header navigation (`Header.tsx`) with NavLink active-state highlighting across all pages. All routes nested inside `AppShell` layout via React Router Outlet.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with Python backend status |
| `/api/styles` | GET | List all available styles |
| `/api/styles` | POST | Create new style (multipart form with images) |
| `/api/styles/:id` | PUT | Update style metadata |
| `/api/styles/:id` | DELETE | Delete style and all reference images |
| `/api/styles/:id/images` | POST | Add reference images to style |
| `/api/styles/:id/images` | DELETE | Remove specific reference images |
| `/api/generate` | POST | Generate sketches (runs full pipeline) |
| `/api/feedback` | POST | Submit user feedback for a session |
| `/api/feedback/summarize` | POST | Summarize accumulated feedback |
| `/api/generations` | GET | Fetch generation history (optional `?styleId` filter) |
| `/api/generated/*` | GET | Serve generated images |
| `/api/reference-images/*` | GET | Serve style reference images |

## Data Flow

**Generation:** User selects style → enters concept in PromptComposer → Frontend → Express → Python FastAPI → Pipeline (Style → Prompt Compilation → RAG Retrieval → Image Generation) → images saved to `generated_outputs/` → displayed in SketchGrid.

**Feedback:** User enters feedback in PromptComposer (Feedback mode) → submitted with sessionId → accumulated per session → summarized on page unload via `navigator.sendBeacon()`.

**Style Management:** Create/edit/delete styles and reference images through StyleLibraryPage → Express forwards to Python → StyleRegistry updates → embeddings rebuilt.

## Pages & Components

### Studio Page (`/`)

Three-panel layout for sketch generation.

- **Left — Sidebar + StyleSelector**: Collapsible sidebar listing all styles. Selecting a style starts a new session (UUID). Toggle with Cmd+B.
- **Center — PromptComposer**: Textarea with two modes — *Concept* (new generation) and *Feedback* (refine results). Cmd+Enter to submit.
- **Right — SketchGrid + Lightbox**: Displays generated sketches in a grid. Each SketchCard shows resolution badge and hover actions (download, expand). Lightbox for full-screen viewing with arrow-key navigation. "Download All" creates a ZIP.

### Styles Page (`/styles`)

Two-panel layout for style management.

- **Left sidebar**: Scrollable style list with "Create New" button. Shows style name, description, and image count.
- **Right panel** (conditional):
  - *CreateStyleForm*: Name, description, visual rules (line weight, looseness, complexity), reference image upload (drag-and-drop or file/folder picker).
  - *StyleDetailView*: Read-only or edit mode for metadata. Reference image grid (6 columns) with multi-select deletion.

### Archive Page (`/archive`)

Two-panel layout for generation history.

- **Left sidebar**: Style list for filtering generations.
- **Right panel**: GenerationCard list showing timestamp, prompt, and thumbnail strip for each generation. HistoryLightbox for full-screen image viewing. Capped at 100 most recent generations per style.

### Shared Components

- **AppShell**: Root layout with Header and Outlet.
- **Header**: Top nav bar with Studio/Styles/Archive links and icons.
- **Sidebar**: Collapsible left panel container.
- **Modal**: Reusable dialog for confirmations.
- **Toast + ToastContext**: Global notification system (success/error/info, auto-dismiss).
- **EmptyState**: Placeholder with icon, title, description, and optional action.
- **Skeleton**: Loading placeholders (SkeletonLine, SkeletonCard, SkeletonStyleCard, SkeletonSketchCard).
- **Icons**: 23+ SVG icons used across all pages.

### Global State

**StyleContext** provides `styles[]`, `selectedStyleId`, `selectStyle()`, `refreshStyles()`, and `clearSelection()` across all pages.

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
├── shared/schema/          # TypeScript types mirroring Python dataclasses
├── api/                    # Express API server
│   └── src/
│       ├── server.ts
│       ├── routes/         # generate, styles, feedback, generations
│       └── services/       # python-client, mock-service
├── frontend/               # React application
│   └── src/
│       ├── App.tsx         # Router setup
│       ├── pages/          # StudioPage, StyleLibraryPage, ArchivePage
│       ├── components/     # Layout, CenterPanel, LeftPanel, RightPanel, HistoryPage, shared
│       ├── hooks/          # useGenerate, useHistory
│       ├── context/        # StyleContext
│       └── services/       # api.ts (Axios client)
└── electron/               # Desktop wrapper

api/                        # Python FastAPI server
├── main.py                 # Entry point
├── routes/                 # generate, styles, feedback, generations
└── services/               # PipelineService wraps backend components
```

## Status

- Three-page responsive layout with header navigation
- Full CRUD style management with reference image upload/delete
- Sketch generation with session-based feedback loop
- Generation history archive with style filtering
- Python backend integration (with mock fallback)
