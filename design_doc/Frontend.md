# Frontend: Web app
A web application with a three-panel layout featuring a left-side style selector, center chat input for comfortable natural language interaction, and right-side sketch grid with quick actions for downloading, regenerating, and flagging outputs.

## UI / UX Principles

### Design Philosophy
- Minimal
- Professional
- Quiet
- Tool-first
- Optimized for speed and focus

### Layout
- Left Panel
    - Style Selector (primary control)
    - Optional experimental toggle
- Center Panel
    - Large chat input
    - Comfortable typing experience
- Right Panel
    - Sketch grid
    - Quick actions (download, regenerate, flag)

## Implementation

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS for rapid UI development
- **Build Tool**: Vite for fast development and optimized production builds
- **Desktop Packaging**: Electron for cross-platform desktop application
- **API Server**: Express.js (TypeScript) providing REST endpoints
- **Backend Communication**: HTTP REST API (localhost:3001)

### Project Structure

```
control/
├── shared/schema/          # TypeScript types mirroring Python dataclasses
│   ├── api-contracts.ts    # REST API request/response types
│   ├── prompt-spec.ts      # PromptSpec interface
│   ├── generation.ts       # Generation types
│   └── style.ts            # Style types
│
├── api/                    # Express API Server
│   ├── src/
│   │   ├── server.ts       # Main Express app (port 3001)
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic (mock service for MVP)
│   └── package.json
│
├── frontend/               # React Web Application
│   ├── src/
│   │   ├── components/     # React components (three-panel layout)
│   │   ├── hooks/          # Custom hooks (useGenerate)
│   │   ├── services/       # API client (Axios)
│   │   └── styles/         # Global CSS and Tailwind
│   └── package.json
│
└── electron/               # Electron Desktop Wrapper
    ├── main.ts             # Electron main process
    ├── preload.ts          # Secure IPC bridge
    └── package.json
```

### Frontend-Backend Connection

The frontend communicates with the Python backend through a TypeScript API server layer:

```
React Frontend (port 5173)
    ↓ HTTP REST
Express API Server (port 3001)
    ↓ Child Process / JSON I/O
Python Backend (prompt, style, rag, generate)
```

**API Endpoints:**
- `GET /api/health` - Health check and backend status
- `GET /api/styles` - Retrieve available style options
- `POST /api/generate` - Generate concept sketches

**Data Flow:**
1. User selects style and enters text in React UI
2. Frontend sends POST request to `/api/generate`
3. API server calls Python backend modules (via subprocess or HTTP)
4. Python executes: Prompt compilation → RAG retrieval → Image generation
5. API server returns sketches metadata and image paths
6. Frontend displays generated sketches with action buttons

**Type Safety:**
- Shared TypeScript interfaces mirror Python dataclasses
- Ensures consistent data structures across the stack
- Single source of truth for API contracts

### Usage

**Development Mode:**
```bash
# Terminal 1: Start API server
cd control/api
npm run dev

# Terminal 2: Start React frontend
cd control/frontend
npm run dev

# Terminal 3: Launch Electron app (or use browser at localhost:5173)
cd control/electron
npm run dev
```

**Quick Start (All Services):**
```bash
cd control
./start-dev.sh
```

**User Workflow:**
1. Select a style from left panel (e.g., "Vintage Mascot")
2. Enter design description in center textarea
3. Click "Generate Sketches" or press Cmd+Enter
4. View 4 generated sketches in right panel (2×2 grid)
5. Use quick actions: Download, Regenerate, or Flag individual sketches

**MVP Status:**
- ✅ Full UI/UX workflow implemented
- ✅ Three-panel responsive layout
- ✅ Mock API with realistic delays
- ⚠️ Python backend integration pending (currently mocked)
- ⚠️ Placeholder images instead of real generations

### Component Architecture

**MainLayout** - Root component managing three-panel grid layout

**StyleSelector** (Left Panel)
- Fetches styles from API on mount
- Radio button selection
- Experimental mode toggle

**ChatInput** (Center Panel)
- Large textarea with character count
- Generate button with loading states
- Keyboard shortcut support (Cmd/Ctrl+Enter)
- Validation (requires style selection and text input)

**SketchGrid** (Right Panel)
- Empty state, loading state, success state
- 2×2 responsive grid
- Quick action buttons per sketch
- Error handling and display

**useGenerate Hook**
- Manages generation state (loading, error, sketches)
- Calls API client
- Handles response parsing

### To connect the real Python backend:

1. Implement `PythonBridge` service in `control/api/src/services/python-bridge.ts`
2. Replace `MockGenerationService` with `PythonBridge` in routes
3. Python will be spawned as subprocess and communicate via JSON

To add real images:

1. Python generates to `intelligence/generated_outputs/{timestamp}/`
2. API serves static files: `app.use('/outputs', express.static(...))`
3. Frontend displays real images instead of placeholders

### Future Enhancements
- Sketch history and project management
- Batch operations (download all, regenerate multiple)
- User feedback loop integration with RAG system