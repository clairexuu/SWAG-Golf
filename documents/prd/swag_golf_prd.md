# SWAG Golf Concept Sketch Agent -- MVP Product Requirements Document

**Version:** 1.0
**Last Updated:** 2026-02-07
**Status:** MVP
**Author:** Product Team

---

## Elevator Pitch

SWAG Golf's licensed design pipeline is bottlenecked at concept sketching -- not at creative ideation or final execution. Senior designers already know what they want to build; the friction is translating ideas into early-stage visual concepts fast enough to keep pace with approvals, iteration cycles, and volume demands. The Concept Sketch Agent is an internal AI-powered design assistant that converts a designer's natural language description into rough, draw-over-ready concept sketches in seconds, using a retrieval-augmented generation (RAG) system built on the team's own curated reference image library. It preserves designer control, enforces exact stylistic fidelity, and optimizes for speed and concept throughput -- not final polish.

---

## Problem Statement

SWAG Golf designers spend a disproportionate amount of time producing early-stage concept sketches that exist solely to communicate direction, secure internal approvals, and seed iteration. These sketches are not final art -- they are rough visual artifacts that get drawn over, annotated, and discarded once a direction is chosen. Despite their disposable nature, each sketch still requires a designer to sit down, interpret a brief, select a style vocabulary, and draw. At current volume, this manual step creates a throughput ceiling on the entire licensed design pipeline. Meanwhile, generic AI image generators produce output that is too polished, stylistically inconsistent, or completely disconnected from SWAG's proprietary visual language. Designers need a tool that speaks their style, respects their constraints, and produces intentionally rough output that accelerates -- rather than replaces -- their craft.

---

## Target Audience

**Primary User: SWAG Golf Senior Designers**

- Professional designers working on licensed golf apparel graphics
- Highly skilled in final execution; bottlenecked at early-stage concepting
- Maintain personal style libraries with curated reference images
- Need output they can draw over, not output that replaces their work
- Value speed-to-first-draft over pixel-perfect generation
- Work on macOS desktops in a studio environment

**Secondary User: SWAG Golf Design Leads / Art Directors**

- Review and approve concept directions before production
- Need to see multiple concept variations quickly to make go/no-go decisions
- Benefit from faster iteration cycles across the team

---

## Unique Selling Proposition

Unlike generic AI image generators (Midjourney, DALL-E, Stable Diffusion) that produce polished, stylistically unpredictable output from a global training set, the SWAG Concept Sketch Agent:

1. **Enforces exact stylistic fidelity** -- Every generation is scoped to a designer-curated style with isolated reference images, visual rules (line weight, looseness, complexity), and optional negative examples. The system never blends styles or drifts into generic aesthetics.
2. **Produces intentionally rough output** -- Black-and-white, loose-ink, thick-outline sketches that look like a 10-15 minute human sketch. Designed to be drawn over, not shipped.
3. **Uses the team's own reference library** -- RAG retrieval pulls from SWAG's proprietary image database, not the open internet. Generated concepts reflect real SWAG designer work.
4. **Preserves designer control at every step** -- Designers select the style, describe the concept in their own words, review multiple variations, provide feedback, and iterate until a direction is chosen. The AI accelerates; the designer decides.

---

## Target Platforms

| Platform | Technology | Purpose |
|----------|------------|---------|
| **Desktop App (Primary)** | Electron wrapping React frontend | Native macOS experience for studio use |
| **Web App (Development)** | React 18 + TypeScript + TailwindCSS + Vite | Browser-based access at `localhost:5173` during development |
| **API Layer** | Express.js (port 3001) | Middleware between frontend and Python backend; serves static generated images |
| **Backend** | Python FastAPI (port 8000) | Prompt compilation (GPT), RAG retrieval (CLIP/SigLIP), image generation (Gemini via Nano Banana adapter) |

**Architecture:**
```
React Frontend (5173) --> Express API (3001) --> Python FastAPI (8000)
                               |                       |
                         Static images           Generation Pipeline
                                            (Style -> Prompt -> RAG -> Image Gen)
```

---

## Features List

### Style Selection & Management

The left panel (25% width) is the designer's style control center. The upper half houses the StyleSelector for browsing and selecting styles; the lower half houses the StyleManager for curating the style library itself. Style selection is mandatory before any generation can occur -- it determines all downstream retrieval and generation behavior.

- [ ] As a designer, I want to browse all available styles from my style library, so that I can choose the visual language for my concept sketches.
  - [ ] StyleSelector fetches styles from `GET /api/styles` on component mount
  - [ ] Each style card displays the style name and designer-authored description
  - [ ] Styles are rendered as a radio selection list; exactly one style is selected at a time
  - [ ] Selected style is visually highlighted (blue border + blue background tint)
  - [ ] Loading state displays "Loading styles..." while the API call is in flight
  - [ ] Error state displays a red error message if the styles endpoint fails

- [ ] As a designer, I want to select a style before generating, so that the system scopes all retrieval and generation to my chosen visual language.
  - [ ] Selecting a style sets `selectedStyleId` in application state
  - [ ] The ChatInput generate button is disabled until a style is selected
  - [ ] A warning message ("Please select a style first") appears below the generate button when no style is selected
  - [ ] Changing the selected style mid-session does not clear previously generated sketches
  - [ ] The selected style ID is included in every `POST /api/generate` request payload

- [ ] As a designer, I want to toggle experimental mode, so that I can opt into newer or less stable generation behaviors when I want to explore.
  - [ ] A checkbox labeled "Experimental Mode" appears at the bottom of the StyleSelector panel, below the style list
  - [ ] The toggle state (`experimentalMode`) is passed through to the generate request payload
  - [ ] Experimental mode is off by default
  - [ ] The toggle persists across generation cycles within a session but resets on page reload

- [ ] As a designer, I want to initialize a new style with or without reference images, so that I can expand my style library directly from the tool.
  - [ ] StyleManager provides an "Initialize New Style" action
  - [ ] The user can provide a style name, description, and visual rules (line weight, looseness, complexity)
  - [ ] The user can optionally upload one or more reference images during initialization
  - [ ] Uploaded images are moved to `rag/reference_images/` with UUID-based filenames
  - [ ] A `style.json` file is created in `style/style_library/{style_id}/`
  - [ ] The StyleSelector list refreshes after a new style is created

- [ ] As a designer, I want to add reference images to an existing style, so that I can enrich a style's visual vocabulary over time.
  - [ ] StyleManager provides an "Add Images" action scoped to the currently selected style
  - [ ] The user can upload one or more images via file picker
  - [ ] Duplicate images (already in the style's reference set) are detected and skipped
  - [ ] New images are moved to `rag/reference_images/` and added to the style's `reference_images` array in `style.json`
  - [ ] Embeddings are rebuilt for the affected style after images are added

- [ ] As a designer, I want to delete a style from my library, so that I can remove styles I no longer use.
  - [ ] StyleManager provides a "Delete Style" action
  - [ ] A confirmation dialog appears before deletion to prevent accidental removal
  - [ ] Deleting a style removes the `style/style_library/{style_id}/` directory and its `style.json`
  - [ ] Cached embeddings for the deleted style are also cleared
  - [ ] The StyleSelector list refreshes after deletion
  - [ ] If the deleted style was currently selected, the selection resets to null

---

### Concept Input

The center panel upper half (ChatInput / UserPromptInput) is where the designer describes what they want to see. The interface is deliberately minimal -- a text area and a generate button -- because the complexity lives in the backend pipeline (GPT prompt compilation, RAG retrieval, image generation), not in the input form.

- [ ] As a designer, I want to describe my concept sketch idea in natural language, so that the system can interpret my intent and generate matching visuals.
  - [ ] A multi-line text area accepts free-form text input
  - [ ] Placeholder text provides an example prompt: "Describe your concept sketch idea... Example: playful golf ball character with cartoonish features"
  - [ ] A live character count is displayed below the text area when input is non-empty
  - [ ] The text area is disabled while a generation is in progress

- [ ] As a designer, I want to click "Generate Sketches" to trigger the pipeline, so that I can see concept sketches based on my description and selected style.
  - [ ] The generate button sends a `POST /api/generate` request with `{ input, styleId, numImages: 4, experimentalMode }`
  - [ ] The button is disabled when: no style is selected, input is empty/whitespace-only, or a generation is already in progress
  - [ ] While generating, the button shows a spinning loader icon and the text "Generating..."
  - [ ] The pipeline flow is: Frontend -> Express -> FastAPI -> (Style lookup -> Prompt Compilation via GPT -> RAG Retrieval via CLIP/SigLIP -> Image Generation via Gemini/Nano Banana)
  - [ ] Generated images are saved to `generated_outputs/{timestamp}/` with individual sketch files and a `metadata.json`

- [ ] As a designer, I want to use Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit, so that I can generate sketches without reaching for the mouse.
  - [ ] The keyboard shortcut triggers the same `handleSubmit` function as the button click
  - [ ] The shortcut is only active when the text area is focused
  - [ ] The shortcut respects all the same disabled conditions as the button (no style, empty input, generation in progress)
  - [ ] A tip is displayed below the input area: "Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to generate"

---

### Feedback & Iteration

The center panel lower half (UserFeedbackInput) closes the loop between generation and refinement. After sketches are generated, the designer can provide text feedback describing what to change, then either regenerate (re-run the pipeline with feedback context folded in) or submit (accept the current batch and move on). This feedback-driven iteration is critical to the designer-in-the-loop philosophy.

- [ ] As a designer, I want to provide text feedback on generated sketches, so that I can guide the next iteration toward my vision.
  - [ ] A feedback text area appears in the lower half of the center panel after sketches are generated
  - [ ] The text area accepts free-form text describing desired changes (e.g., "make the character more aggressive, thicker lines, add smoke effect")
  - [ ] Feedback is contextual -- it is appended to the generation pipeline as additional guidance, not as a replacement for the original prompt
  - [ ] Previous feedback history is retained during the session so the system remembers cumulative direction

- [ ] As a designer, I want to click "Regenerate" to re-run generation with my feedback incorporated, so that I can iterate toward the right concept without starting over.
  - [ ] The regenerate button triggers a new `POST /api/generate` call with the original prompt, style, and the appended feedback context
  - [ ] The previous batch of sketches is replaced by the new generation results
  - [ ] The regenerate button is disabled while generation is in progress
  - [ ] Feedback context is passed through the full pipeline: GPT prompt compilation takes it into account, and the generation prompt is adjusted accordingly

- [ ] As a designer, I want to click "Submit" to accept the current batch of sketches, so that I can signal that the current direction is approved and ready for draw-over.
  - [ ] The submit button marks the current generation batch as accepted
  - [ ] Accepted sketches remain visible and downloadable
  - [ ] The feedback input area resets, preparing for a new concept cycle
  - [ ] The original prompt input remains available for a new concept description

---

### Sketch Display & Actions

The right panel (50% width, SketchGrid) is the output surface. Generated sketches are displayed in a 2x2 grid, each labeled with a number (1, 2, 3, 4). Every sketch has quick actions for download, regeneration, and flagging. The grid is designed for rapid visual comparison -- the designer glances across four variations and decides which direction to pursue.

- [ ] As a designer, I want to see my generated concept sketches in a 2x2 grid, so that I can visually compare multiple variations at once.
  - [ ] The SketchGrid renders sketches in a `grid-cols-2` layout with consistent spacing
  - [ ] Each sketch cell has a minimum height of 200px and a gray background placeholder
  - [ ] Images are loaded from `GET /api/generated/{timestamp}/{filename}` via the Express static file server
  - [ ] Images use `object-contain` sizing to preserve aspect ratio without cropping
  - [ ] The grid is scrollable if more than 4 sketches are generated

- [ ] As a designer, I want each sketch labeled with a number (1, 2, 3, 4), so that I can reference specific sketches during feedback and team discussion.
  - [ ] Each sketch card displays a numeric label corresponding to its position (derived from `sketch.id`)
  - [ ] Labels are visually distinct and always visible regardless of image content

- [ ] As a designer, I want to download any individual sketch, so that I can save it locally for draw-over work in my preferred design tool.
  - [ ] Each sketch card has a "Download" button
  - [ ] Clicking download fetches the image as a blob and triggers a browser save dialog
  - [ ] The downloaded file is named `sketch-{id}.png`
  - [ ] Download works for all image formats returned by the generation pipeline

- [ ] As a designer, I want a per-sketch regenerate button, so that I can re-roll a single sketch I am not satisfied with without losing the other three.
  - [ ] Each sketch card has a regenerate button (displayed as a circular arrow icon)
  - [ ] Clicking regenerate triggers re-generation for that specific sketch slot (MVP: logs to console; full implementation deferred to post-MVP)

- [ ] As a designer, I want a per-sketch flag button, so that I can mark a sketch for review or as a negative example.
  - [ ] Each sketch card has a flag button (displayed as a flag icon)
  - [ ] Clicking flag marks the sketch for review (MVP: logs to console; full implementation deferred to post-MVP)
  - [ ] Flagged sketches could feed into the "Do Not Use" reference system in future iterations

- [ ] As a designer, I want to see a loading state while sketches are being generated, so that I know the system is working and I should wait.
  - [ ] A spinning loader animation and "Generating sketches..." message replace the grid content during generation
  - [ ] A subtitle "This may take a few moments" sets expectations for generation time
  - [ ] The loading state is shown for the entire duration of the `POST /api/generate` call

- [ ] As a designer, I want to see a clear error message if generation fails, so that I can understand what went wrong and take corrective action.
  - [ ] An error icon and "Generation Failed" heading are displayed when the API returns an error
  - [ ] The specific error message from the API response is shown below the heading
  - [ ] The error state does not prevent the designer from modifying their prompt and retrying

- [ ] As a designer, I want to see an empty state before my first generation, so that I understand the grid is ready and waiting for input.
  - [ ] A placeholder icon, "No sketches yet" heading, and "Generate your first concept sketch" subtitle are displayed when no sketches exist
  - [ ] The empty state is replaced immediately when generation begins (transitions to loading state)

---

### UX/UI Considerations

The interface is structured as a three-panel layout that maps directly to the designer's mental workflow: choose a style (left), describe a concept (center), review output (right). Every design decision prioritizes speed, clarity, and designer control.

- [ ] As a designer, I want a three-panel layout (style | input | output) that mirrors my workflow, so that I can move through the concept cycle without context-switching.
  - [ ] The layout uses a `grid-cols-[25%_25%_50%]` grid, giving the output panel the most screen real estate
  - [ ] All three panels are visible simultaneously -- no tabs, no hidden panels, no modals for core workflow
  - [ ] Each panel has its own scroll context to prevent one panel's content from affecting another
  - [ ] Panels are wrapped in white cards with rounded corners and subtle shadows for visual separation

- [ ] As a designer, I want a persistent header with the product name, so that the tool feels like a coherent internal product.
  - [ ] The header displays "SWAG Concept Sketch Agent" as a bold heading
  - [ ] A subtitle reads "AI-powered design assistant for concept sketching"
  - [ ] The header is fixed at the top and does not scroll with panel content

- [ ] As a designer, I want visual feedback for all interactive states (hover, active, disabled, loading), so that the interface feels responsive and I always know what is clickable.
  - [ ] Buttons show hover states (color shift), active states (darker color), and disabled states (gray, cursor-not-allowed)
  - [ ] Style cards show hover states (border color change) and selected states (blue border + background)
  - [ ] The generate button transitions between three visual states: ready (blue), generating (blue + spinner), and disabled (gray)
  - [ ] All transitions use CSS `transition-all` or `transition-colors` for smooth animation

- [ ] As a designer, I want the application to run as a native desktop app via Electron, so that I can launch it from my dock and use it alongside my design tools without a browser tab.
  - [ ] The Electron wrapper packages the React frontend as a native macOS application
  - [ ] The app connects to the same Express API (port 3001) and Python backend (port 8000)
  - [ ] All services (Python API, Express API, Frontend, Electron) start from a single `start-dev.sh` script

- [ ] As a designer, I want generated output to be black-and-white, rough sketch style only, so that the output is appropriate for draw-over and does not look like finished art.
  - [ ] The generation pipeline enforces: grayscale only, no color, no gradients, no textures, no photorealism
  - [ ] Output resembles thick-outline, loose-ink, pencil-quality sketches
  - [ ] Clean backgrounds with no clutter
  - [ ] Default resolution is 1024x1024
  - [ ] No typography unless explicitly requested by the designer in their prompt

- [ ] As a designer, I want generation metadata saved alongside output images, so that I can trace back how any sketch was produced and reproduce it.
  - [ ] Each generation batch saves a `metadata.json` in the timestamped output directory
  - [ ] Metadata includes: timestamp, prompt spec (intent + refined intent), reference images used, retrieval scores, style ID, generation config (num_images, resolution, model_name, seed)
  - [ ] Image filenames follow the `sketch_{index}.png` convention
  - [ ] Timestamped directories (`generated_outputs/{YYYYMMDD_HHMMSS}/`) prevent output overwriting

---

## API Contract Summary (MVP)

| Endpoint | Method | Request | Response | Purpose |
|----------|--------|---------|----------|---------|
| `/api/health` | GET | -- | `{ status, pythonBackend, version, mode }` | Health check with backend connectivity status |
| `/api/styles` | GET | -- | `{ success, styles: Style[] }` | Fetch all styles from the style library |
| `/api/generate` | POST | `{ input, styleId, numImages?, experimentalMode? }` | `{ success, data: { timestamp, sketches, generationMetadata }, error? }` | Run the full generation pipeline |
| `/api/generated/*` | GET | -- | Static image file | Serve generated sketch images |

---

## Out of Scope for MVP

The following are explicitly deferred to post-MVP iterations:

- Per-sketch individual regeneration (button exists, logs to console only)
- Per-sketch flagging and "Do Not Use" feedback loop (button exists, logs to console only)
- Multi-turn automated style refinement (proposal exists in `proposal_sketch_style.md`)
- Batch export / ZIP download of all sketches
- User authentication and multi-designer support
- Cloud deployment (currently local-only)
- Versioned generation history / session persistence across reloads
- Direct integration with design tools (Figma, Photoshop plugins)
- Mobile or tablet support
- Analytics and usage tracking
