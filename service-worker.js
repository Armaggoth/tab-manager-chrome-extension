import {
  extractDomain,
  extractGoogleDocsId,
  detectGoogleDocsType,
  getGoogleDocsTypeLabel,
  getGoogleDocsTypeSortKey,
  getDomainSortKey,
  getGroupingKey,
  getGroupingLabel,
  ACTION_LABELS,
} from './utils.js';
import { getUsageAction } from './usage.js';

// Open side panel when extension icon is clicked (only used when the popup is unset)
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Toggle between the side panel and the popup based on the saved access mode setting.
async function applyAccessMode() {
  const { accessMode } = await chrome.storage.sync.get({ accessMode: 'sidePanel' });
  await chrome.action.setPopup({ popup: accessMode === 'popup' ? 'popup.html' : '' });
}

chrome.runtime.onInstalled.addListener(applyAccessMode);
chrome.runtime.onStartup.addListener(applyAccessMode);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.accessMode) {
    applyAccessMode();
  }
});
applyAccessMode();

// Message listener for tab operations
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async responses
});

// Main message handler
async function handleMessage(request, sender, sendResponse) {
  try {
    const settings = await getSettings();
    let changed = false;

    switch (request.action) {
      case 'sortByDomain':
        changed = await sortByDomain(settings);
        break;
      case 'scrambleTabs':
        changed = await scrambleTabs();
        break;
      case 'groupByDomain':
        changed = await groupByDomain(settings, request.ignoreSubdomain);
        break;
      case 'groupGoogleDocsByType':
        changed = await groupGoogleDocsByType(settings);
        break;
      case 'ungroup':
        changed = await ungroupTabs(settings);
        break;
      case 'removeDuplicates':
        changed = await removeDuplicates(settings);
        break;
      case 'moveDomainCurrentWindow':
        changed = await moveDomainCurrentWindow(settings, request.domain, false);
        break;
      case 'moveDomainAllWindows':
        changed = await moveDomainAllWindows(settings, request.domain, false);
        break;
      case 'moveDomainCurrentWindowNoSubdomain':
        changed = await moveDomainCurrentWindow(settings, request.domain, true);
        break;
      case 'moveDomainAllWindowsNoSubdomain':
        changed = await moveDomainAllWindows(settings, request.domain, true);
        break;
      case 'moveUngroupedCurrentWindow':
        changed = await moveUngroupedCurrentWindow(settings);
        break;
      case 'bringToWindow':
        changed = await bringAllToCurrentWindow(settings);
        break;
      case 'closeDomainCurrentWindow':
        changed = await closeDomainCurrentWindow(settings, request.domain);
        break;
      case 'closeDomainAllWindows':
        changed = await closeDomainAllWindows(settings, request.domain);
        break;
      case 'findMediaPlaying':
        changed = await findMediaPlaying();
        break;
      case 'getAffectedTabCounts':
        sendResponse({ success: true, counts: await getAffectedTabCounts(settings) });
        return;
    }
    if (changed) {
      await recordFeatureUsage(getUsageAction(request));
    }
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Feature usage tracked in chrome.storage.local for the Settings "Usage" tab.
const TRACKED_ACTIONS = new Set(Object.keys(ACTION_LABELS));
// Debug-only actions (scrambleTabs, readCurrentDomains, readAllWindows, copyTabList)
// are intentionally excluded — they aren't real management features.

async function recordFeatureUsage(action) {
  if (!TRACKED_ACTIONS.has(action)) return;
  const { usageStats = {} } = await chrome.storage.local.get('usageStats');
  const entry = usageStats[action] ?? { count: 0, lastUsedAt: 0 };
  usageStats[action] = { count: entry.count + 1, lastUsedAt: Date.now() };
  await chrome.storage.local.set({ usageStats });
}

// Get settings from storage
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        ignorePinnedTabs: true,
        detectDuplicateGoogleDocs: true,
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
    if (!tab.url) return false;
    return true;
  });
}

function filterDomainActionTabs(tabs, settings) {
  return tabs.filter((tab) => {
    if (settings.ignorePinnedTabs && tab.pinned) return false;
    if (!tab.url) return false;
    return true;
  });
}

function filterUngroupedTabs(tabs, settings) {
  return tabs.filter((tab) => {
    if (settings.ignorePinnedTabs && tab.pinned) return false;
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) return false;
    if (!tab.url) return false;
    return true;
  });
}

function partitionTabsForGrouping(tabs, settings) {
  const groupableTabs = [];
  const ungroupableTabs = [];

  for (const tab of tabs) {
    const isPinned = settings.ignorePinnedTabs && tab.pinned;
    const isGrouped = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE;
    const isMissingUrl = !tab.url;

    if (isPinned || isGrouped || isMissingUrl) {
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
    return false;
  }

  const desiredIds = [
    ...sortedPinnedTabs.map((tab) => tab.id),
    ...sortedUnpinnedTabs.map((tab) => tab.id),
  ];
  if (sortablePinnedTabs.length + sortableUnpinnedTabs.length === tabs.length) {
    await moveTabs(desiredIds, { index: 0, windowId: tabs[0].windowId });
    return true;
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

  return true;
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

  return tabs.length > 1;
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

  return groupedIds.size > 0;
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

  return groupedIds.size > 0;
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

  return grouped.length > 0;
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

  return toRemove.length > 0;
}

// Move domain tabs from current window to new window
async function moveDomainCurrentWindow(settings, domain, ignoreSubdomain) {
  const targetMoveKey = await getTargetMoveKey(domain, ignoreSubdomain);
  if (!targetMoveKey) return false;

  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterDomainActionTabs(tabs, settings);
  const matching = filtered.filter(
    (tab) => getMoveKey(tab.url, ignoreSubdomain) === targetMoveKey
  );

  if (matching.length === 0) return false;

  const tabIds = matching.map((t) => t.id);
  await moveTabsToNewWindow(tabIds);
  return true;
}

// Move domain tabs from all windows to new window
async function moveDomainAllWindows(settings, domain, ignoreSubdomain) {
  const targetMoveKey = await getTargetMoveKey(domain, ignoreSubdomain);
  if (!targetMoveKey) return false;

  const tabs = await queryTabs({});
  const filtered = filterDomainActionTabs(tabs, settings);
  const matching = filtered.filter(
    (tab) => getMoveKey(tab.url, ignoreSubdomain) === targetMoveKey
  );

  if (matching.length === 0) return false;

  const tabIds = matching.map((t) => t.id);
  await moveTabsToNewWindow(tabIds);
  return true;
}

// Move all eligible ungrouped tabs from the current window to a new window
async function moveUngroupedCurrentWindow(settings) {
  const tabs = await queryTabs({ currentWindow: true });
  const ungroupedTabs = filterTabs(tabs, settings);

  if (ungroupedTabs.length === 0) return false;

  await moveTabsToNewWindow(ungroupedTabs.map((tab) => tab.id));
  return true;
}

// Bring all tabs from other windows to current window
async function bringAllToCurrentWindow(settings) {
  const currentWindow = await chrome.windows.getCurrent();
  const allTabs = await queryTabs({});
  const otherWindowTabs = allTabs.filter((tab) => tab.windowId !== currentWindow.id);
  const otherWindowPinnedTabs = otherWindowTabs.filter((tab) => tab.pinned);
  const otherWindowUnpinnedTabs = otherWindowTabs.filter((tab) => !tab.pinned);

  if (otherWindowTabs.length === 0) return false;

  if (otherWindowPinnedTabs.length > 0) {
    const pinnedTabIds = otherWindowPinnedTabs.map((tab) => tab.id);
    await moveTabs(pinnedTabIds, { windowId: currentWindow.id, index: -1 });

    for (const tabId of pinnedTabIds) {
      await updateTab(tabId, { pinned: true });
    }
  }

  if (otherWindowUnpinnedTabs.length > 0) {
    const unpinnedTabIds = otherWindowUnpinnedTabs.map((tab) => tab.id);
    await moveTabs(unpinnedTabIds, { windowId: currentWindow.id, index: -1 });
  }

  return true;
}

// Close domain tabs in current window
async function closeDomainCurrentWindow(settings, domain) {
  const targetMoveKey = await getTargetMoveKey(domain);
  if (!targetMoveKey) return false;

  const tabs = await queryTabs({ currentWindow: true });
  const filtered = filterDomainActionTabs(tabs, settings);
  const matching = filtered.filter((tab) => getMoveKey(tab.url) === targetMoveKey);

  if (matching.length > 0) {
    const tabIds = matching.map((t) => t.id);
    await chrome.tabs.remove(tabIds);
    return true;
  }

  return false;
}

// Close domain tabs in all windows
async function closeDomainAllWindows(settings, domain) {
  const targetMoveKey = await getTargetMoveKey(domain);
  if (!targetMoveKey) return false;

  const tabs = await queryTabs({});
  const filtered = filterDomainActionTabs(tabs, settings);
  const matching = filtered.filter((tab) => getMoveKey(tab.url) === targetMoveKey);

  if (matching.length > 0) {
    const tabIds = matching.map((t) => t.id);
    await chrome.tabs.remove(tabIds);
    return true;
  }

  return false;
}

// Find and focus the tab currently playing media
async function findMediaPlaying() {
  const tabs = await queryTabs({});
  const playingTab = tabs.find((tab) => tab.audible);

  if (playingTab) {
    await chrome.windows.update(playingTab.windowId, { focused: true });
    await chrome.tabs.update(playingTab.id, { highlighted: true, active: true });
    return true;
  }

  return false;
}

async function getAffectedTabCounts(settings) {
  const tabs = await queryTabs({});
  const currentWindow = await chrome.windows.getCurrent();
  const currentTabs = tabs.filter((tab) => tab.windowId === currentWindow.id);
  const eligible = filterTabs(tabs, settings);
  const currentEligible = eligible.filter((tab) => tab.windowId === currentWindow.id);
  const activeTab = currentTabs.find((tab) => tab.active);
  const activeKey = activeTab ? getMoveKey(activeTab.url) : null;
  const activeBaseKey = activeTab ? getMoveKey(activeTab.url, true) : null;
  const domainTabs = filterDomainActionTabs(tabs, settings);
  const currentDomainTabs = domainTabs.filter((tab) => tab.windowId === currentWindow.id);
  const duplicateKeys = new Set();
  const seenKeys = new Set();

  for (const tab of eligible) {
    const key = settings.detectDuplicateGoogleDocs
      ? `docs:${extractGoogleDocsId(tab.url) || tab.url}`
      : tab.url;
    if (seenKeys.has(key)) duplicateKeys.add(tab.id);
    seenKeys.add(key);
  }

  const groupedBuckets = (tabsToGroup, ignoreSubdomain) => {
    const buckets = new Map();
    tabsToGroup.forEach((tab) => {
      const key = getGroupingKey(tab.url, ignoreSubdomain);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return [...buckets.values()]
      .filter((size) => size > 1)
      .reduce((total, size) => total + size, 0);
  };

  return {
    sortByDomain: currentEligible.length,
    groupByDomain: groupedBuckets(currentEligible, false),
    groupByDomainNoSubdomain: groupedBuckets(currentEligible, true),
    groupGoogleDocsByType: currentEligible.filter((tab) => detectGoogleDocsType(tab.url)).length,
    ungroup: currentTabs.filter((tab) => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).length,
    removeDuplicates: duplicateKeys.size,
    moveDomainCurrentWindow: activeKey
      ? currentDomainTabs.filter((tab) => getMoveKey(tab.url) === activeKey).length
      : 0,
    moveDomainAllWindows: activeKey
      ? domainTabs.filter((tab) => getMoveKey(tab.url) === activeKey).length
      : 0,
    moveDomainCurrentWindowNoSubdomain: activeBaseKey
      ? currentDomainTabs.filter((tab) => getMoveKey(tab.url, true) === activeBaseKey).length
      : 0,
    moveDomainAllWindowsNoSubdomain: activeBaseKey
      ? domainTabs.filter((tab) => getMoveKey(tab.url, true) === activeBaseKey).length
      : 0,
    moveUngroupedCurrentWindow: currentEligible.length,
    bringToWindow: tabs.filter((tab) => tab.windowId !== currentWindow.id).length,
    closeDomainCurrentWindow: activeKey
      ? currentDomainTabs.filter((tab) => getMoveKey(tab.url) === activeKey).length
      : 0,
    closeDomainAllWindows: activeKey
      ? domainTabs.filter((tab) => getMoveKey(tab.url) === activeKey).length
      : 0,
    findMediaPlaying: tabs.filter((tab) => tab.audible).length,
  };
}

// Helper functions for Chrome API promises
function queryTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => resolve(tabs));
  });
}

async function getActiveTabDomain() {
  const [activeTab] = await queryTabs({ active: true, currentWindow: true });
  return activeTab ? extractDomain(activeTab.url) : null;
}

async function getTargetMoveKey(domain, ignoreSubdomain = false) {
  const [activeTab] = await queryTabs({ active: true, currentWindow: true });
  if (activeTab) {
    return getMoveKey(activeTab.url, ignoreSubdomain);
  }

  return domain || null;
}

function getMoveKey(url, ignoreSubdomain = false) {
  return getGroupingKey(url, ignoreSubdomain);
}

function moveTabs(tabIds, moveProperties) {
  return new Promise((resolve) => {
    chrome.tabs.move(tabIds, moveProperties, (tabs) => resolve(tabs));
  });
}

function updateTab(tabId, updateProperties) {
  return new Promise((resolve) => {
    chrome.tabs.update(tabId, updateProperties, (tab) => resolve(tab));
  });
}

async function moveTabsToNewWindow(tabIds) {
  if (tabIds.length === 0) return null;

  const newWindow = await createWindowWithTab(tabIds[0]);
  const remainingTabIds = tabIds.slice(1);
  if (remainingTabIds.length > 0) {
    await moveTabs(remainingTabIds, { windowId: newWindow.id, index: -1 });
  }

  return newWindow;
}

function createWindowWithTab(tabId) {
  return new Promise((resolve) => {
    chrome.windows.create({ tabId }, (window) => resolve(window));
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
