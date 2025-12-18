#!/usr/bin/env python3
import json
import os
from pathlib import Path

# Load JSON structure
json_path = Path("DOWNLOADED_SOURCE_FILES/vibe.powerapps.latest.json")
with open(json_path, 'r') as f:
    structure = json.load(f)

# Get all downloaded files
downloads_dir = Path("DOWNLOADED_SOURCE_FILES")
downloaded_files = set()
for file in downloads_dir.iterdir():
    if file.is_file() and not file.name.startswith('vibe.powerapps') and not file.name == '.DS_Store':
        downloaded_files.add(file.name)

# Extract files from JSON structure
def extract_files_from_json(node, path=""):
    files = set()
    if isinstance(node, list):
        for item in node:
            files.update(extract_files_from_json(item, path))
    elif isinstance(node, dict):
        if node.get('type') == 'file':
            files.add(node['name'])
        elif node.get('type') == 'folder' and 'children' in node:
            new_path = os.path.join(path, node['name']) if path else node['name']
            for child in node['children']:
                files.update(extract_files_from_json(child, new_path))
    return files

json_files = extract_files_from_json(structure)

# Compare
in_downloads_not_in_json = downloaded_files - json_files
in_json_not_in_downloads = json_files - downloaded_files
in_both = downloaded_files & json_files

print("=" * 80)
print(f"📊 COMPARISON REPORT")
print("=" * 80)
print(f"\n✅ Files in both JSON and Downloads: {len(in_both)}")
print(f"📥 Files downloaded but NOT in JSON: {len(in_downloads_not_in_json)}")
print(f"📋 Files in JSON but NOT downloaded: {len(in_json_not_in_downloads)}")

if in_downloads_not_in_json:
    print(f"\n{'=' * 80}")
    print(f"📥 DOWNLOADED BUT NOT IN JSON ({len(in_downloads_not_in_json)} files):")
    print(f"{'=' * 80}")
    for filename in sorted(in_downloads_not_in_json):
        print(f"  - {filename}")

if in_json_not_in_downloads:
    print(f"\n{'=' * 80}")
    print(f"📋 IN JSON BUT NOT DOWNLOADED ({len(in_json_not_in_downloads)} files):")
    print(f"{'=' * 80}")
    for filename in sorted(in_json_not_in_downloads):
        print(f"  - {filename}")

if in_both:
    print(f"\n{'=' * 80}")
    print(f"✅ FILES IN BOTH ({len(in_both)} files):")
    print(f"{'=' * 80}")
    for filename in sorted(in_both):
        print(f"  - {filename}")
