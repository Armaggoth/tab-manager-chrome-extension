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
};

// Get current window tabs
async function getCurrentWindowTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      resolve(tabs);
    });
  });
}

// Button event listeners
buttons.sortByDomain.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    action: 'sortByDomain',
  });
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
