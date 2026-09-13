# Spec 001: Operations UI Modes

**Status:** Planning

## Goal

Let a user choose a **Text** or **Icons** presentation for Operations in both the popup and side panel.

## Decisions Made

- The two presentation modes are named **Text** and **Icons**.
- **Text** is the default for new and existing users.
- The mode changes presentation only. An action visible in both modes keeps the same tab-operation behavior, affected-tab count, tooltip, accessible name, and service-worker message.
- Text mode shows the complete action set.
- Icons mode shows a smaller, curated action set because illustrated controls require more space.
- Users select the mode on the existing Settings page, not in the popup or side panel.
- Settings uses a two-choice radio group, rather than a dropdown, so Text and Icons are both visible and exactly one mode is selected.
- The `Icons` radio choice includes a descriptive animal-themed preview icon and retains its text label.
- Each action icon uses a consistent animal-themed visual language and visibly communicates the action's purpose. The [icon proposal](../../../assets/icons%20proposal.jpeg) is visual inspiration only; do not copy its artwork.
- Icons mode keeps text where an icon alone cannot clearly communicate an action's scope or outcome. Tooltips and localized accessible names remain required for every action.
- Per-action visibility, ordering, and suggestions to hide least-used actions are separate P2 work; they do not belong in this P1 feature.

## UX and Design

- [ ] Design the selected and unselected presentation of the agreed Text/Icons radio group in Settings.
- [ ] Create the agreed descriptive animal-themed preview icon for the `Icons` radio choice.
- [ ] Design a compact, distinct animal-themed icon for every action. Each icon must communicate its purpose, remain consistent and legible at compact UI sizes, and use a visible text fallback where its scope or outcome could be ambiguous.
- [ ] Specify selected, hover, keyboard-focus, disabled, dark-mode, high-contrast, and reduced-motion states.
- [ ] Confirm the layout works in both the narrow popup and resizable side panel without clipping action labels or counts.
- [ ] Review the icon mode for discoverability before implementation.

## Engineering and Code

- [ ] Add an `operationsUiMode` setting in `chrome.storage.sync`, defaulting to `text` for existing users.
- [ ] Implement the agreed Text/Icons radio group in the existing options page and localize its user-facing strings in English and Spanish.
- [ ] Keep `ACTION_GROUPS` as the single action registry; render its metadata as text or icon mode instead of maintaining duplicate action lists.
- [ ] Pass the saved mode through the shared popup and side-panel renderer.
- [ ] Keep action IDs, service-worker messages, affected-tab counts, tooltips, and ARIA labels stable across modes.

## Accessibility

- [ ] Use native buttons for every action; icon-only controls must have a localized accessible name that states the action and its destination or scope.
- [ ] Preserve keyboard order and visible focus when the user selects a mode or reopens either Operations surface.
- [ ] Ensure icons, action counts, selected-state indicators, and destructive-action styling are understandable without color or visual icons alone.
- [ ] Meet WCAG AA contrast for text, focus indicators, and disabled states in light, dark, and high-contrast modes.
- [ ] Respect reduced-motion preferences for any mode-change or action-list transition.

## Testing

- [ ] Add unit/DOM tests for the default mode, saved-mode rendering, and stable action wiring in both modes.
- [ ] Verify localization keys exist in both locale files.
- [ ] Manually test mode persistence, keyboard navigation, focus visibility, hover tooltips, and action counts in the popup and side panel.
- [ ] Test both modes with a screen reader and keyboard only; confirm accessible names, action order, state announcements, and focus recovery.
- [ ] Manually confirm each action shared by both modes still performs the same operation.

## Done When

- A user can select Text or Icons in Settings and sees that choice after reopening either Operations surface.
- Every displayed action is understandable and keyboard accessible; actions shared by both modes are behaviorally identical.
- Configurable action visibility and least-used-action hiding remain out of scope; they are separate P2 requirements.

## Continue From Here

The next decision is the initial curated action set for Icons mode. Choose the few actions that remain immediately visible when Icons is selected; the later P2 visibility controls will let users customize that set.