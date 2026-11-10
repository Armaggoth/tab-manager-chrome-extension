// Shared tab-management action wiring, used by both the side panel and the popup.
import {
  ACTION_GROUPS,
  ACTION_LABELS,
  extractDomain,
  getKnownProtocolInfo,
} from './utils.js';
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
  moveActiveTabToNewWindow: 'move-active-tab-to-new-window',
  bringDomainToCurrentWindow: 'bring-domain-to-current-window',
  bringDomainToCurrentWindowNoSubdomain: 'bring-domain-to-current-window-no-subdomain',
  bringToWindow: 'bring-to-window',
  closeDomainCurrentWindow: 'close-domain-current-window',
  closeDomainAllWindows: 'close-domain-all-windows',
  findMediaPlaying: 'find-media-playing',
};
const boundButtons = new WeakSet();

export function renderActionGroups(container, options = {}) {
  if (!container) return;
  if (options.mode === 'icons') {
    renderIconTabs(container, options);
    return;
  }

  container.className = 'actions-grid';
  const mostUsedActions = options.mostUsedActions ?? [];
  const pinnedActions = new Set(options.pinnedActions ?? []);
  const promoted = new Set(mostUsedActions);

  // Promoted actions move to "Most Used" instead of being listed twice.
  const groups = ACTION_GROUPS.map((group) => ({
    ...group,
    actions: group.actions.filter((action) => !promoted.has(action.key)),
  })).filter((group) => group.actions.length > 0);

  if (mostUsedActions.length > 0 || options.showMostUsed) {
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
        groupElement.appendChild(
          createActionRow(action, group.idPrefix, false, pinnedActions, options.onPinToggle)
        );
      });

      return groupElement;
    })
  );
}

export async function renderConfiguredActionGroups(container, afterRender = () => {}) {
  let pinUpdateQueue = Promise.resolve();

  async function togglePinnedAction(actionKey) {
    pinUpdateQueue = pinUpdateQueue
      .then(async () => {
        const { pinnedActions = [] } = await chrome.storage.local.get({ pinnedActions: [] });
        const nextPinnedActions = pinnedActions.includes(actionKey)
          ? pinnedActions.filter((key) => key !== actionKey)
          : [...pinnedActions, actionKey];
        await chrome.storage.local.set({ pinnedActions: nextPinnedActions });
        await refresh();
      })
      .catch((error) => {
        console.error('Unable to update pinned actions:', error);
      });
    await pinUpdateQueue;
  }

  async function refresh() {
    const [
      { operationsUiMode = 'text' },
      { usageStats = {}, usageSortEnabled = false, pinnedActions = [] },
    ] =
      await Promise.all([
        chrome.storage.sync?.get({ operationsUiMode: 'text' }) ??
          Promise.resolve({ operationsUiMode: 'text' }),
        chrome.storage.local.get({
          usageStats: {},
          usageSortEnabled: false,
          pinnedActions: [],
        }),
      ]);
    const validPinnedActions = Array.isArray(pinnedActions)
      ? pinnedActions.filter((actionKey) => findAction(actionKey))
      : [];
    const mostUsedActions = getMostUsedActions(usageStats, 6, validPinnedActions);
    renderActionGroups(container, {
      mode: operationsUiMode,
      mostUsedActions,
      pinnedActions: validPinnedActions,
      onPinToggle: togglePinnedAction,
      showMostUsed:
        validPinnedActions.length > 0 ||
        (usageSortEnabled && mostUsedActions.length > 0),
      activeTabId: container.dataset?.activeTabId,
    });
    await afterRender();
  }

  await refresh();
  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (
      (areaName === 'sync' && changes.operationsUiMode) ||
      (areaName === 'local' &&
        (changes.usageStats || changes.usageSortEnabled || changes.pinnedActions))
    ) {
      return refresh();
    }
  });
}

function renderIconTabs(container, options) {
  const mostUsedActions = options.mostUsedActions ?? [];
  const groups = [
    { id: 'most-used', title: localizedMessage('mostUsedTab', 'Most Used'), icon: 'assets/icons/16/sort-by-domain.png' },
    ...ACTION_GROUPS.map((group, index) => ({
      id: group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
      title: localizedMessage(
        ['sortGroup', 'cleanUpGroup', 'moveTabsGroup', 'searchFocusGroup', 'closeTabsGroup'][index],
        group.title
      ),
      icon: group.actions[0].icon.replace('/48/', '/16/'),
      actions: group.actions,
    })),
  ];
  const activeTabId = groups.some((group) => group.id === options.activeTabId)
    ? options.activeTabId
    : groups[0].id;
  const tablist = document.createElement('div');
  tablist.className = 'action-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', localizedMessage('actionCategories', 'Action categories'));

  const tabs = groups.map((group, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `actions-tab-${group.id}`;
    tab.className = 'action-tab';
    tab.dataset.tabId = group.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `actions-panel-${group.id}`);
    tab.setAttribute('aria-selected', String(group.id === activeTabId));
    tab.setAttribute('tabindex', group.id === activeTabId ? '0' : '-1');
    tab.title = group.title;

    const icon = document.createElement('img');
    icon.src = group.icon;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = group.title;
    tab.append(icon, label);
    tab.addEventListener('click', () => selectActionTab(container, groups, group.id));
    tab.addEventListener('keydown', (event) => {
      let targetIndex;
      if (event.key === 'ArrowRight') targetIndex = (index + 1) % groups.length;
      if (event.key === 'ArrowLeft') targetIndex = (index - 1 + groups.length) % groups.length;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = groups.length - 1;
      if (targetIndex !== undefined) {
        event.preventDefault();
        const targetId = groups[targetIndex].id;
        selectActionTab(container, groups, targetId);
        document.getElementById(`actions-tab-${targetId}`)?.focus();
      }
    });
    tablist.appendChild(tab);
    return tab;
  });

  const panels = groups.map((group) => {
    const panel = document.createElement('div');
    panel.id = `actions-panel-${group.id}`;
    panel.className = 'action-tab-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `actions-tab-${group.id}`);
    panel.setAttribute('tabindex', '0');
    panel.hidden = group.id !== activeTabId;

    if (group.id === 'most-used') {
      if (mostUsedActions.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'most-used-empty';
        emptyMessage.textContent = localizedMessage(
          'mostUsedEmpty',
          'Actions will appear here as you use them.'
        );
        const switchButton = document.createElement('button');
        switchButton.type = 'button';
        switchButton.className = 'btn btn-secondary';
        switchButton.textContent = localizedMessage('switchToText', 'Switch to Text');
        switchButton.addEventListener('click', () => {
          chrome.storage.sync.set({ operationsUiMode: 'text' }, () => {
            renderActionGroups(container, { mode: 'text' });
          });
        });
        panel.append(emptyMessage, switchButton);
      } else {
        mostUsedActions.forEach((actionKey) => {
          const action = findAction(actionKey);
          if (action) {
            panel.appendChild(
              createActionRow(
                action,
                'most-used',
                true,
                new Set(options.pinnedActions ?? []),
                options.onPinToggle
              )
            );
          }
        });
      }
    } else {
      group.actions.forEach((action) => {
        panel.appendChild(
          createActionRow(
            action,
            null,
            true,
            new Set(options.pinnedActions ?? []),
            options.onPinToggle
          )
        );
      });
    }

    return panel;
  });

  container.className = 'actions-grid actions-grid-icons';
  container.dataset.activeTabId = activeTabId;
  container.replaceChildren(tablist, ...panels);
}

function selectActionTab(container, groups, activeTabId) {
  container.dataset.activeTabId = activeTabId;
  groups.forEach((group) => {
    const selected = group.id === activeTabId;
    const tab = document.getElementById(`actions-tab-${group.id}`);
    const panel = document.getElementById(`actions-panel-${group.id}`);
    tab?.setAttribute('aria-selected', String(selected));
    tab?.setAttribute('tabindex', selected ? '0' : '-1');
    if (panel) panel.hidden = !selected;
  });
}

function localizedMessage(key, fallback, substitutions = []) {
  return globalThis.chrome?.i18n?.getMessage(key, substitutions) || fallback;
}

function findAction(actionKey) {
  return ACTION_GROUPS.flatMap((group) => group.actions).find((action) => action.key === actionKey);
}

function createActionRow(action, idPrefix, showIcon, pinnedActions, onPinToggle) {
  const row = document.createElement('div');
  row.className = showIcon ? 'action-tile-wrapper' : 'action-row';
  row.appendChild(createActionButton(action, idPrefix, showIcon));

  const isPinned = pinnedActions.has(action.key);
  const pinLabel = localizedMessage(
    isPinned ? 'unpinAction' : 'pinAction',
    isPinned
      ? `Unpin ${ACTION_LABELS[action.key]} from Most Used`
      : `Pin ${ACTION_LABELS[action.key]} to Most Used`,
    [ACTION_LABELS[action.key]]
  );
  const pinButton = document.createElement('button');
  pinButton.type = 'button';
  pinButton.id = `${idPrefix ? `${idPrefix}-` : ''}pin-${action.id}`;
  pinButton.className = 'action-pin-button';
  pinButton.setAttribute('aria-pressed', String(isPinned));
  pinButton.setAttribute('aria-label', pinLabel);
  pinButton.title = pinLabel;

  const pinIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pinIcon.setAttribute('viewBox', '0 0 24 24');
  pinIcon.setAttribute('class', 'action-pin-icon');
  pinIcon.setAttribute('aria-hidden', 'true');
  const pinPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pinPath.setAttribute(
    'd',
    isPinned
      ? 'M16 3a1 1 0 0 1 1 1v5l2 3v2h-6v7l-1 1-1-1v-7H5v-2l2-3V4a1 1 0 0 1 1-1h8Z'
      : 'M8 3h8a1 1 0 0 1 1 1v5l2 3v2h-6v7l-1 1-1-1v-7H5v-2l2-3V4a1 1 0 0 1 1-1Zm0 2v4.6L6.5 12h11L16 9.6V5H8Z'
  );
  pinIcon.appendChild(pinPath);
  pinButton.appendChild(pinIcon);
  pinButton.addEventListener('click', async (event) => {
    event?.stopPropagation();
    await onPinToggle?.(action.key);
  });
  row.appendChild(pinButton);
  return row;
}

function createActionButton(action, idPrefix, showIcon = false) {
  const button = document.createElement('button');
  button.id = idPrefix ? `${idPrefix}-${action.id}` : action.id;
  button.dataset.actionKey = action.key;
  button.className = `btn ${action.buttonClass}`;
  button.setAttribute('aria-label', action.ariaLabel);
  button.title = action.title;
  if (showIcon) {
    button.classList.add('action-tile');
    const icon = document.createElement('img');
    icon.className = 'action-tile-icon';
    icon.src = action.icon;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'action-label';
    label.textContent = ACTION_LABELS[action.key];
    const count = document.createElement('span');
    count.className = 'action-count';
    count.hidden = true;
    button.actionLabelElement = label;
    button.actionCountElement = count;
    button.append(icon, label, count);
  } else {
    button.textContent = ACTION_LABELS[action.key];
  }
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
        if (button.actionLabelElement) {
          button.actionLabelElement.textContent = label;
          button.actionCountElement.textContent = count > 0 ? String(count) : '';
          button.actionCountElement.hidden = count === 0;
        } else {
          button.textContent = `${label} (${count})`;
        }
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
        if (button.actionLabelElement) {
          button.actionLabelElement.textContent = label;
          button.actionCountElement.textContent = count > 0 ? String(count) : '';
          button.actionCountElement.hidden = count === 0;
        } else {
          button.textContent = `${label}${suffix}`;
        }
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
  chrome.windows?.onFocusChanged?.addListener(refresh);
  return refresh;
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

  addActionListener(buttons.moveActiveTabToNewWindow, async () => {
    await chrome.runtime.sendMessage({ action: 'moveActiveTabToNewWindow' });
  });

  addActionListener(buttons.bringDomainToCurrentWindow, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      await chrome.runtime.sendMessage({ action: 'bringDomainToCurrentWindow', domain });
    }
  });

  addActionListener(buttons.bringDomainToCurrentWindowNoSubdomain, async () => {
    const domain = await getActiveTabDomain();
    if (domain) {
      await chrome.runtime.sendMessage({ action: 'bringDomainToCurrentWindowNoSubdomain', domain });
    }
  });

  addActionListener(buttons.bringToWindow, async () => {
    const [activeTab] = await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tabs);
        }
      });
    });
    if (!activeTab) {
      console.error('Cannot bring tabs to this window: no active tab was found.');
      return;
    }
    await chrome.runtime.sendMessage({
      action: 'bringToWindow',
      windowId: activeTab.windowId,
      activeTabId: activeTab.id,
    });
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
  buttonList.filter(Boolean).forEach((button) => {
    if (boundButtons.has(button)) return;
    boundButtons.add(button);
    button.addEventListener('click', listener);
  });
}

// Use the active tab as the domain source for domain-specific actions.
async function getActiveTabDomain() {
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      resolve(activeTabs);
    });
  });
  const activeUrl = tabs[0]?.url;
  const domain = extractDomain(activeUrl) || getKnownProtocolInfo(activeUrl)?.key;

  if (!domain) {
    alert('The current tab does not have a domain that can be used for this action.');
    return null;
  }

  return domain;
}
