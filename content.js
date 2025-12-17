// content.js - Extract code and folder structure from vibe.powerapps.com

// Extract code from Monaco Editor
function extractCode() {
  const monacoLines = document.querySelector('.view-lines');
  if (monacoLines) {
    const lines = Array.from(monacoLines.querySelectorAll('.view-line'));
    return lines.map(line => line.textContent).join('\n');
  }
  return null;
}

// Extract filename from UI - look for filename above Monaco editor
function extractFilename() {
  // Strategy 1: Find Monaco editor and look for filename above it
  const monacoEditor = document.querySelector('.monaco-editor');

  if (monacoEditor) {
    const editorRect = monacoEditor.getBoundingClientRect();
    const editorTop = editorRect.top;

    // Look for span elements that are just above the editor (within 200px above)
    const allSpans = document.querySelectorAll('span');
    let closestFilename = null;
    let closestDistance = Infinity;

    for (const span of allSpans) {
      if (span.children.length > 0) continue;

      const text = span.textContent?.trim();
      if (!text || text.length > 100) continue;

      const match = text.match(/^([\w\-_\.]+\.(tsx|ts|jsx|js|css|html|json|md|yml|yaml|xml|txt|svg))$/i);
      if (match) {
        const spanRect = span.getBoundingClientRect();
        const distance = editorTop - spanRect.bottom;

        // Only consider elements above the editor (within 200px)
        if (distance > 0 && distance < 200 && distance < closestDistance) {
          closestDistance = distance;
          closestFilename = match[1];
        }
      }
    }

    if (closestFilename) {
      console.log('Found filename above editor:', closestFilename, 'distance:', closestDistance);
      return closestFilename;
    }
  }

  // Strategy 2: Fallback - look in top of page
  const candidates = [];
  const elements = document.querySelectorAll('span');

  for (const el of elements) {
    if (el.children.length > 0) continue;

    const text = el.textContent?.trim();
    if (!text || text.length > 100) continue;

    const match = text.match(/^([\w\-_\.]+\.(tsx|ts|jsx|js|css|html|json|md|yml|yaml|xml|txt|svg))$/i);
    if (match) {
      const rect = el.getBoundingClientRect();
      if (rect.y > 0 && rect.y < 150 && rect.width > 0) {
        candidates.push({
          filename: match[1],
          y: rect.y,
          x: rect.x
        });
      }
    }
  }

  console.log('Found filename candidates:', candidates);

  if (candidates.length === 0) {
    console.log('No candidates found, using default');
    return 'download.txt';
  }

  candidates.sort((a, b) => a.y - b.y);

  console.log('Selected filename:', candidates[0].filename);
  return candidates[0].filename;
}

// Extract folder structure from file tree sidebar
function getFolderStructure() {
  const treeItems = Array.from(document.querySelectorAll('.fui-TreeItem'));

  if (treeItems.length === 0) {
    return [];
  }

  const root = { name: "root", children: [], type: "folder" };
  const stack = [{ level: 0, node: root }];

  treeItems.forEach(item => {
    const nameElement = item.querySelector('.fui-TreeItemLayout__main') || item;
    const name = nameElement.textContent.trim();
    const level = parseInt(item.getAttribute('aria-level'), 10);
    const isFolder = item.getAttribute('aria-expanded') !== null;

    const newNode = { name, type: isFolder ? "folder" : "file" };
    if (isFolder) newNode.children = [];

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    parent.children.push(newNode);

    if (isFolder) {
      stack.push({ level, node: newNode });
    }
  });

  return root.children;
}

// Extract plan ID from URL
function getPlanId() {
  const match = window.location.pathname.match(/\/plan\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg.action === 'getSource') {
    const content = extractCode();
    const filename = extractFilename();
    respond({ content, filename });
    return true;
  }

  if (msg.action === 'getTree') {
    const structure = getFolderStructure();
    const planId = getPlanId();
    respond({ structure, planId });
    return true;
  }
});
