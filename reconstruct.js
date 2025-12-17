const fs = require('fs');
const path = require('path');

function reconstructProject(jsonFile, sourceDir, targetDir) {
    // Read structure JSON
    const structure = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

    // Create target directory
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Track which files were used
    const usedFiles = new Set();

    // Get all files in source directory
    const allSourceFiles = new Set();
    fs.readdirSync(sourceDir).forEach(item => {
        const itemPath = path.join(sourceDir, item);
        if (fs.statSync(itemPath).isFile() && !item.startsWith('vibe.powerapps.')) {
            allSourceFiles.add(item);
        }
    });

    function processNode(node, currentPath) {
        const nodePath = path.join(currentPath, node.name);

        if (node.type === 'folder') {
            // Create folder
            if (!fs.existsSync(nodePath)) {
                fs.mkdirSync(nodePath, { recursive: true });
            }
            console.log(`📁 Created folder: ${nodePath}`);
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
                usedFiles.add(node.name);
                console.log(`✓ Copied: ${node.name} -> ${nodePath}`);
            } else {
                console.log(`✗ Missing: ${node.name}`);
            }
        }
    }

    // Process root level items
    structure.forEach(item => processNode(item, targetDir));

    console.log(`\n✅ Project reconstructed in: ${targetDir}`);

    // Check for unused files
    const unusedFiles = [...allSourceFiles].filter(f => !usedFiles.has(f));
    if (unusedFiles.length > 0) {
        console.log(`\n⚠️  Warning: ${unusedFiles.length} file(s) were not in the JSON structure:`);
        unusedFiles.sort().forEach(unused => {
            console.log(`   - ${unused}`);
        });
    } else {
        console.log(`\n✓ All source files were successfully processed`);
    }
}

// Usage
reconstructProject(
    'DOWNLOADED_SOURCE_FILES/vibe.powerapps.dec5a315-f8d9-f011-8544-00224803d831.json',
    'DOWNLOADED_SOURCE_FILES',
    'GENERATED_SOURCE_CODE_STRUCTURE'
);
