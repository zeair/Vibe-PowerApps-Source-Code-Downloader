// background.js - Handle downloads

// Create context menu for right-click
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'downloadTree',
    title: 'Download folder structure from Vibe PowerApps',
    contexts: ['action']
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (command === 'download-file') {
    await downloadFile(tab);
  } else if (command === 'download-tree') {
    await downloadTree(tab);
  }
});

// Right-click menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'downloadTree') {
    await downloadTree(tab);
  }
});

// Left-click handler
chrome.action.onClicked.addListener(async (tab) => {
  await downloadFile(tab);
});

// Inject content script
async function injectScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
  } catch (e) {
    // Script already injected, ignore
  }
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Get MIME type based on file extension
function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'tsx': 'text/tsx',
    'ts': 'text/typescript',
    'jsx': 'text/jsx',
    'js': 'text/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'md': 'text/markdown',
    'yml': 'text/yaml',
    'yaml': 'text/yaml',
    'xml': 'text/xml',
    'txt': 'text/plain',
    'svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'text/plain';
}

// Download current file
async function downloadFile(tab) {
  try {
    console.log('[Vibe Extension BG] Starting download process...');
    await injectScript(tab.id);

    console.log('[Vibe Extension BG] Sending getSource message...');
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSource' });

    console.log('[Vibe Extension BG] Received response:', {
      hasContent: !!response?.content,
      contentLength: response?.content?.length || 0,
      filename: response?.filename
    });

    if (response?.content) {
      const mimeType = getMimeType(response.filename);
      const dataUrl = `data:${mimeType};charset=utf-8,` + encodeURIComponent(response.content);

      console.log('[Vibe Extension BG] Triggering download for:', response.filename);
      chrome.downloads.download({
        url: dataUrl,
        filename: response.filename,
        saveAs: false
      }, (downloadId) => {
        console.log('[Vibe Extension BG] Download started with ID:', downloadId);
        // After successful download, mark file as downloaded in the tree panel
        if (downloadId) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'markDownloaded',
            filename: response.filename
          }).catch(err => {
            console.log('Could not mark file as downloaded:', err);
          });
        }
      });
    } else {
      console.error('[Vibe Extension BG] No content received from content script');
    }
  } catch (error) {
    console.error('[Vibe Extension BG] Error downloading file:', error);
  }
}

// Download folder structure
async function downloadTree(tab) {
  try {
    await injectScript(tab.id);

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getTree' });

    if (response?.structure) {
      const jsonContent = JSON.stringify(response.structure, null, 2);
      const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
      const filename = `vibe.powerapps.${response.planId}.json`;

      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      });
    }
  } catch (error) {
    console.error('Error downloading tree:', error);
  }
}
