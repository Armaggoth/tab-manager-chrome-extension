// Popup UI logic — same actions as the side panel, in a smaller launcher window.
import {
  getActionButtons,
  initActionButtons,
  initAffectedTabCounts,
  initPinnedTabsCue,
  initUsageSuggestion,
  renderConfiguredActionGroups,
} from './panel-actions.js';

const refreshAffectedTabCounts = await initAffectedTabCounts();
await renderConfiguredActionGroups(document.getElementById('actions-grid'), async () => {
  const buttons = getActionButtons({
    settings: document.getElementById('settings-btn'),
  });
  initActionButtons(buttons);
  await refreshAffectedTabCounts();
});
initPinnedTabsCue();
initUsageSuggestion({ afterSortEnabled: () => location.reload() });
