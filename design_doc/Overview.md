# Swag Concept Sketch Agent

Swag’s licensed design pipeline is bottlenecked by manual concept sketching, not creative ideation or final execution. Senior designers already know what they want to make — the friction lies in translating ideas into early-stage visual concepts fast enough to support approvals, iteration, and volume.

The Swag Concept Sketch Agent is an internal AI-powered design assistant that converts a designer’s natural language ideas into rough, draw-over-ready concept sketches using a retrieval-augmented generation (RAG) system built on a designer-provided reference image database.

The system is explicitly designed to:
- Preserve designer control
- Enforce exact stylistic fidelity
- Optimize for speed and concept throughput, not final polish

## Backend Workflow
1. Raw User Input
2. User make Style Selection from Style Library, used for downstream retrieval and generation
3. Prompt Compilation with GPT layer
4. RAG from image database, hard-filter by Style then retrieve top-K by semantic similarity
5. Image Generation: Prompt Specification (step 3) and Retrieved Reference Images (step 4) are sent to Nano Banana (model-agnostic via adapter layer)
6. Output & Iteration: User can download, draw over, or provide feedback on the output image

## Frontend
Web app with the following Layout
- Left Panel
    - Style Selector (primary control)
    - Optional experimental toggle
- Center Panel
    - Large chat input
    - Comfortable typing experience
- Right Panel
    - Sketch grid
    - Quick actions (download, regenerate, flag)

## Technical Architecture
Frontend: Web app
Backend: Prompt orchestration + image RAG service
LLM: ChatGPT as Prompt Compiler
Image Model: Nano Banana (model-agnostic via adapter layer)
Storage: Reference image DB + embeddings
Adapter Layer: Converts Prompt Spec → model-specific format

## Phase 1 — MVP
- Single designer
- 3–5 styles
- RAG-based reference retrieval
- Sketch-only generation

## Folder Structure

### CLI version

```text
├── main.py                 # CLI entry
│
├── pipeline.py             # orchestration
│
├── prompt/
│   ├── compiler.py         # GPT prompt compiler
│   ├── schema.py           # PromptSpec dataclass
│   └── system_prompt.txt
│
├── style/
│   ├── registry.py         # StyleRegistry
│   ├── types.py
│   └── styles/
│       └── designerA/
│           └── vintage_mascot/
│               └── style.json
│
├── rag/
│   └── (later)
│
└── generate/
    └── nano_banana.py      # (later)
```

### Full structure expected 

```text
concept_sketch_agent/
├── intelligence/                    # Python
│   ├── app/
│   │   └── UI/UX
│   │
│   ├── core/
│   │   ├── prompt/
│   │   ├── style/
│   │   ├── rag/
│   │   ├── generate/
│   │   ├── guardrails/
│   │   └── feedback/
│   │
│   ├── services/
│   │   └── pipeline.py             
│
├── control/                         # TypeScript：API, UI
│   ├── api/
│   │   ├── server.ts                # HTTP API (wrap Python)
│   │   └── routes/
│   │       └── generate.ts
│   │
│   ├── pipeline/
│   │   └── orchestrator.ts          # TS orchestration
│   │
│   ├── frontend/                    # Web app
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── electron/
│   │   ├── main.ts                  # Electron main process
│   │   └── preload.ts
│   │
│   └── shared/
│       └── schema/                  # JSON Schema (single source of truth)
│           └── prompt_spec.json
│
└── README.md
```