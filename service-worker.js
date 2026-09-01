import {
  extractDomain,
  extractGoogleDocsId,
  detectGoogleDocsType,
  getGoogleDocsTypeLabel,
  getGoogleDocsTypeSortKey,
  getDomainSortKey,
  getGroupingKey,
  getGroupingLabel,
} from './utils.js';

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
      case 'scrambleTabs':
        await scrambleTabs();
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
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      return false;
    }
    // Filter out special URLs
    if (!tab.url || tab.url.startsWith('chrome://')) return false;
    return true;
  });
}

function filterUngroupedTabs(tabs, settings) {
  return tabs.filter((tab) => {
    if (settings.ignorePinnedTabs && tab.pinned) return false;
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return false;
    if (!tab.url || tab.url.startsWith('chrome://')) return false;
    return true;
  });
}

function partitionTabsForGrouping(tabs, settings) {
  const groupableTabs = [];
  const ungroupableTabs = [];

  for (const tab of tabs) {
    const isPinned = settings.ignorePinnedTabs && tab.pinned;
    const isGrouped = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE;
    const isSpecialUrl = !tab.url || tab.url.startsWith('chrome://');

    if (isPinned || isGrouped || isSpecialUrl) {
      ungroupableTabs.push(tab);
      continue;
    }

    groupableTabs.push(tab);
  }

  return { groupableTabs, ungroupableTabs };
}

// Sort tabs by domain in current window
async function sortByDomain(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const pinnedTabs = tabs.filter((tab) => tab.pinned);
  const unpinnedTabs = tabs.filter((tab) => !tab.pinned);
  const sortablePinnedTabs = settings.ignorePinnedTabs
    ? []
    : pinnedTabs.filter((tab) => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
  const sortableUnpinnedTabs = unpinnedTabs.filter((tab) => {
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      return false;
    }
    return true;
  });

  const sortedPinnedTabs = sortTabsByDomain(sortablePinnedTabs);
  const sortedUnpinnedTabs = sortTabsByDomain(sortableUnpinnedTabs);
  const currentSortableIds = [...sortablePinnedTabs, ...sortableUnpinnedTabs].map(
    (tab) => tab.id
  );
  const sortedSortableIds = [...sortedPinnedTabs, ...sortedUnpinnedTabs].map((tab) => tab.id);

  if (currentSortableIds.every((tabId, index) => tabId === sortedSortableIds[index])) {
    return;
  }

  const desiredIds = [
    ...sortedPinnedTabs.map((tab) => tab.id),
    ...sortedUnpinnedTabs.map((tab) => tab.id),
  ];
  if (sortablePinnedTabs.length + sortableUnpinnedTabs.length === tabs.length) {
    await moveTabs(desiredIds, { index: 0, windowId: tabs[0].windowId });
    return;
  }

  const sortableIds = new Set([...sortablePinnedTabs, ...sortableUnpinnedTabs].map((tab) => tab.id));
  const sortablePositions = tabs
    .map((tab, index) => (sortableIds.has(tab.id) ? index : null))
    .filter((index) => index !== null);
  const workingTabs = [...tabs];

  for (let i = 0; i < desiredIds.length; i++) {
    const targetIndex = sortablePositions[i];
    const currentIndex = workingTabs.findIndex((tab) => tab.id === desiredIds[i]);
    if (currentIndex === targetIndex) continue;

    await moveTabs([desiredIds[i]], {
      index: targetIndex,
      windowId: tabs[0].windowId,
    });

    const [movedTab] = workingTabs.splice(currentIndex, 1);
    workingTabs.splice(targetIndex, 0, movedTab);
  }
}

function sortTabsByDomain(tabs) {
  return [...tabs].sort((a, b) => getDomainSortKey(a.url).localeCompare(getDomainSortKey(b.url)));
}

// Randomize pinned and unpinned tabs independently for repeatable manual testing.
async function scrambleTabs() {
  const tabs = await queryTabs({ currentWindow: true });
  const pinnedTabs = tabs.filter((tab) => tab.pinned);
  const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

  const shuffledPinnedTabs = shuffleTabs(pinnedTabs);
  const shuffledUnpinnedTabs = shuffleTabs(unpinnedTabs);
  const windowId = tabs[0]?.windowId;

  for (let index = shuffledPinnedTabs.length - 1; index >= 0; index--) {
    await moveTabs([shuffledPinnedTabs[index].id], {
      index,
      windowId,
    });
  }

  for (let index = shuffledUnpinnedTabs.length - 1; index >= 0; index--) {
    await moveTabs([shuffledUnpinnedTabs[index].id], {
      index: shuffledPinnedTabs.length + index,
      windowId,
    });
  }
}

function shuffleTabs(tabs) {
  const shuffledTabs = [...tabs];
  for (let index = shuffledTabs.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledTabs[index], shuffledTabs[randomIndex]] = [
      shuffledTabs[randomIndex],
      shuffledTabs[index],
    ];
  }
  return shuffledTabs;
}

// Group tabs by domain
async function groupByDomain(settings, ignoreSubdomain = false) {
  const tabs = await queryTabs({ currentWindow: true });
  const { groupableTabs, ungroupableTabs } = partitionTabsForGrouping(tabs, settings);
  const groupedIds = new Set();

  // Group tabs by domain
  const groups = new Map();
  groupableTabs.forEach((tab) => {
    const groupingKey = getGroupingKey(tab.url, ignoreSubdomain);
    if (!groups.has(groupingKey)) {
      groups.set(groupingKey, []);
    }
    groups.get(groupingKey).push(tab);
  });

  for (const [groupingKey, domainTabs] of groups) {
    if (domainTabs.length < 2) continue;

    const tabIds = domainTabs.map((t) => t.id);
    tabIds.forEach((tabId) => groupedIds.add(tabId));
    const group = await groupTabs(tabIds);
    await updateTabGroup(group, {
      title: getGroupingLabel(domainTabs[0].url, ignoreSubdomain),
      collapsed: true,
    });
  }

  if (groupedIds.size > 0) {
    await moveUngroupedTabsRight(groupedIds, settings);
  }

  return { groupableTabs, ungroupableTabs, groupedIds };
}

// Group recognized Google editor tabs by document type
async function groupGoogleDocsByType(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const { groupableTabs, ungroupableTabs } = partitionTabsForGrouping(tabs, settings);
  const groups = new Map();
  const groupedIds = new Set();

  groupableTabs.forEach((tab) => {
    const type = detectGoogleDocsType(tab.url);
    if (!type || type === 'unknown') return;

    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(tab);
  });

  const sortedGroups = [...groups.entries()].sort(([typeA], [typeB]) =>
    getGoogleDocsTypeSortKey(typeA).localeCompare(getGoogleDocsTypeSortKey(typeB))
  );

  for (const [type, documentTabs] of sortedGroups) {
    if (documentTabs.length < 2) continue;

    const tabIds = documentTabs.map((tab) => tab.id);
    tabIds.forEach((tabId) => groupedIds.add(tabId));
    const title = getGoogleDocsTypeLabel(type);
    const group = await groupTabs(tabIds);
    await updateTabGroup(group, { title, collapsed: true });
  }

  if (groupedIds.size > 0) {
    await moveUngroupedTabsRight(groupedIds, settings);
  }

  return { groupableTabs, ungroupableTabs, groupedIds };
}

async function moveUngroupedTabsRight(groupedIds, settings = {}) {
  const currentWindowTabs = await queryTabs({ currentWindow: true });
  const { ungroupableTabs } = partitionTabsForGrouping(currentWindowTabs, settings);
  const ungroupedIds = currentWindowTabs
    .filter((tab) => !groupedIds.has(tab.id) && !ungroupableTabs.some((groupedTab) => groupedTab.id === tab.id))
    .map((tab) => tab.id);

  if (ungroupedIds.length === 0) return;

  const windowId = currentWindowTabs[0]?.windowId;
  let targetIndex = currentWindowTabs.length - 1;
  const workingTabs = [...currentWindowTabs];

  for (let index = ungroupedIds.length - 1; index >= 0; index--) {
    const tabId = ungroupedIds[index];
    const currentIndex = workingTabs.findIndex((tab) => tab.id === tabId);
    if (currentIndex === targetIndex) {
      targetIndex -= 1;
      continue;
    }

    await moveTabs([tabId], { index: targetIndex, windowId });
    const [movedTab] = workingTabs.splice(currentIndex, 1);
    workingTabs.splice(targetIndex, 0, movedTab);
    targetIndex -= 1;
  }
}

// Ungroup all tab groups in current window
async function ungroupTabs(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const grouped = tabs.filter((tab) => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);

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

function groupTabs(tabIds, groupId) {
  return new Promise((resolve) => {
    const options = groupId === undefined ? { tabIds } : { tabIds, groupId };
    chrome.tabs.group(options, (result) => resolve(result));
  });
}

function updateTabGroup(groupId, updateProperties) {
  return new Promise((resolve) => {
    chrome.tabGroups.update(groupId, updateProperties, (group) => resolve(group));
  });
}
