// Popup UI logic — same actions as the side panel, in a smaller launcher window.
import {
  getActionButtons,
  initActionButtons,
  initAffectedTabCounts,
  initPinnedTabsCue,
  initUsageSuggestion,
  renderConfiguredActionGroups,
} from './panel-actions.js';

await renderConfiguredActionGroups(document.getElementById('actions-grid'));

const buttons = getActionButtons({
  settings: document.getElementById('settings-btn'),
});

initActionButtons(buttons);
initPinnedTabsCue();
initAffectedTabCounts();
initUsageSuggestion({ afterSortEnabled: () => location.reload() });
