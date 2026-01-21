# Style Selection

Designer selects a specific personal style from their Style Library.

- Style selection is mandatory
- There is no sports league selector in the UI
- The selected style determines all downstream retrieval and generation behavior

## Style Library

Each designer maintains multiple discrete styles, each treated as a separate retrieval domain.

Each Style Includes:
- Style Name
- Short Description (designer-authored)
- Visual Rules (line weight, looseness, complexity)
- Curated Reference Image Set
- Optional "Do Not Use" references

## Implementation

### Data Types (`style/types.py`)

**VisualRules**
```python
@dataclass
class VisualRules:
    line_weight: str       # e.g., "thick", "thin", "variable"
    looseness: str         # e.g., "tight", "loose", "gestural"
    complexity: str        # e.g., "minimal", "moderate", "detailed"
    additional_rules: dict # Extensible for custom rules
```

**Style**
```python
@dataclass
class Style:
    id: str                      # Unique style identifier
    name: str                    # Display name
    description: str             # Designer-authored description
    visual_rules: VisualRules    # Visual characteristics
    reference_images: List[str]  # Paths to curated reference images
    do_not_use: List[str]        # Paths to excluded reference images (optional)
```

### Style Registry (`style/registry.py`)

**StyleRegistry** manages access to the Style Library with style-scoped isolation.

**Methods:**
- `get_style(style_id: str) -> Style`
  - Retrieves a style by ID
  - Caches loaded styles for performance
  - Raises `ValueError` if style not found

- `list_styles() -> List[str]`
  - Returns all available style IDs
  - Used for UI style selector population

- `get_all_styles() -> List[Style]`
  - Loads and returns all styles
  - Useful for UI display with style previews

- `validate_style(style_id: str) -> bool`
  - Checks if a style exists without loading
  - Used for validation before downstream operations

**Directory Structure:**
```
style/style_library/
└── {style_id}/
    ├── style.json           # Style metadata
    └── references/          # Reference images (optional subdirectory)
```

**style.json Format:**
```json
{
  "name": "Vintage Mascot",
  "description": "Bold, retro sports mascot style",
  "visual_rules": {
    "line_weight": "thick",
    "looseness": "loose",
    "complexity": "moderate",
    "additional_rules": {}
  },
  "reference_images": [
    "references/img1.png",
    "references/img2.png"
  ],
  "do_not_use": [
    "references/excluded1.png"
  ]
}
```

## Style Enforcement

- Retrieval is strictly style-scoped
- The system never blends styles implicitly
- Style purity is preserved by design
- Each style maintains isolated reference image sets
- Cache ensures consistent style retrieval throughout session

