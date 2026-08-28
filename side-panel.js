// Side panel UI logic
import { extractDomain } from './utils.js';

// Get all buttons
const buttons = {
  sortByDomain: document.getElementById('sort-by-domain'),
  groupByDomain: document.getElementById('group-by-domain'),
  groupByDomainIgnoreSubdomain: document.getElementById('group-by-domain-ignore-subdomain'),
  groupGoogleDocsByType: document.getElementById('group-google-docs-by-type'),
  ungroup: document.getElementById('ungroup'),
  removeDuplicates: document.getElementById('remove-duplicates'),
  moveDomainCurrentWindow: document.getElementById('move-domain-current-window'),
  moveDomainAllWindows: document.getElementById('move-domain-all-windows'),
  bringToWindow: document.getElementById('bring-to-window'),
  closeDomainCurrentWindow: document.getElementById('close-domain-current-window'),
  closeDomainAllWindows: document.getElementById('close-domain-all-windows'),
  settings: document.getElementById('settings-btn'),
  scrambleTabs: document.getElementById('scramble-tabs'),
  readCurrentDomains: document.getElementById('read-current-domains'),
  copyTabList: document.getElementById('copy-tab-list'),
};

const debugStatus = document.getElementById('debug-status');
const debugTabsList = document.getElementById('debug-tabs-list');

// Get current window tabs
async function getCurrentWindowTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
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

// Button event listeners
buttons.sortByDomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'sortByDomain',
  });
  await readCurrentDomains();
});

buttons.readCurrentDomains.addEventListener('click', async () => {
  try {
    await readCurrentDomains();
  } catch (error) {
    debugStatus.textContent = 'Could not read the current tab list.';
    console.error('Error reading current tab list:', error);
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

buttons.groupByDomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'groupByDomain',
    ignoreSubdomain: false,
  });
});

buttons.groupByDomainIgnoreSubdomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'groupByDomain',
    ignoreSubdomain: true,
  });
});

buttons.groupGoogleDocsByType.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'groupGoogleDocsByType',
  });
});

buttons.ungroup.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'ungroup',
  });
});

buttons.removeDuplicates.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'removeDuplicates',
  });
});

buttons.moveDomainCurrentWindow.addEventListener('click', async () => {
  const domain = await selectDomain();
  if (domain) {
    await chrome.runtime.sendMessage({
      action: 'moveDomainCurrentWindow',
      domain,
    });
  }
});

buttons.moveDomainAllWindows.addEventListener('click', async () => {
  const domain = await selectDomain();
  if (domain) {
    await chrome.runtime.sendMessage({
      action: 'moveDomainAllWindows',
      domain,
    });
  }
});

buttons.bringToWindow.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'bringToWindow',
  });
});

buttons.closeDomainCurrentWindow.addEventListener('click', async () => {
  const domain = await selectDomain();
  if (domain) {
    const confirmed = confirm(
      `Are you sure you want to close all tabs for ${domain} in this window?`
    );
    if (confirmed) {
      await chrome.runtime.sendMessage({
        action: 'closeDomainCurrentWindow',
        domain,
      });
    }
  }
});

buttons.closeDomainAllWindows.addEventListener('click', async () => {
  const domain = await selectDomain();
  if (domain) {
    const confirmed = confirm(
      `Are you sure you want to close all tabs for ${domain} from all windows?`
    );
    if (confirmed) {
      await chrome.runtime.sendMessage({
        action: 'closeDomainAllWindows',
        domain,
      });
    }
  }
});

buttons.settings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Helper to select domain from current tabs
async function selectDomain() {
  const tabs = await getCurrentWindowTabs();
  const domains = [...new Set(tabs.map((tab) => extractDomain(tab.url)).filter(Boolean))];

  if (domains.length === 0) {
    alert('No domains found in current window');
    return null;
  }

  if (domains.length === 1) {
    return domains[0];
  }

  const domain = prompt(`Select a domain:\n\n${domains.join('\n')}`);
  return domains.includes(domain) ? domain : null;
}

// Read every current-window tab for before/after sorting comparisons.
async function readCurrentDomains() {
  const tabs = await getCurrentWindowTabs();
  const groups = await getCurrentWindowGroups();
  const groupNames = new Map(groups.map((group) => [group.id, group.title || '(unnamed group)']));
  debugTabsList.replaceChildren();
  const lines = [];

  tabs.forEach((tab, index) => {
    const line = formatTabDebugLine(tab, index, groupNames);
    const item = document.createElement('li');
    item.className = 'debug-tab-item';
    item.textContent = line;
    debugTabsList.appendChild(item);
    lines.push(line);
  });

  debugStatus.textContent = `Read ${tabs.length} tab${tabs.length === 1 ? '' : 's'} from the current window.`;
  return lines.join('\n');
}

function formatTabDebugLine(tab, index, groupNames) {
  const domain = extractDomain(tab.url);
  const url = tab.url || '(empty URL)';
  const domainLabel = domain || '(no domain)';
  const grouped = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE;
  const groupId = grouped ? tab.groupId : 'None';
  const groupName = grouped ? groupNames.get(tab.groupId) || '(unknown group)' : 'None';
  return `${index + 1}. ${domainLabel} | URL: ${url} | Pinned: ${
    tab.pinned ? 'Yes' : 'No'
  } | Grouped: ${grouped ? 'Yes' : 'No'} | Group ID: ${groupId} | Group Name: ${groupName}`;
}

async function copyTabList() {
  const tabList = await readCurrentDomains();

  try {
    await navigator.clipboard.writeText(tabList);
    debugStatus.textContent = 'Copied the current tab list to the clipboard.';
  } catch (error) {
    debugStatus.textContent = 'Could not copy the tab list to the clipboard.';
    console.error('Error copying tab list:', error);
  }
}
