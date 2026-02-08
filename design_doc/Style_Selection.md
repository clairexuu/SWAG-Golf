# Style Selection

Designer selects a specific personal style from their Style Library.

- Style selection is mandatory
- Selected style determines all downstream retrieval and generation behavior
- Each style is a separate retrieval domain

## Style Library

Each designer maintains multiple discrete styles with isolated reference image sets.

Each Style Includes:
- Style Name
- Description (designer-authored)
- Visual Rules (line weight, looseness, complexity)
- Curated Reference Image Set
- Optional "Do Not Use" references

## Implementation

### Data Types (`style/types.py`)

**Style**
```python
@dataclass
class Style:
    id: str                           # Unique style identifier
    name: str                         # Display name
    description: str                  # Designer-authored description
    visual_rules: Dict[str, Any]      # Visual constraints (line_weight, looseness, complexity)
    reference_images: List[str]       # Paths to curated reference images
    do_not_use: Optional[List[str]]   # Paths to excluded reference images (optional)
```

### Style Registry (`style/registry.py`)

**StyleRegistry** manages access to the Style Library.

**Methods:**
- `get_style(style_id)` - Retrieve a style by ID, raises ValueError if not found
- `list_styles()` - List all available style IDs
- `get_all_styles()` - Retrieve all styles
- `validate_style(style_id)` - Check if a style exists without loading it
- `delete_style(style_id)` - Evict a style from cache before deletion

### Style Management (`style/init_style.py`)

Command-line tool and API-callable functions for managing styles in the style library:
- Create new style (name required; description, visual rules, and reference images optional — `style_id` auto-generated from name via `slugify()`, visual rules default to `DEFAULT_VISUAL_RULES` when omitted, embeddings built automatically when images are provided). Frontend supports selecting a folder or individual image files as reference images.
- Add images to existing style (with SHA-256 content-hash duplicate detection — skips images already present in the style)
- Delete style (removes style directory, all associated reference images from `rag/reference_images/`, and embedding cache from `rag/cache/`)

Moves images to `rag/reference_images/` with UUID-based filenames on create/add. On create/add, embeddings are automatically rebuilt for the style. On delete, removes the UUID-named images listed in the style's `reference_images`.

### Directory Structure

```
style/style_library/
└── {style_id}/
    └── style.json           # Style metadata

rag/reference_images/        # Shared reference images (UUID-named)
├── a7f3d2e1-4b5c-6d7e.png
├── e8c00838-0a3c-41e9.png
└── ...
```

### style.json Format

```json
{
  "name": "Vintage Mascot",
  "description": "Bold, retro sports mascot style",
  "visual_rules": {
    "line_weight": "varied",
    "looseness": "medium",
    "complexity": "medium",
    "additional_rules": {}
  },
  "reference_images": [
    "a7f3d2e1-4b5c-6d7e.png",
    "e8c00838-0a3c-41e9.png"
  ],
  "do_not_use": []
}
```

## Style Enforcement

- Retrieval is strictly style-scoped
- System never blends styles implicitly
- Each style maintains isolated reference image sets
- Style purity preserved by design