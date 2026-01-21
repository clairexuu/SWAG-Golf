# Natural Language Input + Style --> GPT Prompt Compilation

A GPT-powered prompt compilation layer that transforms raw designer natural language input and selected style context into structured prompt specifications for downstream image generation.

## Natural Language Input
Designer types freely — exactly how they think.

Example:
"Front chest hoodie graphic. Vintage mascot feel, thick ink lines, slightly goofy. Rough concept only."

No formatting. No prompt rules. No friction.


## Prompt Compilation (LLM Layer)
ChatGPT functions as a Prompt Compiler, not the artist.

Responsibilities:
- Interpret intent
- Normalize ambiguity
- Apply selected style rules
- Generate a structured, model-agnostic Prompt Specification


## Implementation

### Architecture
```
Natural Language Input + Style Context
          ↓
    PromptCompiler (GPT-4)
          ↓
      PromptSpec
          ↓
  Downstream Image Generation
```

### Components

#### 1. `PromptSpec` (prompt/schema.py)
Model-agnostic prompt specification output structure.

**Core Fields:**
- `intent`: Original designer input (preserved)
- `refined_intent`: Normalized/interpreted version
- `style_id`: Selected style identifier
- `visual_constraints`: Style-specific visual rules (dict)
- `negative_constraints`: Things to avoid (list)

**Extracted Elements:**
- `placement`: Where on garment (e.g., "front chest", "back", "sleeve")
- `subject_matter`: Main visual subject (e.g., "mascot character")
- `mood`: Emotional/aesthetic tone (e.g., "playful", "vintage")
- `technique`: Artistic technique (e.g., "thick ink lines", "screen print")
- `fidelity`: Level of finish (e.g., "rough concept", "final art")

**Technical Parameters:**
- `composition_notes`: Layout and composition guidance
- `color_guidance`: Color palette or restrictions

**Methods:**
- `to_dict()`: Convert to dictionary for downstream consumption

#### 2. `PromptCompiler` (prompt/compiler.py)
GPT-powered compilation engine.

**Initialization:**
```python
PromptCompiler(
    system_prompt: Optional[str] = None,  # Auto-loads from system_prompt.txt
    api_key: Optional[str] = None,        # Uses env var if not provided
    model: str = "gpt-4"                  # GPT model to use
)
```

**Main Method:**
```python
compile(user_text: str, style) -> PromptSpec
```
- Takes natural language + style object
- Calls GPT with system + user prompts
- Parses JSON response into PromptSpec

**Internal Methods:**
- `_load_system_prompt()`: Loads from prompt/system_prompt.txt
- `_build_compilation_request()`: Constructs user prompt with input + style context

**GPT Configuration:**
- Temperature: 0.7 (balanced creativity/consistency)
- Response format: JSON object
- Messages: system role (instructions) + user role (specific task)

#### 3. System Prompt (prompt/system_prompt.txt)
Instructions for the LLM on its role as Prompt Compiler.

**Key Directives:**
- Transform raw natural language to structured specifications
- Preserve designer's creative intent
- Don't add concepts not implied by input
- Normalize vague terms into concrete visual descriptions
- Extract placement, subject matter, mood, technique from input
- Apply style rules consistently
- Keep specifications model-agnostic

**Example transformation included in prompt:**
```
Input: "Front chest hoodie graphic. Vintage mascot feel, thick ink lines, slightly goofy. Rough concept only."

Extracts:
- Placement: front chest area of hoodie
- Style: vintage mascot illustration
- Technique: thick ink lines, hand-drawn quality
- Mood: playful, slightly goofy character
- Fidelity: concept sketch, not final art
```


## Usage Example

```python
from prompt.compiler import PromptCompiler

# Initialize (auto-loads system prompt)
compiler = PromptCompiler()

# Compile natural language
user_input = "Front chest hoodie graphic. Vintage mascot feel, thick ink lines, slightly goofy. Rough concept only."
spec = compiler.compile(user_input, selected_style)

# Access structured output
print(spec.placement)          # "front chest"
print(spec.mood)               # "playful, slightly goofy"
print(spec.technique)          # "thick ink lines"
print(spec.fidelity)           # "rough concept"

# Convert to dict for downstream
spec_dict = spec.to_dict()
```


## Dependencies
- `openai`: OpenAI Python SDK for GPT API calls
- `pathlib`: For loading system prompt file
- Python 3.7+ (for dataclasses and type hints)

