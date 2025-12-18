// content.js - Extract code and folder structure from vibe.powerapps.com

// Extract code from Monaco Editor by scrolling through it
async function extractCodeByScrolling() {
  try {
    console.log('[Vibe Extension] Starting scroll-based extraction...');

    const scrollContainer = document.querySelector('.monaco-scrollable-element');
    const viewLines = document.querySelector('.view-lines');

    if (!scrollContainer || !viewLines) {
      console.error('[Vibe Extension] Could not find Monaco scrollable container or view-lines');
      return null;
    }

    // Store lines by their top position to avoid duplicates
    const lines = new Map();
    const lineHeight = 18;
    const viewportHeight = scrollContainer.clientHeight;

    console.log('[Vibe Extension] Starting scrape... this will take a few seconds.');
    console.log('[Vibe Extension] Viewport height:', viewportHeight);

    // Save original scroll position
    const originalScrollTop = scrollContainer.scrollTop;

    try {
      // Scroll to the top first
      scrollContainer.scrollTop = 0;
      await new Promise(r => setTimeout(r, 500));

      let previousLineCount = 0;
      let noNewLinesCount = 0;
      let iteration = 0;
      const maxIterations = 1000; // Safety limit

      // Keep scrolling until we stop finding new lines
      while (iteration < maxIterations) {
        // Collect lines currently in the DOM
        try {
          const viewLineElements = document.querySelectorAll('.view-line');
          for (let j = 0; j < viewLineElements.length; j++) {
            const line = viewLineElements[j];
            try {
              const top = parseFloat(line.style.top);
              if (!isNaN(top)) {
                const text = line.innerText !== undefined ? line.innerText : (line.textContent || '');
                lines.set(top, text);
              }
            } catch (lineError) {
              // Skip this line if there's an error
            }
          }
        } catch (e) {
          console.error('[Vibe Extension] Error collecting lines:', e);
        }

        // Check if we got new lines
        if (lines.size === previousLineCount) {
          noNewLinesCount++;
          // If we haven't found new lines in 3 consecutive iterations, we're done
          if (noNewLinesCount >= 3) {
            console.log('[Vibe Extension] No new lines found, stopping');
            break;
          }
        } else {
          noNewLinesCount = 0;
          previousLineCount = lines.size;
        }

        // Progress log every 10 iterations
        if (iteration % 10 === 0) {
          console.log(`[Vibe Extension] Iteration ${iteration}, captured ${lines.size} unique lines...`);
        }

        // Scroll down by viewport height minus one line to ensure overlap
        scrollContainer.scrollTop += viewportHeight - lineHeight;

        // Wait for Monaco to render
        await new Promise(r => setTimeout(r, 100));

        iteration++;
      }

      if (iteration >= maxIterations) {
        console.warn('[Vibe Extension] Reached maximum iterations');
      }

    } finally {
      // Always restore original scroll position
      scrollContainer.scrollTop = originalScrollTop;
    }

    // Sort lines by their top position and join
    const fullCode = Array.from(lines.entries())
      .sort((a, b) => a[0] - b[0])
      .map(entry => entry[1])
      .join('\n');

    console.log(`[Vibe Extension] Done! Captured ${lines.size} lines, ${fullCode.length} chars`);
    console.log('[Vibe Extension] Full code extraction complete');

    return fullCode;
  } catch (error) {
    console.error('[Vibe Extension] Fatal error in extractCodeByScrolling:', error);
    return null;
  }
}

// Extract code from Monaco Editor
async function extractCode() {
  console.log('[Vibe Extension] Starting code extraction...');

  // Try to get the Monaco editor instance from the global monaco object
  if (window.monaco && window.monaco.editor) {
    console.log('[Vibe Extension] Found window.monaco.editor');
    const editors = window.monaco.editor.getModels();
    if (editors && editors.length > 0) {
      const content = editors[0].getValue();
      console.log('[Vibe Extension] Got content from monaco.editor.getModels():', content.length, 'chars');
      return content;
    }
  }

  // Fallback: Try to find editor instance in the DOM
  const monacoElement = document.querySelector('.monaco-editor');
  if (!monacoElement) {
    console.error('[Vibe Extension] No .monaco-editor element found');
    return null;
  }

  console.log('[Vibe Extension] Found monaco-editor element');

  // Method 1: Look for Monaco's internal property (e.g., __monaco_editor_*)
  const editorKey = Object.keys(monacoElement).find(k => k.startsWith('__monaco_editor_'));
  if (editorKey) {
    console.log('[Vibe Extension] Found editor key:', editorKey);
    const editorInstance = monacoElement[editorKey];
    if (editorInstance.getValue) {
      const content = editorInstance.getValue();
      console.log('[Vibe Extension] Got content via', editorKey, ':', content.length, 'chars');
      return content;
    }
    if (editorInstance.getModel && editorInstance.getModel().getValue) {
      const content = editorInstance.getModel().getValue();
      console.log('[Vibe Extension] Got content via', editorKey, '.getModel():', content.length, 'chars');
      return content;
    }
  }

  // Method 2: Try common property names
  const editorInstance = monacoElement.__editor ||
                        monacoElement.editorInstance ||
                        monacoElement._editorInstance;

  if (editorInstance) {
    console.log('[Vibe Extension] Found editorInstance via common properties');
    if (editorInstance.getValue) {
      const content = editorInstance.getValue();
      console.log('[Vibe Extension] Got content via common property:', content.length, 'chars');
      return content;
    }

    if (editorInstance.getModel) {
      const model = editorInstance.getModel();
      if (model && model.getValue) {
        const content = model.getValue();
        console.log('[Vibe Extension] Got content via common property getModel():', content.length, 'chars');
        return content;
      }
    }
  }

  // Method 3: Search through all properties for anything that looks like an editor
  console.log('[Vibe Extension] Searching through all element properties...');
  for (const key of Object.keys(monacoElement)) {
    const obj = monacoElement[key];
    if (obj && typeof obj === 'object') {
      // Check if it has getValue method
      if (typeof obj.getValue === 'function') {
        try {
          const content = obj.getValue();
          if (typeof content === 'string' && content.length > 0) {
            console.log('[Vibe Extension] Got content via property', key, ':', content.length, 'chars');
            return content;
          }
        } catch (e) {
          // Continue searching
        }
      }
      // Check if it has getModel method
      if (typeof obj.getModel === 'function') {
        try {
          const model = obj.getModel();
          if (model && typeof model.getValue === 'function') {
            const content = model.getValue();
            if (typeof content === 'string' && content.length > 0) {
              console.log('[Vibe Extension] Got content via property', key, '.getModel():', content.length, 'chars');
              return content;
            }
          }
        } catch (e) {
          // Continue searching
        }
      }
    }
  }

  // Method 4: Scroll-based extraction (most reliable fallback)
  console.log('[Vibe Extension] API methods failed, trying scroll-based extraction...');
  const scrollContent = await extractCodeByScrolling();
  if (scrollContent && scrollContent.length > 0) {
    return scrollContent;
  }

  // Last resort fallback: Try visible lines only (incomplete but better than nothing)
  console.warn('[Vibe Extension] Falling back to visible lines only (incomplete)');
  const monacoLines = document.querySelector('.view-lines');
  if (monacoLines) {
    const lines = Array.from(monacoLines.querySelectorAll('.view-line'));
    const content = lines.map(line => line.innerText || line.textContent || '').join('\n');
    console.log('[Vibe Extension] Got content from visible lines:', content.length, 'chars,', lines.length, 'lines');
    return content;
  }

  console.error('[Vibe Extension] All extraction methods failed');
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

// Mark file as downloaded in the tree panel by hiding it
function markFileAsDownloaded(filename) {
  // Find the tree item that contains this filename
  const treeItems = Array.from(document.querySelectorAll('.fui-TreeItem'));

  for (const item of treeItems) {
    const nameElement = item.querySelector('.fui-TreeItemLayout__main') || item;
    const itemText = nameElement.textContent.trim();

    // Check if this tree item matches the downloaded filename
    if (itemText === filename) {
      // Hide the tree item completely
      item.style.display = 'none';

      // Store in localStorage for persistence across page reloads
      const storageKey = 'vibeDownloadedFiles_' + getPlanId();
      const downloaded = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!downloaded.includes(filename)) {
        downloaded.push(filename);
        localStorage.setItem(storageKey, JSON.stringify(downloaded));
      }

      console.log('Hidden downloaded file:', filename);
      break;
    }
  }
}

// Restore hidden files on page load
function restoreDownloadMarkers() {
  const storageKey = 'vibeDownloadedFiles_' + getPlanId();
  const downloaded = JSON.parse(localStorage.getItem(storageKey) || '[]');

  downloaded.forEach(filename => {
    markFileAsDownloaded(filename);
  });

  if (downloaded.length > 0) {
    console.log('Hidden', downloaded.length, 'downloaded files');
  }
}

// Run on page load
restoreDownloadMarkers();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  console.log('[Vibe Extension] Received message:', msg.action);

  if (msg.action === 'getSource') {
    // Handle async extractCode
    console.log('[Vibe Extension] Starting code extraction...');
    extractCode()
      .then(content => {
        console.log('[Vibe Extension] Extraction complete, content length:', content?.length || 0);
        const filename = extractFilename();
        console.log('[Vibe Extension] Filename:', filename);
        console.log('[Vibe Extension] Sending response to background script...');
        respond({ content, filename });
      })
      .catch(error => {
        console.error('[Vibe Extension] Error extracting code:', error);
        const filename = extractFilename();
        respond({ content: null, filename });
      });
    return true; // Keep the message channel open for async response
  }

  if (msg.action === 'getTree') {
    const structure = getFolderStructure();
    const planId = getPlanId();
    respond({ structure, planId });
    return true;
  }

  if (msg.action === 'markDownloaded') {
    markFileAsDownloaded(msg.filename);
    respond({ success: true });
    return true;
  }
});
