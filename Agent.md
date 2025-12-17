# Agent Instructions: Reconstruct Project Structure

This file contains instructions for an AI agent (like Claude) to reconstruct a project's folder structure from downloaded source files.

## Context

When you use the Vibe PowerApps Source Code Downloader extension, you will have:
1. Individual source code files downloaded to a folder (e.g., `DownloadedSourceFiles/`)
2. A JSON file with the folder structure (e.g., `vibe.powerapps.[plan-id].json`)

## Task

Reconstruct the complete project folder structure by organizing the downloaded files according to the folder structure JSON.

## Input Files

1. **Folder structure JSON**: Contains the hierarchical folder/file structure
   - Format: `vibe.powerapps.[plan-id].json`
   - Example structure:
   ```json
   [
     {
       "name": "src",
       "type": "folder",
       "children": [
         {
           "name": "components",
           "type": "folder",
           "children": [
             {
               "name": "Button.tsx",
               "type": "file"
             }
           ]
         }
       ]
     }
   ]
   ```

2. **Downloaded files folder**: Directory containing all downloaded source files
   - Location: `DOWNLOADED_SOURCE_FILES/` (or user-specified folder)
   - Files are flat (no folder structure yet)

## Instructions for AI Agent

### Step 1: Read the folder structure JSON
```
Read the vibe.powerapps.[plan-id].json file to understand the target folder structure.
```

### Step 2: Create the folder hierarchy
```
Based on the JSON structure, create all necessary folders and subfolders.
For each item in the JSON:
- If type is "folder", create a directory
- Recursively process all children
```

### Step 3: Move files to correct locations
```
For each file in the DownloadedSourceFiles folder:
1. Find its corresponding location in the JSON structure
2. Move (or copy) the file to the correct folder path
3. Verify the file was moved successfully
```

### Step 4: Verify completeness
```
- Check that all folders from JSON were created
- Check that all files were moved
- Report any missing or unmatched files
```

## Example Usage

### Prompt for AI Agent:

```
I have downloaded source files from Vibe PowerApps using the Chrome extension.

Files are located in: ./DOWNLOADED_SOURCE_FILES/
Folder structure JSON: ./DOWNLOADED_SOURCE_FILES/vibe.powerapps.abc123.json

Please reconstruct the project structure by:
1. Reading the folder structure from the JSON file
2. Creating all necessary folders
3. Moving each file from DOWNLOADED_SOURCE_FILES to its correct location based on the JSON structure
4. Reporting the results

Target output directory: ./GENERATED_SOURCE_CODE_STRUCTURE/
```

## Python Script (Ready to Use)

A ready-to-use Python script is included: `reconstruct.py`

Run it with:
```bash
python3 reconstruct.py
```

Or use this template for custom paths:

```python
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

    def process_node(node, current_path):
        """Recursively process JSON structure nodes."""
        node_path = os.path.join(current_path, node['name'])

        if node['type'] == 'folder':
            # Create folder
            os.makedirs(node_path, exist_ok=True)
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
                print(f"✓ Copied: {node['name']} -> {node_path}")
            else:
                print(f"✗ Missing: {node['name']}")

    # Process root level items
    for item in structure:
        process_node(item, target_dir)

    print(f"\nProject reconstructed in: {target_dir}")

# Usage
reconstruct_project(
    json_file='DOWNLOADED_SOURCE_FILES/vibe.powerapps.abc123.json',
    source_dir='DOWNLOADED_SOURCE_FILES',
    target_dir='GENERATED_SOURCE_CODE_STRUCTURE'
)
```

## Node.js Script (Ready to Use)

A ready-to-use Node.js script is included: `reconstruct.js`

Run it with:
```bash
node reconstruct.js
```

Or use this template for custom paths:

```javascript
const fs = require('fs');
const path = require('path');

function reconstructProject(jsonFile, sourceDir, targetDir) {
    // Read structure JSON
    const structure = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

    // Create target directory
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    function processNode(node, currentPath) {
        const nodePath = path.join(currentPath, node.name);

        if (node.type === 'folder') {
            // Create folder
            if (!fs.existsSync(nodePath)) {
                fs.mkdirSync(nodePath, { recursive: true });
            }
            // Process children
            if (node.children) {
                node.children.forEach(child => processNode(child, nodePath));
            }
        } else if (node.type === 'file') {
            // Find file in source directory
            const sourceFile = path.join(sourceDir, node.name);
            if (fs.existsSync(sourceFile)) {
                // Copy file to target location
                fs.copyFileSync(sourceFile, nodePath);
                console.log(`✓ Copied: ${node.name} -> ${nodePath}`);
            } else {
                console.log(`✗ Missing: ${node.name}`);
            }
        }
    }

    // Process root level items
    structure.forEach(item => processNode(item, targetDir));

    console.log(`\nProject reconstructed in: ${targetDir}`);
}

// Usage
reconstructProject(
    'DOWNLOADED_SOURCE_FILES/vibe.powerapps.abc123.json',
    'DOWNLOADED_SOURCE_FILES',
    'GENERATED_SOURCE_CODE_STRUCTURE'
);
```

## Features

### Automatic Validation
Both Python and Node.js scripts include automatic validation:
- **Missing Files Detection**: Reports files referenced in JSON but not found in source directory
- **Unused Files Detection**: Warns about files in source directory that are not in JSON structure (may indicate incomplete download or JSON mismatch)
- **Progress Reporting**: Shows each folder created and file copied with status indicators

### Output Symbols
- `📁` Folder created
- `✓` File successfully copied
- `✗` File missing from source directory
- `⚠️` Warning about unused files

## Troubleshooting

### Duplicate filenames
If multiple files have the same name (e.g., `index.tsx` in different folders):
- The JSON structure will place each in its correct folder
- Make sure to use the full path from JSON, not just the filename

### Missing files
If files are missing from the source directory:
- Check if they were successfully downloaded
- Check the browser's download folder
- Re-download missing files using the extension

### Unused files warning
If you see warnings about unused files:
- These files exist in your source folder but are not in the JSON structure
- This may indicate:
  - The JSON was downloaded before all files were downloaded
  - Files were manually added to the source folder
  - Files are from a different project
- Solution: Re-download the folder structure JSON after downloading all files

### Special characters in filenames
If filenames contain special characters:
- The extension preserves the original filename
- Ensure your filesystem supports those characters
- On Windows, some characters may need to be replaced

## Expected Result

After running the reconstruction:
```
GENERATED_SOURCE_CODE_STRUCTURE/
├── docs/
│   ├── app-plan.md
│   └── design.md
├── src/
│   ├── components/
│   │   ├── system/
│   │   │   └── error-boundary.tsx
│   │   └── ui/
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       └── alert.tsx
│   ├── generated/
│   │   ├── hooks/
│   │   ├── models/
│   │   └── services/
│   ├── hooks/
│   ├── lib/
│   └── pages/
└── power.config.json
```

## Notes

- This process works best with AI coding assistants like Claude, ChatGPT, or GitHub Copilot
- The reconstruction is deterministic - same inputs always produce same output
- Large projects (1000+ files) may take a few minutes to process
- Always verify critical files were moved correctly before deleting source files
