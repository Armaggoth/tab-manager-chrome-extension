import { extractDomain, extractGoogleDocsId, detectGoogleDocsType } from './utils.js';

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Message listener for tab operations
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async responses
});

// Main message handler
async function handleMessage(request, sender, sendResponse) {
  try {
    const settings = await getSettings();

    switch (request.action) {
      case 'sortByDomain':
        await sortByDomain(settings);
        break;
      case 'groupByDomain':
        await groupByDomain(settings, request.ignoreSubdomain);
        break;
      case 'groupGoogleDocsByType':
        await groupGoogleDocsByType(settings);
        break;
      case 'ungroup':
        await ungroupTabs(settings);
        break;
      case 'removeDuplicates':
        await removeDuplicates(settings);
        break;
      case 'moveDomainCurrentWindow':
        await moveDomainCurrentWindow(settings, request.domain);
        break;
      case 'moveDomainAllWindows':
        await moveDomainAllWindows(settings, request.domain);
        break;
      case 'bringToWindow':
        await bringAllToCurrentWindow(settings);
        break;
      case 'closeDomainCurrentWindow':
        await closeDomainCurrentWindow(settings, request.domain);
        break;
      case 'closeDomainAllWindows':
        await closeDomainAllWindows(settings, request.domain);
        break;
      case 'findMediaPlaying':
        await findMediaPlaying();
        break;
    }
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get settings from storage
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        ignorePinnedTabs: false,
        ignoreGroupedTabs: false,
        detectDuplicateGoogleDocs: false,
      },
      (items) => {
        resolve(items);
      }
    );
  });
}

// Helper to filter tabs based on settings
function filterTabs(tabs, settings) {
  return tabs.filter((tab) => {
    if (settings.ignorePinnedTabs && tab.pinned) return false;
    if (settings.ignoreGroupedTabs && tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
      return false;
    }
    // Filter out special URLs
    if (!tab.url || tab.url.startsWith('chrome://')) return false;
    return true;
  });
}

// Sort tabs by domain in current window
async function sortByDomain(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterTabs(tabs, settings);

  const sorted = filtered.sort((a, b) => {
    const domainA = extractDomain(a.url) || '';
    const domainB = extractDomain(b.url) || '';
    return domainA.localeCompare(domainB);
  });

  // Move tabs to match sorted order
  const startIndex = tabs.length - filtered.length;
  for (let i = 0; i < sorted.length; i++) {
    await moveTabs([sorted[i].id], { index: startIndex + i, windowId: tabs[0].windowId });
  }
}

// Group tabs by domain
async function groupByDomain(settings, ignoreSubdomain = false) {
  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterTabs(tabs, settings);

  // Group tabs by domain
  const groups = new Map();
  filtered.forEach((tab) => {
    const domain = extractDomain(tab.url, ignoreSubdomain) || 'unknown';
    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain).push(tab);
  });

  // Create and assign tab groups
  for (const [domain, domainTabs] of groups) {
    const tabIds = domainTabs.map((t) => t.id);
    const group = await chrome.tabGroups.create({
      windowId: tabs[0].windowId,
      tabIds,
    });
    await chrome.tabGroups.update(group, { title: domain });
  }
}

// Group Google Docs, Sheets, Slides, and Forms tabs by document type
async function groupGoogleDocsByType(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterTabs(tabs, settings);
  const groups = new Map();

  filtered.forEach((tab) => {
    const type = detectGoogleDocsType(tab.url);
    if (!type || type === 'unknown') return;

    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(tab);
  });

  const typeLabels = {
    doc: 'Google Docs',
    spreadsheet: 'Google Sheets',
    presentation: 'Google Slides',
    form: 'Google Forms',
  };

  for (const [type, documentTabs] of groups) {
    const tabIds = documentTabs.map((tab) => tab.id);
    const group = await chrome.tabGroups.create({
      windowId: tabs[0].windowId,
      tabIds,
    });
    await chrome.tabGroups.update(group, { title: typeLabels[type] });
  }
}

// Ungroup all tab groups in current window
async function ungroupTabs(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const grouped = tabs.filter((tab) => tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE);

  for (const tab of grouped) {
    await chrome.tabs.ungroup([tab.id]);
  }
}

// Remove duplicate tabs
async function removeDuplicates(settings) {
  const tabs = await queryTabs({});
  const filtered = filterTabs(tabs, settings);

  const seen = new Map(); // url or docId -> first tab's id
  const toRemove = [];

  for (const tab of filtered) {
    let key = tab.url;

    // Check for duplicate Google Docs if setting is enabled
    if (settings.detectDuplicateGoogleDocs) {
      const docId = extractGoogleDocsId(tab.url);
      if (docId) {
        key = `docs:${docId}`;
      }
    }

    if (seen.has(key)) {
      toRemove.push(tab.id);
    } else {
      seen.set(key, tab.id);
    }
  }

  if (toRemove.length > 0) {
    await chrome.tabs.remove(toRemove);
  }
}

// Move domain tabs from current window to new window
async function moveDomainCurrentWindow(settings, domain) {
  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterTabs(tabs, settings);
  const matching = filtered.filter((tab) => extractDomain(tab.url) === domain);

  if (matching.length === 0) return;

  const tabIds = matching.map((t) => t.id);
  const newWindow = await chrome.windows.create({ tabIds });
  // Close the original tabs if they moved successfully
  await chrome.tabs.remove(tabIds);
}

// Move domain tabs from all windows to new window
async function moveDomainAllWindows(settings, domain) {
  const tabs = await queryTabs({});
  const filtered = filterTabs(tabs, settings);
  const matching = filtered.filter((tab) => extractDomain(tab.url) === domain);

  if (matching.length === 0) return;

  const tabIds = matching.map((t) => t.id);
  const newWindow = await chrome.windows.create({ tabIds });
  // Close the original tabs if they moved successfully
  await chrome.tabs.remove(tabIds);
}

// Bring all tabs from other windows to current window
async function bringAllToCurrentWindow(settings) {
  const currentWindow = await chrome.windows.getCurrent();
  const allTabs = await queryTabs({});
  const otherWindowTabs = allTabs.filter((tab) => tab.windowId !== currentWindow.id);

  if (otherWindowTabs.length === 0) return;

  const tabIds = otherWindowTabs.map((t) => t.id);
  await chrome.tabs.move(tabIds, { windowId: currentWindow.id, index: -1 });
}

// Close domain tabs in current window
async function closeDomainCurrentWindow(settings, domain) {
  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterTabs(tabs, settings);
  const matching = filtered.filter((tab) => extractDomain(tab.url) === domain);

  if (matching.length > 0) {
    const tabIds = matching.map((t) => t.id);
    await chrome.tabs.remove(tabIds);
  }
}

// Close domain tabs in all windows
async function closeDomainAllWindows(settings, domain) {
  const tabs = await queryTabs({});
  const filtered = filterTabs(tabs, settings);
  const matching = filtered.filter((tab) => extractDomain(tab.url) === domain);

  if (matching.length > 0) {
    const tabIds = matching.map((t) => t.id);
    await chrome.tabs.remove(tabIds);
  }
}

// Find and focus the tab currently playing media
async function findMediaPlaying() {
  const tabs = await queryTabs({});
  const playingTab = tabs.find((tab) => tab.audible);

  if (playingTab) {
    await chrome.windows.update(playingTab.windowId, { focused: true });
    await chrome.tabs.update(playingTab.id, { highlighted: true, active: true });
  }
}

// Helper functions for Chrome API promises
function queryTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => resolve(tabs));
  });
}

function moveTabs(tabIds, moveProperties) {
  return new Promise((resolve) => {
    chrome.tabs.move(tabIds, moveProperties, (tabs) => resolve(tabs));
  });
}
