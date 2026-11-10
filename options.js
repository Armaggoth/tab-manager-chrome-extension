// Options page logic
import { ACTION_LABELS } from './utils.js';
import { USAGE_SUGGESTION_DEFAULTS } from './usage.js';

const ignorePinnedTabsCheckbox = document.getElementById('ignore-pinned-tabs');
const detectDuplicateDocsCheckbox = document.getElementById('detect-duplicate-docs');
const badgeEnabledCheckbox = document.getElementById('badge-enabled');
const accessModeRadios = document.querySelectorAll('input[name="access-mode"]');
const operationsUiModeRadios = document.querySelectorAll('input[name="operations-ui-mode"]');
const languageSelect = document.getElementById('language-select');
const resetBtn = document.getElementById('reset-btn');
const statusMessage = document.getElementById('status');
const usageList = document.getElementById('usage-list');
const usageEmptyMessage = document.getElementById('usage-empty-message');
const resetUsageBtn = document.getElementById('reset-usage-btn');
const usageSuggestionsEnabledCheckbox = document.getElementById('usage-suggestions-enabled');
const usageSortEnabledCheckbox = document.getElementById('usage-sort-enabled');

const DEFAULTS = {
  ignorePinnedTabs: true,
  detectDuplicateGoogleDocs: true,
  badgeEnabled: true,
  accessMode: 'sidePanel',
  operationsUiMode: 'text',
  language: 'en',
};

function localizeOperationsMode() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const message = chrome.i18n?.getMessage(element.dataset.i18n);
    if (message) element.textContent = message;
  });
}

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    ignorePinnedTabsCheckbox.checked = items.ignorePinnedTabs;
    detectDuplicateDocsCheckbox.checked = items.detectDuplicateGoogleDocs;
    badgeEnabledCheckbox.checked = items.badgeEnabled;
    accessModeRadios.forEach((radio) => {
      radio.checked = radio.value === items.accessMode;
    });
    operationsUiModeRadios.forEach((radio) => {
      radio.checked = radio.value === items.operationsUiMode;
    });
    languageSelect.value = items.language;
  });
}

// Save settings
function saveSettings() {
  const selectedAccessMode = document.querySelector('input[name="access-mode"]:checked');
  const selectedOperationsUiMode = document.querySelector('input[name="operations-ui-mode"]:checked');
  const settings = {
    ignorePinnedTabs: ignorePinnedTabsCheckbox.checked,
    detectDuplicateGoogleDocs: detectDuplicateDocsCheckbox.checked,
    badgeEnabled: badgeEnabledCheckbox.checked,
    accessMode: selectedAccessMode ? selectedAccessMode.value : DEFAULTS.accessMode,
    operationsUiMode: selectedOperationsUiMode
      ? selectedOperationsUiMode.value
      : DEFAULTS.operationsUiMode,
    language: languageSelect.value,
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved!', 'success');
  });
}

// Show status message
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 2000);
}

// Render feature usage counts, sorted most-used first.
function loadUsageStats() {
  chrome.storage.local.get({ usageStats: {} }, ({ usageStats }) => {
    const entries = Object.entries(usageStats).sort((a, b) => b[1].count - a[1].count);

    usageList.replaceChildren();
    usageEmptyMessage.hidden = entries.length > 0;

    const maxCount = entries.length > 0 ? entries[0][1].count : 0;
    for (const [action, stat] of entries) {
      usageList.appendChild(renderUsageItem(action, stat, maxCount));
    }
  });
}

function loadUsagePreferences() {
  chrome.storage.local.get(USAGE_SUGGESTION_DEFAULTS, (items) => {
    usageSuggestionsEnabledCheckbox.checked = items.usageSuggestionsEnabled;
    usageSortEnabledCheckbox.checked = items.usageSortEnabled;
  });
}

function saveUsagePreferences() {
  const updates = {
    usageSuggestionsEnabled: usageSuggestionsEnabledCheckbox.checked,
    usageSortEnabled: usageSortEnabledCheckbox.checked,
  };
  if (usageSuggestionsEnabledCheckbox.checked) {
    updates.usageSuggestionDismissedUntil = 0;
  }

  chrome.storage.local.set(
    updates,
    () => {
      showStatus('Usage settings saved!', 'success');
    }
  );
}

function renderUsageItem(action, stat, maxCount) {
  const item = document.createElement('li');
  item.className = 'usage-item';

  const header = document.createElement('div');
  header.className = 'usage-item-header';

  const label = document.createElement('span');
  label.textContent = ACTION_LABELS[action] || action;

  const count = document.createElement('span');
  count.className = 'usage-item-count';
  count.textContent = `${stat.count} use${stat.count === 1 ? '' : 's'}`;

  header.append(label, count);

  const barTrack = document.createElement('div');
  barTrack.className = 'usage-item-bar-track';
  const barFill = document.createElement('div');
  barFill.className = 'usage-item-bar-fill';
  barFill.style.width = `${maxCount > 0 ? (stat.count / maxCount) * 100 : 0}%`;
  barTrack.appendChild(barFill);

  item.append(header, barTrack);
  return item;
}

// Event listeners
ignorePinnedTabsCheckbox.addEventListener('change', saveSettings);
detectDuplicateDocsCheckbox.addEventListener('change', saveSettings);
badgeEnabledCheckbox.addEventListener('change', saveSettings);
accessModeRadios.forEach((radio) => radio.addEventListener('change', saveSettings));
operationsUiModeRadios.forEach((radio) => radio.addEventListener('change', saveSettings));
languageSelect.addEventListener('change', saveSettings);
usageSuggestionsEnabledCheckbox.addEventListener('change', saveUsagePreferences);
usageSortEnabledCheckbox.addEventListener('change', saveUsagePreferences);

resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.set(DEFAULTS, () => {
      loadSettings();
      showStatus('Settings reset to defaults!', 'success');
    });
  }
});

resetUsageBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset usage stats?')) {
    chrome.storage.local.set({ usageStats: {} }, () => {
      loadUsageStats();
      showStatus('Usage stats reset!', 'success');
    });
  }
});

// Load usage stats on page load
localizeOperationsMode();
loadUsageStats();
loadUsagePreferences();

// Load settings on page load
loadSettings();
