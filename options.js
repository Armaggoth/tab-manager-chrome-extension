// Options page logic
const ignorePinnedTabsCheckbox = document.getElementById('ignore-pinned-tabs');
const detectDuplicateDocsCheckbox = document.getElementById('detect-duplicate-docs');
const languageSelect = document.getElementById('language-select');
const resetBtn = document.getElementById('reset-btn');
const statusMessage = document.getElementById('status');

const DEFAULTS = {
  ignorePinnedTabs: true,
  detectDuplicateGoogleDocs: true,
  language: 'en',
};

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    ignorePinnedTabsCheckbox.checked = items.ignorePinnedTabs;
    detectDuplicateDocsCheckbox.checked = items.detectDuplicateGoogleDocs;
    languageSelect.value = items.language;
  });
}

// Save settings
function saveSettings() {
  const settings = {
    ignorePinnedTabs: ignorePinnedTabsCheckbox.checked,
    detectDuplicateGoogleDocs: detectDuplicateDocsCheckbox.checked,
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

// Event listeners
ignorePinnedTabsCheckbox.addEventListener('change', saveSettings);
detectDuplicateDocsCheckbox.addEventListener('change', saveSettings);
languageSelect.addEventListener('change', saveSettings);

resetBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.set(DEFAULTS, () => {
      loadSettings();
      showStatus('Settings reset to defaults!', 'success');
    });
  }
});

// Load settings on page load
loadSettings();
