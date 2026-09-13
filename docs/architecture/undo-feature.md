# Undo Feature Plan (Last 20 Actions)

**Status**: Planned, not implemented.

## Where state lives

Service workers unload when idle, so a plain in-memory array won't survive. Use
`chrome.storage.session` (in-memory, cleared on browser restart, ~10MB budget)
under the key `undoStack: UndoEntry[]`.

## Data model

Two snapshot shapes cover all mutating operations:

**Repositioning ops** (sort, group, groupGoogleDocsByType, ungroup, move*, bringToWindow)
— tabs still exist, only `index`/`windowId`/`groupId` changed:

```js
TabSnapshot = { tabId, windowId, index, pinned, groupId, groupTitle, groupColor }
```

Undo replays `chrome.tabs.move()` back to `{ windowId, index }` and
`chrome.tabs.group()` / `chrome.tabGroups.update()` to restore prior grouping.
If the original window was closed, recreate it with `chrome.windows.create()` first.

**Destructive ops** (removeDuplicates, closeDomainCurrentWindow, closeDomainAllWindows)
— the tab objects are gone, so `tabId` is useless:

```js
ClosedTabSnapshot = { url, pinned, index, windowId, groupTitle, groupColor }
```

Undo recreates the tab with `chrome.tabs.create({ url, pinned, index, windowId })`
and re-applies grouping. This is a re-create, not a true restore (no back/forward
history, no form/session state).

Read-only actions (`findMediaPlaying`, debug/read actions) never push snapshots.

## Capture + push flow

```js
async function withUndo(action, tabsAffectedQuery, fn) {
  const before = await captureSnapshot(action, tabsAffectedQuery);
  await fn();
  await pushUndoEntry({ action, timestamp: Date.now(), snapshot: before });
}
```

Snapshot capture happens before the operation runs; the entry is only pushed
after the operation succeeds, so a failed operation doesn't pollute history.

## Cutting the stack at 20

This is a **stack (LIFO)**, not a FIFO queue — undo always reverses the most
recent action first.

```js
async function pushUndoEntry(entry) {
  const { undoStack = [] } = await chrome.storage.session.get('undoStack');
  undoStack.push(entry);
  if (undoStack.length > 20) {
    undoStack.shift(); // drop oldest, keep newest 20
  }
  await chrome.storage.session.set({ undoStack });
}
```

When **Undo** is clicked:

1. `pop()` the last entry.
2. Apply its inverse (reposition or recreate tabs).
3. Persist the shortened stack back to storage — the entry is consumed, not
   kept for redo.

There is no redo stack in this design. If redo is added later, a new mutating
action performed after one or more undos should clear any pending redo
entries, matching standard editor behavior.

## UI

- Single "Undo last action" button in the side panel, disabled when the stack
  is empty.
- Optional small history dropdown showing the last N action names/timestamps.
- Consider a toast after each mutating action (e.g. "Sorted by domain · Undo")
  for immediate one-click undo, in addition to the persistent button.

## Pros

- Safety net for destructive actions (close/remove duplicates), which
  currently have no recovery path.
- Encourages users to try bulk operations (sort/group/move) more confidently.
- Snapshot data doubles as useful debug info (existing "Sorting Debug" panel
  already captures similar tab metadata).

## Cons / risks

- Destructive-op "undo" is a re-create, not a true restore — lost tab
  history, session state, form data, scroll position. Needs clear messaging.
- Adds capture/wrap/error-handling complexity to every mutating handler.
- `chrome.storage.session` is cleared on browser restart, so undo history
  won't survive a Chrome relaunch.
- `chrome.tabs.move` index math gets tricky with multiple tabs shifting
  indices; undo must reverse moves in the opposite order of the original
  operation to avoid index drift.
- Undoing a move/close whose target window or tab group no longer exists
  requires reconstruction logic (recreate window, recreate group).
- Storage growth: 20 entries across large tab counts could reach a few
  hundred KB. Fine under the 10MB session budget, but worth capping snapshot
  size (e.g. skip pushing undo, with a warning, for operations affecting an
  unusually large number of tabs).

## Suggested rollout

1. Implement snapshot capture + stack cutting for **repositioning** ops first
   (lower risk, fully reversible).
2. Add destructive-op recreation (`removeDuplicates`, `closeDomain*`) once the
   stack mechanics are proven.
3. Add unit tests in [test/service-worker.test.js](../../test/service-worker.test.js)
   per operation: snapshot shape, stack capped at 20, undo restores expected
   tab/group state.
