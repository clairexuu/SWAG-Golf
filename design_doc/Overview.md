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
7. Feedback & Learning: User feedback improves future generations via in-session context (short-term) and persistent GPT-summarized style learning (long-term)

## Technical Architecture
Frontend: Web app
Backend: Prompt orchestration + image RAG service
LLM: ChatGPT as Prompt Compiler
Image Model: Nano Banana (model-agnostic via adapter layer)
Storage: Reference image DB + embeddings
Adapter Layer: Converts Prompt Spec → model-specific format

## Directory
User Prompt Compilation --> @design_doc/Input_to_Prompt.md
Style Selection --> @design_doc/Style_Selection.md
RAG --> @design_doc/RAG.md
Image Generation --> @design_doc/Image_Generation.md
Frontend --> @design_doc/Frontend.md
Feedback & Learning Loop --> @design_doc/Feedback_Learning_Loop.md

To Step --> @design_doc/Backend_SetUp.md
To Start Dev --> @design_doc/Frontend.md
Issue and Progress Tracker --> @design_doc/Progress.md

## Folder Structure

```text
├── control/                # Frontend 
│
├── prompt/                 # User Prompt Compilation
│
├── style/                  # Style Selection
│
├── rag/                    # RAG
│
└── generate/               # Image Generation 
│
└── generated_outputs/      # Store outputs
│
└── feedback/               # Feedback & Learning Loop
```