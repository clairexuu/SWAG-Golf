# style/registry.py
import json
from pathlib import Path
from typing import List
from .types import Style

class StyleRegistry:
    """
    Manages access to the Style Library.
    Each style is treated as a separate retrieval domain to enforce style purity.
    """

    def __init__(self, root="style/style_library"):
        self.root = Path(root)
        self._cache = {}

    def get_style(self, style_id: str) -> Style:
        """
        Retrieve a style by its ID.
        Raises ValueError if style not found.
        """
        if style_id in self._cache:
            return self._cache[style_id]

        path = self.root / style_id / "style.json"
        if not path.exists():
            raise ValueError(f"Style not found: {style_id}")

        with open(path, 'r') as f:
            data = json.load(f)

        # Resolve reference image paths relative to rag/reference_images/
        rag_images_dir = Path("rag/reference_images")
        reference_images = [
            str(rag_images_dir / img) for img in data.get("reference_images", [])
        ]

        # Validate that all images exist
        missing_images = [
            img for img in reference_images if not Path(img).exists()
        ]
        if missing_images:
            raise ValueError(
                f"Style '{style_id}' references non-existent images: {missing_images}"
            )

        # Handle optional "do not use" references
        do_not_use = data.get("do_not_use")
        if do_not_use:
            do_not_use = [str(rag_images_dir / img) for img in do_not_use]

        # Parse visual_rules (required field)
        visual_rules = data["visual_rules"]  # Will raise KeyError if missing

        style = Style(
            id=style_id,
            name=data["name"],
            description=data["description"],
            visual_rules=visual_rules,
            reference_images=reference_images,
            do_not_use=do_not_use
        )

        self._cache[style_id] = style
        return style

    def list_styles(self) -> List[str]:
        """
        List all available style IDs in the registry.
        Returns empty list if style_library directory doesn't exist.
        """
        if not self.root.exists():
            return []

        styles = []
        for item in self.root.iterdir():
            if item.is_dir() and (item / "style.json").exists():
                styles.append(item.name)

        return sorted(styles)

    def get_all_styles(self) -> List[Style]:
        """
        Retrieve all styles in the registry.
        Useful for UI display of available styles.
        """
        style_ids = self.list_styles()
        return [self.get_style(style_id) for style_id in style_ids]

    def validate_style(self, style_id: str) -> bool:
        """
        Check if a style exists without loading it.
        """
        path = self.root / style_id / "style.json"
        return path.exists()