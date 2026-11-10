# Spec 001: Operations UI Modes

**Status:** Planning

## Goal

Let a user choose a **Text** or **Icons** presentation for Operations in both the popup and side panel. Text mode keeps the current sectioned action list. Icons mode replaces the vertically stacked sections with category tabs whose panels show the corresponding action icons.

## Decisions Made

- The two presentation modes are named **Text** and **Icons**.
- **Text** is the default for new and existing users.
- The mode changes presentation only. An action visible in both modes keeps the same tab-operation behavior, affected-tab count, tooltip, accessible name, and service-worker message.
- Text mode shows the complete action set.
- Icons mode keeps every action available, organized into tabs rather than a long vertically stacked list.
- The first tab is **Most Used**. It is selected whenever the popup or side panel opens and shows up to five actions ranked from the existing usage statistics.
- When there are no usage entries, Most Used shows an empty state explaining that actions will appear as the user uses the extension, with a direct **Switch to Text** control that immediately changes and saves the presentation mode.
- In Text mode, prompt the user to switch to Icons the first time usage data makes Most Used non-empty. Offer **Switch to Icons** and **Not now**; remember the response so the prompt does not nag after dismissal.
- Each remaining tab corresponds to one existing `ACTION_GROUPS` section: Sort & Group, Clean Up, Move Tabs, Search & Focus, and Close Tabs.
- Action icons use the supplied, matching icon files in `assets/icons/{16,48,128}`. The earlier animal-themed proposal is superseded by these assets.
- Users select the mode on the existing Settings page, not in the popup or side panel.
- Settings uses a two-choice radio group, rather than a dropdown, so Text and Icons are both visible and exactly one mode is selected.
- Every action tile retains a visible, concise text label. This is important for similar actions whose scope differs, such as current-window vs all-windows and domain vs base-domain.
- Tooltips, localized accessible names, and affected-tab counts remain available in Icons mode.
- Per-action visibility and custom ordering remain separate P2 work; the Most Used ranking is automatic and does not hide actions from their category tabs.

## UX and Design

- [ ] Design the selected and unselected Text/Icons radio group in Settings, using a supplied action icon as the Icons preview.
- [ ] Design a single-row tab strip with a persistent Most Used tab first, followed by one tab for each current action group.
- [ ] Give each category tab a representative supplied 16px icon and a concise visible label; add a dedicated Most Used tab icon if the action set has no suitable match.
- [ ] Design compact action tiles using the supplied 48px action icons, visible action labels, and a distinct text count treatment that does not cover the icon.
- [ ] Design the empty Most Used state to explain that actions appear as the user uses the extension, including a direct Switch to Text control.
- [ ] Design a one-time Text-mode prompt for when Most Used first has usage data, with Switch to Icons and Not now actions.
- [ ] Specify selected, hover, keyboard-focus, disabled, dark-mode, high-contrast, and reduced-motion states. Use more than color alone to show tab selection and destructive actions.
- [ ] Confirm the tab strip and action tiles fit the narrow popup and resizable side panel; keep all tabs discoverable without horizontal scrolling or clipping.

## Research and Rationale

- The existing [tab UI research](../../research/01-tab-ui-patterns.md) recommends tabs for a small number of clear categories, short labels, putting the most-used content first, and keeping the tab strip directly above its panel. The planned six tabs are a deliberate upper bound; test the popup width before implementation.
- The [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) requires a `tablist`, `tab` and `tabpanel` relationships, `aria-selected`, and keyboard navigation. Since all panels can be rendered locally without network or data loading, use automatic activation as focus moves between tabs.
- Chrome's [extension UI components](https://developer.chrome.com/docs/extensions/develop/ui) describe popups as quick feature launchers and side panels as companions to the current page. The [popup guidance](https://developer.chrome.com/docs/extensions/develop/ui/add-popup) notes that popups close when focus leaves them, so tab switching must remain in-place and actions should stay one click away.
- Chrome's [accessibility guidance](https://developer.chrome.com/docs/extensions/develop/ui/a11y) recommends standard HTML controls and meaningful accessible names. Keep action tiles as native buttons, with the icon decorative to assistive technology when the button already has a complete accessible name.

## Implementation Plan

1. **Confirm asset contract.** The current icon set covers all 18 action IDs in `ACTION_GROUPS` at 16px, 48px, and 128px. Add icon-path metadata to the shared action definitions rather than maintaining a separate action-to-icon list. Choose representative small icons for the five category tabs and create a Most Used tab icon only if no existing icon fits.
2. **Add mode setting.** Add `operationsUiMode` to `chrome.storage.sync`, with `text` as the default for existing and new users. Add a localized Text/Icons radio group to the existing Settings page; do not confuse it with the existing Popup/Side Panel access-mode setting.
3. **Extend the shared renderer.** Keep `ACTION_GROUPS` as the sole source of action identity and behavior. Text mode continues to render the current groups. Icons mode renders a tablist and associated panels, plus icon tiles for each action in its existing group. Keep unique DOM IDs for actions repeated in Most Used and their category panel, and wire both instances through the existing action handlers.
4. **Build Most Used and the mode prompt.** Reuse `getMostUsedActions` and its stable tie-breaking order. The tab is always first and selected on open, updates when usage statistics or manual pins change, and never removes actions from their category panels. Show up to six actions ranked by usage plus all manually pinned actions; pinned actions appear first and the group may exceed six when there are more than six pins. With no usage entries or pins, show the explanatory empty state and a direct Switch to Text control instead of fabricated usage data. In Text mode, show a one-time Switch to Icons / Not now prompt when Most Used first becomes non-empty, and persist the user's response.
5. **Preserve action clarity.** Keep a visible label and affected-tab count on each tile. Use the existing tooltip and provide localized accessible names that state the action and scope. Preserve action IDs, service-worker messages, and behavior across modes.
6. **Implement accessible tabs and responsive styling.** Use native tab buttons with `role="tab"`, `aria-controls`, `aria-selected`, and a roving tab stop; connect each panel with `role="tabpanel"` and `aria-labelledby`. Support Left/Right Arrow and Home/End navigation, visible focus, and automatic activation. Keep the tab strip on one row, use a scrollable active panel where needed, and retain dark, high-contrast, and reduced-motion support.
7. **Verify both surfaces.** Add DOM tests for default and saved mode, tab selection and keyboard behavior, action uniqueness/wiring, usage ranking, the empty state and direct mode switch, the one-time prompt and its persistence, live counts, and English/Spanish localization. Manually test the popup and side panel at narrow and wide sizes, with keyboard and screen reader, including destructive actions and all scope variants.

## Engineering and Code

- [ ] Add an `operationsUiMode` setting in `chrome.storage.sync`, defaulting to `text` for existing users.
- [ ] Implement the agreed Text/Icons radio group in the existing options page and localize its user-facing strings in English and Spanish.
- [x] Keep `ACTION_GROUPS` as the single action registry.
- [ ] Add supplied icon paths and category-tab metadata to the shared action registry; render it as Text groups or tabbed icon panels without duplicate action lists.
- [ ] Pass the saved mode through the shared popup and side-panel renderer.
- [ ] Derive the Most Used panel from the top six actions in usage statistics and manual pins, retaining all manual pins and category panels, and rendering the explanatory empty state when neither usage nor pins exist.
- [ ] Provide a direct Switch to Text control in the empty state and persist the mode change.
- [ ] Prompt once in Text mode to switch to Icons when Most Used first becomes non-empty; persist acceptance or dismissal.
- [x] Preserve current action IDs, service-worker messages, affected-tab counts, tooltips, and ARIA labels in the shared renderer used by both surfaces.
- [ ] Verify action IDs, service-worker messages, affected-tab counts, tooltips, and ARIA labels remain stable across Text and Icons modes.

## Accessibility

- [x] Use native buttons for every action.
- [ ] Give icon-only controls a localized accessible name that states the action and its destination or scope.
- [ ] Make the empty-state mode-switch control and the Text-mode suggestion keyboard accessible and clearly named.
- [ ] Preserve keyboard order and visible focus when the user selects a mode or reopens either Operations surface.
- [ ] Ensure icons, action counts, selected-state indicators, and destructive-action styling are understandable without color or visual icons alone.
- [ ] Meet WCAG AA contrast for text, focus indicators, and disabled states in light, dark, and high-contrast modes.
- [x] Respect reduced-motion preferences for CSS animations and transitions in the popup, side panel, and Settings page.

## Testing

- [x] Test current action rendering/wiring and affected-tab counts.
- [ ] Add unit/DOM tests for the default mode, saved-mode rendering, and stable action wiring in both modes.
- [ ] Test the empty state, direct switch to Text, and one-time switch-to-Icons prompt behavior.
- [ ] Verify localization keys exist in both locale files.
- [ ] Manually test mode persistence, keyboard navigation, focus visibility, hover tooltips, and action counts in the popup and side panel.
- [ ] Test both modes with a screen reader and keyboard only; confirm accessible names, action order, state announcements, and focus recovery.
- [ ] Manually confirm each action shared by both modes still performs the same operation.

## Done When

- A user can select Text or Icons in Settings and sees that choice after reopening either Operations surface.
- With no usage history, Most Used explains how it will populate and offers a direct return to Text; once it populates, Text mode prompts the user to try Icons.
- Every displayed action is understandable and keyboard accessible; actions shared by both modes are behaviorally identical.
- Configurable action visibility and least-used-action hiding remain out of scope; they are separate P2 requirements.

## Continue From Here

Next, confirm that the six-tab navigation fits the popup without hiding categories and finalize the empty-state and prompt copy. Then implement the shared renderer and mode setting.

## Separate Future Feature: Text-Mode Icons

**Priority:** P2, separate from the Text/Icons presentation modes above.

**Goal:** Let users optionally show the matching 16x16 action icon beside each existing text label while keeping Text mode's sectioned layout.

- [ ] Add a localized Settings option, persisted in `chrome.storage.sync`, to show or hide action icons in Text mode; default to hidden to preserve the current appearance.
- [ ] Reuse the matching 16px files from `assets/icons/16/` through the shared action metadata.
- [ ] Keep action labels, counts, tooltips, accessible names, grouping, and behavior unchanged; treat the adjacent icon as decorative for assistive technology.
- [ ] Test the setting in both the popup and side panel, including persistence, keyboard/screen-reader behavior, and narrow layouts.

This enhancement does not add category tabs or replace visible action text. It can be implemented independently after the primary mode switch is complete.
