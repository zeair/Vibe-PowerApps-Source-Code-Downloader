import json
import os
import shutil
from pathlib import Path

def reconstruct_project(json_file, source_dir, target_dir):
    """
    Reconstruct project structure from JSON and flat file directory.

    Args:
        json_file: Path to vibe.powerapps.[plan-id].json
        source_dir: Directory with downloaded files (flat structure)
        target_dir: Directory where project will be reconstructed
    """
    # Read structure JSON
    with open(json_file, 'r') as f:
        structure = json.load(f)

    # Create target directory
    os.makedirs(target_dir, exist_ok=True)

    # Track which files were used
    used_files = set()

    # Get all files in source directory
    all_source_files = set()
    for item in os.listdir(source_dir):
        item_path = os.path.join(source_dir, item)
        if os.path.isfile(item_path) and not item.startswith('vibe.powerapps.'):
            all_source_files.add(item)

    def process_node(node, current_path):
        """Recursively process JSON structure nodes."""
        node_path = os.path.join(current_path, node['name'])

        if node['type'] == 'folder':
            # Create folder
            os.makedirs(node_path, exist_ok=True)
            print(f"📁 Created folder: {node_path}")
            # Process children
            if 'children' in node:
                for child in node['children']:
                    process_node(child, node_path)

        elif node['type'] == 'file':
            # Find file in source directory
            source_file = os.path.join(source_dir, node['name'])
            if os.path.exists(source_file):
                # Copy file to target location
                shutil.copy2(source_file, node_path)
                used_files.add(node['name'])
                print(f"✓ Copied: {node['name']} -> {node_path}")
            else:
                print(f"✗ Missing: {node['name']}")

    # Process root level items
    for item in structure:
        process_node(item, target_dir)

    print(f"\n✅ Project reconstructed in: {target_dir}")

    # Check for unused files
    unused_files = all_source_files - used_files
    if unused_files:
        print(f"\n⚠️  Warning: {len(unused_files)} file(s) were not in the JSON structure:")
        for unused in sorted(unused_files):
            print(f"   - {unused}")
    else:
        print(f"\n✓ All source files were successfully processed")

if __name__ == '__main__':
    # Usage
    reconstruct_project(
        json_file='DOWNLOADED_SOURCE_FILES/vibe.powerapps.dec5a315-f8d9-f011-8544-00224803d831.json',
        source_dir='DOWNLOADED_SOURCE_FILES',
        target_dir='GENERATED_SOURCE_CODE_STRUCTURE'
    )
