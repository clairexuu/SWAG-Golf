# style/registry.py
import json
from pathlib import Path
from typing import List
from .types import Style, VisualRules

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

        # Parse visual rules
        visual_rules_data = data.get("visual_rules", {})
        visual_rules = VisualRules(
            line_weight=visual_rules_data.get("line_weight", ""),
            looseness=visual_rules_data.get("looseness", ""),
            complexity=visual_rules_data.get("complexity", ""),
            additional_rules=visual_rules_data.get("additional_rules", {})
        )

        # Resolve reference image paths relative to style directory
        style_dir = self.root / style_id
        reference_images = [
            str(style_dir / img) for img in data.get("reference_images", [])
        ]

        # Handle optional "do not use" references
        do_not_use = data.get("do_not_use")
        if do_not_use:
            do_not_use = [str(style_dir / img) for img in do_not_use]

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