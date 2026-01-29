# Natural Language Input → GPT Prompt Compilation

GPT-powered layer that transforms raw designer input into structured prompt specifications for image generation.

## Architecture
```
Natural Language Input + Style → PromptCompiler (GPT) → PromptSpec → Image Generation
```

## Components

### PromptSpec (prompt/schema.py)
Output structure containing compiled prompt information.

**Required Fields:**
- `intent: str` - Original input
- `refined_intent: str` - Interpreted version

**Optional Fields:**
- `negative_constraints: List[str]` - What to avoid (defaults to empty list)
- `placement: Optional[str]` - Location on garment
- `subject_matter: Optional[str]` - Main visual subject
- `mood: Optional[str]` - Emotional tone
- `perspective: Optional[str]` - Viewing angle
- `composition_notes: Optional[str]` - Layout guidance

### PromptCompiler (prompt/compiler.py)
GPT-powered compiler that interprets natural language and style context.

**Initialization:**
```python
PromptCompiler(
    system_prompt: Optional[str] = None,  # Auto-loads from system_prompt.txt
    api_key: Optional[str] = None,        # Uses OPENAI_API_KEY env var
    model: Optional[str] = None           # Uses GPT_MODEL env var (default: gpt-4)
)
```

**Configuration:**
- Set `GPT_MODEL` in `.env` (e.g., `gpt-4o`)
- Modify `TEMPERATURE` in [prompt/compiler.py](prompt/compiler.py:10) (default: 0.7)

**Method:**
- `compile(user_text: str, style) -> PromptSpec` - Compile with style object

## Usage

```python
from prompt.compiler import PromptCompiler

compiler = PromptCompiler()
spec = compiler.compile("Front chest hoodie graphic. Vintage mascot.", style)

print(spec.refined_intent)
print(spec.subject_matter)
```
