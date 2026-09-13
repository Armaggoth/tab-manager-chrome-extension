// Shared tab-management action wiring, used by both the side panel and the popup.
import { ACTION_GROUPS, ACTION_LABELS, extractDomain } from './utils.js';
import {
  getMostUsedActions,
  getUsageSuggestion,
  USAGE_SUGGESTION_DEFAULTS,
  USAGE_SUGGESTION_THRESHOLDS,
} from './usage.js';

const ACTION_BUTTONS = {
  sortByDomain: 'sort-by-domain',
  groupByDomain: 'group-by-domain',
  groupByDomainNoSubdomain: 'group-by-domain-ignore-subdomain',
  groupGoogleDocsByType: 'group-google-docs-by-type',
  ungroup: 'ungroup',
  removeDuplicates: 'remove-duplicates',
  moveDomainCurrentWindow: 'move-domain-current-window',
  moveDomainAllWindows: 'move-domain-all-windows',
  moveDomainCurrentWindowNoSubdomain: 'move-domain-current-window-no-subdomain',
  moveDomainAllWindowsNoSubdomain: 'move-domain-all-windows-no-subdomain',
  moveUngroupedCurrentWindow: 'move-ungrouped-current-window',
  bringToWindow: 'bring-to-window',
  closeDomainCurrentWindow: 'close-domain-current-window',
  closeDomainAllWindows: 'close-domain-all-windows',
  findMediaPlaying: 'find-media-playing',
};

export function renderActionGroups(container, options = {}) {
  if (!container) return;
  const mostUsedActions = options.mostUsedActions ?? [];
  const promoted = new Set(mostUsedActions);

  // Promoted actions move to "Most Used" instead of being listed twice.
  const groups = ACTION_GROUPS.map((group) => ({
    ...group,
    actions: group.actions.filter((action) => !promoted.has(action.key)),
  })).filter((group) => group.actions.length > 0);

  if (mostUsedActions.length > 0) {
    groups.unshift({
      title: 'Most Used',
      idPrefix: 'most-used',
      actions: mostUsedActions.map((actionKey) => findAction(actionKey)).filter(Boolean),
    });
  }

  container.replaceChildren(
    ...groups.map((group) => {
      const groupElement = document.createElement('div');
      groupElement.className = 'action-group';

      const heading = document.createElement('h3');
      heading.textContent = group.title;
      groupElement.appendChild(heading);

      group.actions.forEach((action) => {
        groupElement.appendChild(createActionButton(action, group.idPrefix));
      });

      return groupElement;
    })
  );
}

export async function renderConfiguredActionGroups(container) {
  const { usageStats = {}, usageSortEnabled = false } = await chrome.storage.local.get({
    usageStats: {},
    usageSortEnabled: false,
  });
  renderActionGroups(container, {
    mostUsedActions: usageSortEnabled ? getMostUsedActions(usageStats, 5) : [],
  });
}

function findAction(actionKey) {
  return ACTION_GROUPS.flatMap((group) => group.actions).find((action) => action.key === actionKey);
}

function createActionButton(action, idPrefix) {
  const button = document.createElement('button');
  button.id = idPrefix ? `${idPrefix}-${action.id}` : action.id;
  button.dataset.actionKey = action.key;
  button.className = `btn ${action.buttonClass}`;
  button.setAttribute('aria-label', action.ariaLabel);
  button.title = action.title;
  button.textContent = ACTION_LABELS[action.key];
  return button;
}

export function getActionButtons(extraButtons = {}) {
  const buttons = Object.fromEntries(
    ACTION_GROUPS.flatMap((group) =>
      group.actions.map((action) => [
        action.key,
        [document.getElementById(action.id), document.getElementById(`most-used-${action.id}`)].filter(
          Boolean
        ),
      ])
    )
  );
  return { ...buttons, ...extraButtons };
}

export function initUsageCounts() {
  const render = ({ usageStats = {} }) => {
    Object.entries(ACTION_BUTTONS).forEach(([action, buttonId]) => {
      const count = usageStats[action]?.count || 0;
      const label = ACTION_LABELS[action];
      getButtonsByIds(buttonId).forEach((button) => {
        button.textContent = `${label} (${count})`;
        button.setAttribute('aria-label', `${label}, used ${count} times`);
      });
    });
  };

  chrome.storage.local.get({ usageStats: {} }, render);
  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.usageStats) {
      render({ usageStats: changes.usageStats.newValue || {} });
    }
  });
}

export function initPinnedTabsCue() {
  const cue = document.getElementById('pinned-tabs-ignored-cue');
  if (!cue) return;

  const update = ({ ignorePinnedTabs = true } = {}) => {
    cue.hidden = !ignorePinnedTabs;
  };

  chrome.storage.sync.get({ ignorePinnedTabs: true }, update);
  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.ignorePinnedTabs) {
      update({ ignorePinnedTabs: changes.ignorePinnedTabs.newValue });
    }
  });
}

export async function initAffectedTabCounts() {
  const refresh = async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getAffectedTabCounts' });
    const counts = response?.counts || {};

    Object.entries(ACTION_BUTTONS).forEach(([action, buttonId]) => {
      const count = counts[action] || 0;
      const suffix = count > 0 ? ` · ${count}` : '';
      const label = ACTION_LABELS[action];
      getButtonsByIds(buttonId).forEach((button) => {
        button.textContent = `${label}${suffix}`;
        button.setAttribute('aria-label', `${label}, affects ${count} tabs`);
      });
    });
  };

  await refresh();
  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.ignorePinnedTabs) refresh();
  });
  const tabEvents = ['onActivated', 'onCreated', 'onRemoved', 'onUpdated', 'onMoved'];
  tabEvents.forEach((eventName) => chrome.tabs?.[eventName]?.addListener(refresh));
}

function getButtonsByIds(buttonId) {
  return [document.getElementById(buttonId), document.getElementById(`most-used-${buttonId}`)].filter(
    Boolean
  );
}

export function initUsageSuggestion(hooks = {}) {
  const banner = document.getElementById('usage-suggestion');
  const message = document.getElementById('usage-suggestion-message');
  const sortButton = document.getElementById('usage-suggestion-sort');
  const laterButton = document.getElementById('usage-suggestion-later');
  const disableButton = document.getElementById('usage-suggestion-disable');
  if (!banner || !message || !sortButton || !laterButton || !disableButton) return;

  let currentSuggestion = null;

  async function refresh() {
    const [{ usageStats = {} }, preferences] = await Promise.all([
      chrome.storage.local.get({ usageStats: {} }),
      chrome.storage.local.get(USAGE_SUGGESTION_DEFAULTS),
    ]);
    currentSuggestion = getUsageSuggestion(usageStats, preferences);
    banner.hidden = !currentSuggestion;
    if (currentSuggestion) {
      message.textContent = `You use ${currentSuggestion.label} often. Make it easier to access?`;
    }
  }

  sortButton.addEventListener('click', async () => {
    if (!currentSuggestion) return;
    await chrome.storage.local.set({
      usageSortEnabled: true,
      usageSuggestionDismissedUntil: Date.now() + USAGE_SUGGESTION_THRESHOLDS.cooldownMs,
    });
    banner.hidden = true;
    await hooks.afterSortEnabled?.();
  });

  laterButton.addEventListener('click', async () => {
    await chrome.storage.local.set({
      usageSuggestionDismissedUntil: Date.now() + USAGE_SUGGESTION_THRESHOLDS.cooldownMs,
    });
    banner.hidden = true;
  });

  disableButton.addEventListener('click', async () => {
    await chrome.storage.local.set({ usageSuggestionsEnabled: false });
    banner.hidden = true;
  });

  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (
      areaName === 'local' &&
      (changes.usageStats ||
        changes.usageSuggestionsEnabled ||
        changes.usageSuggestionDismissedUntil)
    ) {
      refresh();
    }
  });
  refresh();
}

export function initActionButtons(buttons, hooks = {}) {
  addActionListener(buttons.sortByDomain, async () => {
    await chrome.runtime.sendMessage({ action: 'sortByDomain' });
    await hooks.afterSortByDomain?.();
  });

  addActionListener(buttons.groupByDomain, async () => {
    await chrome.runtime.sendMessage({ action: 'groupByDomain', ignoreSubdomain: false });
  });

  addActionListener(buttons.groupByDomainNoSubdomain, async () => {
    await chrome.runtime.sendMessage({ action: 'groupByDomain', ignoreSubdomain: true });
  });

  addActionListener(buttons.groupGoogleDocsByType, async () => {
    await chrome.runtime.sendMessage({ action: 'groupGoogleDocsByType' });
  });

  addActionListener(buttons.ungroup, async () => {
    await chrome.runtime.sendMessage({ action: 'ungroup' });
  });

  addActionListener(buttons.removeDuplicates, async () => {
    await chrome.runtime.sendMessage({ action: 'removeDuplicates' });
  });

  addActionListener(buttons.moveDomainCurrentWindow, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      await chrome.runtime.sendMessage({ action: 'moveDomainCurrentWindow', domain });
    }
  });

  addActionListener(buttons.moveDomainAllWindows, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      await chrome.runtime.sendMessage({ action: 'moveDomainAllWindows', domain });
    }
  });

  addActionListener(buttons.moveDomainCurrentWindowNoSubdomain, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      await chrome.runtime.sendMessage({
        action: 'moveDomainCurrentWindowNoSubdomain',
        domain,
      });
    }
  });

  addActionListener(buttons.moveDomainAllWindowsNoSubdomain, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      await chrome.runtime.sendMessage({
        action: 'moveDomainAllWindowsNoSubdomain',
        domain,
      });
    }
  });

  addActionListener(buttons.moveUngroupedCurrentWindow, async () => {
    await chrome.runtime.sendMessage({ action: 'moveUngroupedCurrentWindow' });
  });

  addActionListener(buttons.bringToWindow, async () => {
    await chrome.runtime.sendMessage({ action: 'bringToWindow' });
  });

  addActionListener(buttons.closeDomainCurrentWindow, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      const confirmed = confirm(
        `Are you sure you want to close all tabs for ${domain} in this window?`
      );
      if (confirmed) {
        await chrome.runtime.sendMessage({ action: 'closeDomainCurrentWindow', domain });
      }
    }
  });

  addActionListener(buttons.closeDomainAllWindows, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      const confirmed = confirm(
        `Are you sure you want to close all tabs for ${domain} from all windows?`
      );
      if (confirmed) {
        await chrome.runtime.sendMessage({ action: 'closeDomainAllWindows', domain });
      }
    }
  });

  addActionListener(buttons.findMediaPlaying, async () => {
    await chrome.runtime.sendMessage({ action: 'findMediaPlaying' });
  });

  buttons.settings?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

function addActionListener(buttons, listener) {
  const buttonList = Array.isArray(buttons) ? buttons : [buttons];
  buttonList.filter(Boolean).forEach((button) => button.addEventListener('click', listener));
}

// Use the active tab as the domain source for domain-specific actions.
async function getActiveTabDomain() {
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      resolve(activeTabs);
    });
  });
  const domain = extractDomain(tabs[0]?.url);

  if (!domain) {
    alert('The current tab does not have a domain that can be used for this action.');
    return null;
  }

  return domain;
}
