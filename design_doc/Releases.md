# Release History

## v1.0.2 - Fix Known Issues + Generation Speed Optimization

- Fixed Generation in Processing Rendering
- Fixed Image loading issues
- Fixed broken image display after generation
- Optimized Image Generation speed:
  - Switched prompt compilation model from GPT-4o to GPT-4o-mini
  - Removed redundant health check
  - Reduced RAG reference images from top-5 to top-3
  - Converted Gemini API calls from ThreadPoolExecutor to native async (`asyncio.gather`) 
  - Lowered default image resolution from 2K to 1K preview mode (~30-50% faster)
  - Added SSE streaming with progressive display (time to first image reduced from ~20-35s to ~8-14s)

## v1.0.1 - Fix Known Issues

- test auto-update

## v1.0.0 — Initial Release

First packaged release of the SWAG Concept Sketch Agent desktop app.

### Features

- **Sketch Generation**: Natural language prompt to concept sketch via RAG pipeline (Style Selection → Prompt Compilation with GPT → RAG Retrieval → Image Generation via Nano Banana)
- **Sketch Refinement**: Select individual sketches to regenerate with feedback, keeping the rest intact
- **Style Library**: Create, edit, and delete styles with visual rules and reference images. Bundled with default "general" style
- **Archive**: Browse past generations filtered by style (up to 100 per style)
- **Feedback Loop**: Per-session feedback collection with GPT-summarized style learning
- **Desktop App**: Electron-packaged with embedded Express API and standalone Python backend (auto-downloads Python 3.12, installs deps on first launch)
- **Auto-update**: all future updates will be delivered automatically


### Architecture

- Frontend: React 18 + TypeScript + TailwindCSS + Vite
- API Layer: Express.js (port 3001) proxying to Python FastAPI (port 8000)
- Image Generation: Nano Banana (model-agnostic adapter layer)
- RAG: CLIP embeddings with hard style filter + top-K semantic retrieval
- Storage: Filesystem-based (JSON styles, generated images, embedding cache)

### Platforms

- macOS (Apple Silicon / arm64): `.dmg` + `.zip`
- Windows (x64): NSIS installer `.exe` + `.zip`