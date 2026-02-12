#!/usr/bin/env python3
"""
Style Management Script

This script manages styles in the SWAG Golf pipeline:
1. Create new styles with reference images
2. Add images to existing styles

Usage:
    # Create new style
    python style/init_style.py create \\
        --name "Vintage Sketch" \\
        --description "Hand-drawn vintage illustration style" \\
        --images /path/to/images \\
        --style-id vintage \\
        --visual-rules /path/to/custom_rules.json OR '{"line_weight": "thin", "looseness": "tight", "complexity": "simple"}'

    # Add images to existing style
    python style/init_style.py add-images \\
        --style-id vintage \\
        --images /path/to/more/images
"""

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple

from uuid import uuid4

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from style.registry import StyleRegistry


# Default visual rules
DEFAULT_VISUAL_RULES = {
    "line_weight": "varied",
    "looseness": "medium",
    "complexity": "medium",
    "additional_rules": {}
}

# Supported image formats
SUPPORTED_FORMATS = {'.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'}


def validate_image_folder(images_folder: Path) -> List[Path]:
    """
    Validate image folder and return list of valid image files.
    """
    if not images_folder.exists():
        raise ValueError(f"Image folder does not exist: {images_folder}")

    if not images_folder.is_dir():
        raise ValueError(f"Image path is not a directory: {images_folder}")

    image_files = [
        f for f in images_folder.iterdir()
        if f.is_file() and f.suffix in SUPPORTED_FORMATS
    ]

    if not image_files:
        raise ValueError(
            f"No valid images found in {images_folder}. "
            f"Supported formats: {', '.join(SUPPORTED_FORMATS)}"
        )

    return image_files


def compute_image_hash(file_path: Path) -> str:
    """Compute SHA-256 hash of a file's content."""
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def move_images(
    image_files: List[Path],
    rag_images_dir: Path = Path("rag/reference_images")
) -> List[str]:
    """
    Move images to rag/reference_images/ with UUID-based filenames.
    """
    rag_images_dir.mkdir(parents=True, exist_ok=True)

    moved_files = []
    new_filenames = []

    try:
        for image_file in image_files:
            # Generate UUID-based filename
            new_filename = f"{uuid4()}{image_file.suffix.lower()}"
            new_path = rag_images_dir / new_filename

            # Ensure no collision (extremely unlikely with UUIDs)
            while new_path.exists():
                new_filename = f"{uuid4()}{image_file.suffix.lower()}"
                new_path = rag_images_dir / new_filename

            # Move the file
            shutil.move(str(image_file), str(new_path))

            moved_files.append((image_file, new_path))
            new_filenames.append(new_filename)

        return new_filenames

    except Exception as e:
        # Rollback: move files back to original location
        print(f"Error moving images: {e}")
        print("Rolling back changes...")

        for original_path, new_path in moved_files:
            try:
                if new_path.exists():
                    shutil.move(str(new_path), str(original_path))
            except Exception as rollback_error:
                print(f"Rollback failed for {new_path}: {rollback_error}")

        raise RuntimeError(f"Failed to move images: {e}")


def update_style_json(
    style_id: str,
    updates: Dict[str, Any],
    style_library_root: Path = Path("style/style_library")
) -> None:
    """
    Update fields in an existing style.json.

    Args:
        style_id: Style identifier
        updates: Dictionary of fields to update (e.g., {"reference_images": [...], "do_not_use": [...]})
        style_library_root: Root directory for style library
    """
    style_json_path = style_library_root / style_id / "style.json"

    if not style_json_path.exists():
        raise ValueError(f"Style '{style_id}' does not exist at {style_json_path}")

    try:
        # Read existing style.json
        with open(style_json_path, 'r', encoding='utf-8') as f:
            style_data = json.load(f)

        # Update specified fields
        for key, value in updates.items():
            style_data[key] = value

        # Write back
        with open(style_json_path, 'w', encoding='utf-8') as f:
            json.dump(style_data, f, indent=2, ensure_ascii=False)

        # Validate with StyleRegistry
        registry = StyleRegistry()
        style = registry.get_style(style_id)
        print(f"✓ Style validation passed: loaded '{style.name}' with {len(style.reference_images)} images")

    except Exception as e:
        raise RuntimeError(f"Failed to update style.json: {e}")


def create_new_style(
    style_id: str,
    name: str,
    description: str,
    image_files: List[Path],
    visual_rules: Dict[str, Any],
    style_library_root: Path = Path("style/style_library")
) -> Path:
    """
    Create a new style with images.
    """
    # Check that style_id doesn't already exist
    style_dir = style_library_root / style_id
    if style_dir.exists():
        raise ValueError(
            f"Style '{style_id}' already exists at {style_dir}. "
            "Choose a different style-id or delete the existing style."
        )

    try:
        # Create style directory
        style_dir.mkdir(parents=True, exist_ok=True)

        # Move images and get filenames
        new_filenames = move_images(image_files)

        # Create style.json content
        style_data = {
            "name": name,
            "description": description,
            "visual_rules": visual_rules,
            "reference_images": new_filenames,
            "do_not_use": []
        }

        # Write style.json
        style_json_path = style_dir / "style.json"
        with open(style_json_path, 'w', encoding='utf-8') as f:
            json.dump(style_data, f, indent=2, ensure_ascii=False)

        return style_json_path

    except Exception as e:
        raise RuntimeError(f"Failed to create style: {e}")


def add_images_to_existing_style(
    style_id: str,
    image_files: List[Path],
    style_library_root: Path = Path("style/style_library"),
    rag_images_dir: Path = Path("rag/reference_images")
) -> Tuple[int, int]:
    """
    Add images to an existing style, skipping duplicates by content hash.

    Returns:
        Tuple of (added_count, skipped_count)
    """
    style_json_path = style_library_root / style_id / "style.json"

    if not style_json_path.exists():
        raise ValueError(f"Style '{style_id}' does not exist at {style_json_path}")

    try:
        # Read existing style.json
        with open(style_json_path, 'r', encoding='utf-8') as f:
            style_data = json.load(f)

        current_images = style_data.get("reference_images", [])

        # Build hash set of existing reference images
        existing_hashes = set()
        for img_filename in current_images:
            img_path = rag_images_dir / img_filename
            if img_path.exists():
                existing_hashes.add(compute_image_hash(img_path))

        # Filter out duplicates
        unique_files = []
        skipped = 0
        for image_file in image_files:
            h = compute_image_hash(image_file)
            if h in existing_hashes:
                skipped += 1
            else:
                existing_hashes.add(h)  # prevent intra-batch duplicates
                unique_files.append(image_file)

        if not unique_files:
            return 0, skipped

        # Move only unique images
        new_filenames = move_images(unique_files, rag_images_dir)

        # Append to reference_images
        updated_images = current_images + new_filenames

        # Update style.json
        update_style_json(style_id, {"reference_images": updated_images}, style_library_root)

        return len(new_filenames), skipped

    except Exception as e:
        raise RuntimeError(f"Failed to add images to style: {e}")


def delete_style(
    style_id: str,
    style_library_root: Path = Path("style/style_library"),
    rag_images_dir: Path = Path("rag/reference_images")
) -> int:
    """
    Delete a style and all its associated reference images.

    Args:
        style_id: Style identifier to delete
        style_library_root: Root directory for style library
        rag_images_dir: Directory containing reference images

    Returns:
        Number of reference images deleted

    Raises:
        ValueError: If style doesn't exist
    """
    style_dir = style_library_root / style_id
    style_json_path = style_dir / "style.json"

    if not style_json_path.exists():
        raise ValueError(f"Style '{style_id}' does not exist at {style_json_path}")

    # Read style.json to get reference image filenames
    with open(style_json_path, 'r', encoding='utf-8') as f:
        style_data = json.load(f)

    reference_images = style_data.get("reference_images", [])

    # Delete reference images from rag/reference_images/
    deleted_count = 0
    for image_filename in reference_images:
        image_path = rag_images_dir / image_filename
        if image_path.exists():
            image_path.unlink()
            deleted_count += 1

    # Delete the style directory (style.json and any other files)
    shutil.rmtree(str(style_dir))

    return deleted_count


def delete_images_from_style(
    style_id: str,
    filenames: List[str],
    style_library_root: Path = Path("style/style_library"),
    rag_images_dir: Path = Path("rag/reference_images")
) -> int:
    """
    Delete specific images from a style's reference_images list and from disk.

    Returns:
        Number of images deleted from disk.

    Raises:
        ValueError: If style doesn't exist.
    """
    style_json_path = style_library_root / style_id / "style.json"

    if not style_json_path.exists():
        raise ValueError(f"Style '{style_id}' does not exist at {style_json_path}")

    with open(style_json_path, 'r', encoding='utf-8') as f:
        style_data = json.load(f)

    current_images = style_data.get("reference_images", [])
    filenames_set = set(filenames)

    keep = [img for img in current_images if img not in filenames_set]
    to_delete = [img for img in current_images if img in filenames_set]

    deleted_count = 0
    for image_filename in to_delete:
        image_path = rag_images_dir / image_filename
        if image_path.exists():
            image_path.unlink()
            deleted_count += 1

    update_style_json(style_id, {"reference_images": keep}, style_library_root)

    return deleted_count


def validate_style(style_id: str) -> None:
    """
    Validate that a style can be loaded by StyleRegistry.
    """
    try:
        registry = StyleRegistry()
        style = registry.get_style(style_id)
        print(f"✓ Style validation passed: loaded '{style.name}' with {len(style.reference_images)} images")
    except Exception as e:
        raise RuntimeError(f"Style validation failed: {e}")


def slugify(text: str) -> str:
    """
    Convert text to a valid style_id slug.
    """
    slug = text.lower().strip()
    slug = slug.replace(' ', '_')
    slug = ''.join(c for c in slug if c.isalnum() or c in ('_', '-'))
    return slug


# Command handlers

def parse_visual_rules(visual_rules_arg: str) -> Dict[str, Any]:
    """
    Parse visual rules from either JSON string or file path.
    """
    # Check if it's a file path
    visual_rules_path = Path(visual_rules_arg)
    if visual_rules_path.exists() and visual_rules_path.is_file():
        try:
            with open(visual_rules_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Failed to parse visual rules file {visual_rules_path}: {e}")

    # Otherwise, treat as JSON string
    try:
        return json.loads(visual_rules_arg)
    except Exception as e:
        raise ValueError(f"Failed to parse visual rules JSON string: {e}")


def handle_create(args):
    """Handle the 'create' subcommand."""
    style_id = args.style_id or slugify(args.name)

    # Parse visual rules from string or file
    if args.visual_rules:
        visual_rules = parse_visual_rules(args.visual_rules)
    else:
        visual_rules = DEFAULT_VISUAL_RULES

    try:
        print(f"Creating style '{args.name}' (ID: {style_id})...")

        # Validate images
        image_files = validate_image_folder(args.images)
        print(f"✓ Validated {len(image_files)} images in source folder")

        # Create new style (this will create the directory)
        style_json_path = create_new_style(
            style_id,
            args.name,
            args.description,
            image_files,
            visual_rules
        )
        print(f"✓ Created style directory: style/style_library/{style_id}")
        print(f"✓ Moved {len(image_files)} images to rag/reference_images/ (renamed with UUIDs)")
        print(f"✓ Created {style_json_path} with {len(image_files)} reference images")

        # Validate
        validate_style(style_id)

        # Success
        print(f"\n✅ Successfully created style '{args.name}' (ID: {style_id})")
        print(f"   Reference images: {len(image_files)} images")

    except (ValueError, RuntimeError) as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


def handle_add_images(args):
    """Handle the 'add-images' subcommand."""
    try:
        print(f"Adding images to style '{args.style_id}'...")

        # Validate images
        image_files = validate_image_folder(args.images)
        print(f"✓ Validated {len(image_files)} new images")

        # Check style exists and get current count
        style_json_path = Path("style/style_library") / args.style_id / "style.json"
        if not style_json_path.exists():
            raise ValueError(f"Style '{args.style_id}' does not exist")

        with open(style_json_path, 'r') as f:
            style_data = json.load(f)
            current_count = len(style_data.get("reference_images", []))

        print(f"✓ Style '{args.style_id}' exists (currently has {current_count} images)")

        # Add images
        added_count, skipped_count = add_images_to_existing_style(args.style_id, image_files)
        print(f"✓ Moved {added_count} images to rag/reference_images/ (renamed with UUIDs)")
        if skipped_count:
            print(f"✓ Skipped {skipped_count} duplicate image(s)")
        print(f"✓ Updated style.json (now has {current_count + added_count} reference images)")

        # Success
        print(f"\n✅ Successfully added {added_count} images to style '{args.style_id}'")
        print(f"   Total reference images: {current_count + added_count}")

    except (ValueError, RuntimeError) as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


def handle_mark_exclude(args):
    """Handle the 'mark-exclude' subcommand."""
    try:
        print(f"Marking images as do_not_use for style '{args.style_id}'...")
        mark_do_not_use_images(args.images, args.style_id)
    except NotImplementedError as e:
        print(f"\n⚠ {e}", file=sys.stderr)
        sys.exit(1)
    except (ValueError, RuntimeError) as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Manage styles for SWAG Golf pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', required=True, help='Available commands')

    # Subcommand: create
    create_parser = subparsers.add_parser(
        'create',
        help='Create a new style',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  python style/init_style.py create \\
    --name "Vintage Sketch" \\
    --description "Hand-drawn vintage illustration style" \\
    --images /path/to/images \\
    --style-id vintage
        """
    )
    create_parser.add_argument('--name', required=True, help='Display name for the style')
    create_parser.add_argument('--description', required=True, help='Description of the style')
    create_parser.add_argument('--images', required=True, type=Path, help='Path to folder containing reference images')
    create_parser.add_argument('--style-id', help='Unique identifier for the style (auto-generated from name if not provided)')
    create_parser.add_argument('--visual-rules', type=str, help='Visual rules as JSON string or path to JSON file (uses defaults if not provided)')

    # Subcommand: add-images
    add_parser = subparsers.add_parser(
        'add-images',
        help='Add images to an existing style',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  python style/init_style.py add-images \\
    --style-id vintage \\
    --images /path/to/more/images
        """
    )
    add_parser.add_argument('--style-id', required=True, help='Unique identifier for the existing style')
    add_parser.add_argument('--images', required=True, type=Path, help='Path to folder containing new reference images')

    # Subcommand: mark-exclude (TODO)
    exclude_parser = subparsers.add_parser(
        'mark-exclude',
        help='Mark images as do_not_use (TODO - not yet implemented)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  python style/init_style.py mark-exclude \\
    --style-id vintage \\
    --images img1.png img2.png
        """
    )
    exclude_parser.add_argument('--style-id', required=True, help='Unique identifier for the style')
    exclude_parser.add_argument('--images', nargs='+', required=True, help='List of image filenames to mark as do_not_use')

    args = parser.parse_args()

    # Route to appropriate handler
    try:
        if args.command == 'create':
            handle_create(args)
        elif args.command == 'add-images':
            handle_add_images(args)
        elif args.command == 'mark-exclude':
            handle_mark_exclude(args)
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
