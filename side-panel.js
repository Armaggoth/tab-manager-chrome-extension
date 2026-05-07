// Side panel UI logic
import { extractDomain, detectGoogleDocsType } from './service-worker.js';

// Get all buttons
const buttons = {
  sortByDomain: document.getElementById('sort-by-domain'),
  groupByDomain: document.getElementById('group-by-domain'),
  groupByDomainIgnoreSubdomain: document.getElementById('group-by-domain-ignore-subdomain'),
  ungroup: document.getElementById('ungroup'),
  removeDuplicates: document.getElementById('remove-duplicates'),
  moveDomainCurrentWindow: document.getElementById('move-domain-current-window'),
  moveDomainAllWindows: document.getElementById('move-domain-all-windows'),
  bringToWindow: document.getElementById('bring-to-window'),
  closeDomainCurrentWindow: document.getElementById('close-domain-current-window'),
  closeDomainAllWindows: document.getElementById('close-domain-all-windows'),
  settings: document.getElementById('settings-btn'),
};

const tabsList = document.getElementById('tabs-list');
const noTabsMessage = document.getElementById('no-tabs-message');

// Get settings
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        ignorePinnedTabs: false,
        language: 'en',
      },
      (items) => {
        resolve(items);
      }
    );
  });
}

// Get all tabs
async function getAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs);
    });
  });
}

// Get current window tabs
async function getCurrentWindowTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      resolve(tabs);
    });
  });
}

// Load and display tabs
async function loadTabs() {
  const tabs = await getCurrentWindowTabs();
  const settings = await getSettings();

  let filteredTabs = tabs;
  if (settings.ignorePinnedTabs) {
    filteredTabs = tabs.filter((tab) => !tab.pinned);
  }

  if (filteredTabs.length === 0) {
    tabsList.innerHTML = '';
    noTabsMessage.style.display = 'block';
    return;
  }

  noTabsMessage.style.display = 'none';
  renderTabs(filteredTabs);
}

// Render tabs in the list
function renderTabs(tabs) {
  tabsList.innerHTML = '';

  tabs.forEach((tab) => {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab-item';
    tabElement.setAttribute('role', 'article');
    tabElement.setAttribute('aria-label', `Tab: ${tab.title}`);

    const domain = extractDomain(tab.url);
    const docsType = detectGoogleDocsType(tab.url);
    const docsLabel = docsType ? ` (${docsType})` : '';

    tabElement.innerHTML = `
      <img src="${tab.favIconUrl || 'assets/default-favicon.png'}" alt="" class="tab-favicon" />
      <div class="tab-info">
        <div class="tab-title" title="${tab.title}">${tab.title}</div>
        <div class="tab-domain" title="${domain || 'Unknown'}">${domain || 'Unknown'}${docsLabel}</div>
      </div>
      ${tab.pinned ? '<span class="tab-pinned" aria-label="Pinned tab">📌</span>' : ''}
    `;

    tabsList.appendChild(tabElement);
  });
}

// Button event listeners
buttons.sortByDomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'sortByDomain',
  });
  loadTabs();
});

buttons.groupByDomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'groupByDomain',
    ignoreSubdomain: false,
  });
  loadTabs();
});

buttons.groupByDomainIgnoreSubdomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'groupByDomain',
    ignoreSubdomain: true,
  });
  loadTabs();
});

buttons.ungroup.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'ungroup',
  });
  loadTabs();
});

buttons.removeDuplicates.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'removeDuplicates',
  });
  loadTabs();
});

buttons.moveDomainCurrentWindow.addEventListener('click', async () => {
  const domain = await selectDomain();
  if (domain) {
    await chrome.runtime.sendMessage({
      action: 'moveDomainCurrentWindow',
      domain,
    });
    loadTabs();
  }
});

buttons.moveDomainAllWindows.addEventListener('click', async () => {
  const domain = await selectDomain();
  if (domain) {
    await chrome.runtime.sendMessage({
      action: 'moveDomainAllWindows',
      domain,
    });
    loadTabs();
  }
});

buttons.bringToWindow.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'bringToWindow',
  });
  loadTabs();
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
      loadTabs();
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
      loadTabs();
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

// Load tabs on startup
loadTabs();

// Reload tabs when window changes
window.addEventListener('focus', loadTabs);
