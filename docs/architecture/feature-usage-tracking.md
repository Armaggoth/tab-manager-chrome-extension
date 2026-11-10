# Feature Usage Tracking, Threshold Suggestion & Reorder Plan

**Status**: Implemented (usage tracking, Settings "Usage" tab, threshold suggestion banner, Most Used group, and manual action pinning).

## Step 1: Track feature usage + show it in Settings

### Data model

New, separate from behavior settings:

```js
// chrome.storage.local, not sync — avoids the 100KB/8KB sync quota and this
// data doesn't need to travel across devices.
usageStats: {
  [actionName]: { count: number, lastUsedAt: number }
}
```

### Where to increment

In [service-worker.js](../../service-worker.js)'s `handleMessage`, after a case
succeeds — this is the single choke point every trigger (side panel today,
contextual menu later) already goes through, so tracking stays correct
regardless of entry point.

```js
const TRACKED_ACTIONS = new Set([
  'sortByDomain', 'groupByDomain', 'groupGoogleDocsByType', 'ungroup',
  'removeDuplicates', 'moveDomainCurrentWindow', 'moveDomainAllWindows',
  'moveUngroupedCurrentWindow', 'bringToWindow', 'closeDomainCurrentWindow',
  'closeDomainAllWindows', 'findMediaPlaying',
]);
// Debug-only actions (scrambleTabs, readCurrentDomains, readAllWindows,
// copyTabList) are intentionally excluded — they aren't real management
// features and would skew the stats.

async function recordFeatureUsage(action) {
  if (!TRACKED_ACTIONS.has(action)) return;
  const { usageStats = {} } = await chrome.storage.local.get('usageStats');
  const entry = usageStats[action] ?? { count: 0, lastUsedAt: 0 };
  usageStats[action] = { count: entry.count + 1, lastUsedAt: Date.now() };
  await chrome.storage.local.set({ usageStats });
}
```

### Settings UI

New "Usage" section in [options.html](../../options.html) (a tab or another
`<section>`, consistent with the existing Behavior/Localization layout).
[options.js](../../options.js) reads `chrome.storage.local.get('usageStats')`
directly — no message round trip needed since the options page has the same
storage access as the service worker. Render a simple sorted (desc by count)
list/table: label, count, last-used date, with a bar-width visual
(`width: {count/max * 100}%`) for at-a-glance comparison. Add a "Reset usage
stats" button.

Need a shared **action → display label** map (new small module or addition to
[utils.js](../../utils.js)) so both the Settings usage tab and the side panel
draw from one source of truth instead of duplicating strings.

### Tests

Unit tests in [test/service-worker.test.js](../../test/service-worker.test.js)
verifying `recordFeatureUsage` increments counts, updates `lastUsedAt`, and
skips debug-only actions.

## Step 2: Threshold to suggest reordering

**Implemented**: `usage.js` contains the pure ranking/threshold functions, and
the popup/side panel share a dismissible suggestion banner via `panel-actions.js`.
Accepting the suggestion stores `usageSortEnabled: true`; actual rendering changes
remain Step 3.

### Definition of "worth suggesting"

Don't nag on every click. Two guardrails:

1. **Minimum sample size** — don't evaluate until total tracked clicks ≥ some
   floor (e.g. 20), so early noise doesn't trigger a suggestion.
2. **Rank displacement** — compare the *current display order* (per group,
   top to bottom) against the *usage-rank order*. If an action several
   positions lower in usage-count actually gets used more (e.g. by a margin
   like `count ≥ 1.5×` or `+10` more) than an action currently shown above it,
   that's a candidate for promotion.

### Cooldown

Store `lastSuggestedAt` / `suggestionDismissedUntil` in `chrome.storage.local`
so the banner doesn't reappear every session once dismissed (e.g. suppress
for 14 days after "Not now").

### Where it surfaces

- **Side panel**: a small dismissible banner ("You use *Remove Duplicates* a
  lot — move it to the top?") with **Sort now** / **Not now** / **Don't ask
  again** actions.
- **Contextual menu (future)**: no banner needed there — it's a transient,
  low-commitment surface, so once the threshold trips it can just re-sort
  silently each time the menu is built, without asking.

### Opt-out

Add a toggle in the new Settings "Usage" section — "Suggest reordering based
on usage" (default on) — plus an always-available manual "Sort by usage now"
button so users don't have to wait for the threshold.

## Step 3: Implement the sort

### Side panel

**Implemented**: when `usageSortEnabled` is true, the side panel and popup prepend
a duplicate-safe "Most Used" group containing up to six actions ranked by usage. The
original categorized action groups remain below it.

Rather than reshuffling buttons within their existing categorized groups
(Sort & Group / Clean Up / Move Tabs / Close Tabs / Search & Focus — mirrors
the progressive-disclosure guidance already in
[docs/research/03-progressive-disclosure.md](../research/03-progressive-disclosure.md)
about not hiding or scrambling things unpredictably), promote the **top-N
most-used actions** into a "Most Used" group at the top of
[side-panel.html](../../side-panel.html). This keeps existing
categories/muscle memory intact while surfacing what's actually used.
Recomputed at panel load from current `usageStats` — no separate persisted
"order" needed.

### Contextual menu (future, `chrome.contextMenus` API)

Build menu items directly sorted by usage descending (no category constraint
there, so a flat top-to-bottom sort makes sense).

### Persistence of the "accepted" state

Once a user accepts a suggestion (or turns on auto-sort), store
`usageSortEnabled: true` so it applies automatically on every future load
until turned off in Settings.

### Tests

Unit tests for the ranking/promotion function on canned `usageStats`
fixtures — correct top-N selection, stable tie-breaking (fall back to
original registration order when counts are equal), and the
threshold-detection function's sample-size/margin logic.

## Manual Pins in Most Used

Users can pin and unpin actions using an icon-only control on every action row
in the popup and side panel, in either Text or Icons mode. The outlined pin
indicates an unpinned action; the solid pin indicates a pinned action. Both
states have localized accessible names and tooltips.

The `pinnedActions` array is stored in `chrome.storage.local`, separately from
usage counts. Pins therefore persist across panel reloads and browser restarts,
and resetting usage statistics does not clear them. Manually pinned actions are
ranked by usage count, with the normal action display order breaking ties.

Pinned actions appear first in Most Used. The group is filled with the most-used
unpinned actions up to six total; if more than six actions are manually pinned,
all pins remain visible. Pinned actions are not duplicated in the Text-mode
categories while promoted to Most Used. In Icons mode, category tabs retain
their full action lists as before. Unpinning clears only the manual pin, so the
action may remain in Most Used if usage sorting is enabled and it ranks among
the six most-used actions. When usage sorting is disabled and the final manual
pin is removed, the Most Used group is hidden.

Pins are local to the current Chrome profile. Login-based syncing and sharing
settings through Google Drive are separate future features and are not part of
this implementation.

Tests cover usage-based ordering, the six-action fill limit, retaining more
than six manual pins, and pin persistence/unpinning in the shared action
renderer. Both Operations surfaces refresh affected-tab counts after each
action-list render, including pin/unpin and usage updates, without registering
additional browser event listeners.
