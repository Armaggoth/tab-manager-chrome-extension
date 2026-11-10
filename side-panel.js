// Side panel UI logic
import { extractDomain } from './utils.js';
import {
  getActionButtons,
  initActionButtons,
  initAffectedTabCounts,
  initPinnedTabsCue,
  initUsageSuggestion,
  renderConfiguredActionGroups,
} from './panel-actions.js';

let buttons;
const refreshAffectedTabCounts = await initAffectedTabCounts();
await renderConfiguredActionGroups(document.getElementById('actions-grid'), async () => {
  buttons = getActionButtons({
    settings: document.getElementById('settings-btn'),
    scrambleTabs: document.getElementById('scramble-tabs'),
    readCurrentDomains: document.getElementById('read-current-domains'),
    readAllWindows: document.getElementById('read-all-windows'),
    copyTabList: document.getElementById('copy-tab-list'),
  });
  initActionButtons(buttons, { afterSortByDomain: readCurrentDomains });
  await refreshAffectedTabCounts();
});

const debugStatus = document.getElementById('debug-status');
const debugTabsList = document.getElementById('debug-tabs-list');

initPinnedTabsCue();
initUsageSuggestion({ afterSortEnabled: () => location.reload() });

// Get current window tabs
async function getCurrentWindowTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      resolve(tabs);
    });
  });
}

async function getAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs);
    });
  });
}

async function getCurrentWindowGroups() {
  return new Promise((resolve) => {
    chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (groups) => {
      resolve(groups);
    });
  });
}

async function getAllGroups() {
  return new Promise((resolve) => {
    chrome.tabGroups.query({}, (groups) => {
      resolve(groups);
    });
  });
}

// Debug-only button event listeners (not part of the shared action set)
buttons.readCurrentDomains.addEventListener('click', async () => {
  try {
    await readCurrentDomains();
  } catch (error) {
    debugStatus.textContent = 'Could not read the current tab list.';
    console.error('Error reading current tab list:', error);
  }
});

buttons.readAllWindows.addEventListener('click', async () => {
  try {
    await readAllWindows();
  } catch (error) {
    debugStatus.textContent = 'Could not read all browser windows.';
    console.error('Error reading all browser windows:', error);
  }
});

buttons.copyTabList.addEventListener('click', copyTabList);

buttons.scrambleTabs.addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({
    action: 'scrambleTabs',
  });
  await readCurrentDomains();
  if (response && !response.success) {
    debugStatus.textContent = `Could not scramble tabs: ${response.error}`;
  }
});

// Read every current-window tab for before/after sorting comparisons.
async function readCurrentDomains() {
  const tabs = await getCurrentWindowTabs();
  const groups = await getCurrentWindowGroups();
  const groupNames = new Map(groups.map((group) => [group.id, group.title || '(unnamed group)']));
  const output = renderDebugTabs(tabs, groupNames, { includeWindowId: false });
  debugStatus.textContent = `Read ${tabs.length} tab${tabs.length === 1 ? '' : 's'} from the current window.`;
  return output;
}

async function readAllWindows() {
  const tabs = await getAllTabs();
  const groups = await getAllGroups();
  const groupNames = new Map(groups.map((group) => [group.id, group.title || '(unnamed group)']));
  const output = renderDebugTabs(tabs, groupNames, { includeWindowId: true });
  const windowCount = new Set(tabs.map((tab) => tab.windowId)).size;
  debugStatus.textContent = `Read ${tabs.length} tab${tabs.length === 1 ? '' : 's'} from ${windowCount} window${windowCount === 1 ? '' : 's'}.`;
  return output;
}

function renderDebugTabs(tabs, groupNames, options = {}) {
  debugTabsList.replaceChildren();
  const lines = [];

  tabs.forEach((tab, index) => {
    const line = formatTabDebugLine(tab, index, groupNames, options);
    const item = document.createElement('li');
    item.className = 'debug-tab-item';
    item.textContent = line;
    debugTabsList.appendChild(item);
    lines.push(line);
  });

  return lines.join('\n');
}

function formatTabDebugLine(tab, index, groupNames, options = {}) {
  const domain = extractDomain(tab.url);
  const url = tab.url || '(empty URL)';
  const domainLabel = domain || '(no domain)';
  const grouped = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE;
  const groupId = grouped ? tab.groupId : 'None';
  const groupName = grouped ? groupNames.get(tab.groupId) || '(unknown group)' : 'None';
  const windowLabel = options.includeWindowId ? `Window ID: ${tab.windowId} | ` : '';
  return `${index + 1}. ${windowLabel}${domainLabel} | URL: ${url} | Pinned: ${
    tab.pinned ? 'Yes' : 'No'
  } | Grouped: ${grouped ? 'Yes' : 'No'} | Group ID: ${groupId} | Group Name: ${groupName}`;
}

async function copyTabList() {
  const visibleLines = [...debugTabsList.querySelectorAll('.debug-tab-item')].map(
    (item) => item.textContent
  );
  const tabList = visibleLines.length > 0 ? visibleLines.join('\n') : await readCurrentDomains();

  try {
    await navigator.clipboard.writeText(tabList);
    debugStatus.textContent = 'Copied the current tab list to the clipboard.';
  } catch (error) {
    debugStatus.textContent = 'Could not copy the tab list to the clipboard.';
    console.error('Error copying tab list:', error);
  }
}
