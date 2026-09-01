# Design Documentation

This folder contains documentation about Tab Manager's UI design, patterns, and decisions.

## Contents

- **Coming Soon**: UI component patterns
- **Coming Soon**: Design system
- **Coming Soon**: Accessibility guidelines
- **Coming Soon**: Responsive design patterns

---

## Recommended UI Structure

Based on research and best practices, the following is the planned post-MVP UI reorganization. The current side panel remains a single responsive, scrollable action view:

### Planned Interface Direction: Popup + Side Panel Modes

Adopt a compact action interface similar to **Extract Tabs - Domain**, while keeping this extension's current operation set and Google Workspace rules.

**Goal**: Let the user choose whether the primary interface opens as a toolbar popup or as the existing Chrome side panel.

**Default proposal**:
- Use the toolbar popup as the fast-access interface for common actions.
- Keep the side panel as the expanded workspace for longer task flows, settings access, and future tab overview utilities.
- Store the preferred launch mode in `chrome.storage.sync`, for example `interfaceMode: "popup" | "sidePanel"`.
- Let the user configure which actions appear in each display mode, for example `visibleActions.popup` and `visibleActions.sidePanel`.

**Primary popup layout**:
- Header with extension name and optional current-domain context.
- Actions tab with concise grouped sections:
	- Domain Actions: Move current domain, Move current domain from all windows, Close current domain, Close current domain from all windows.
	- Organize: Sort by Domain, Group by Domain, Group Google Docs by Type, Ungroup.
	- Cleanup: Remove Duplicates, Move Ungrouped to New Window, Bring All to This Window.
- Stats tab for lightweight counts later: total tabs, total windows, current-domain matches, top domains.
- Settings tab or link to the existing options page.

**Screenshot-inspired complete UI**:
- Use a left navigation rail in the side-panel layout with four destinations: Operations, Stats, Settings, and About.
- Use the popup layout as the same information architecture compressed into top tabs or segmented navigation.
- Operations view:
	- Show two domain-action rows: active window and all windows.
	- Each row should expose paired Move and Close buttons.
	- Buttons should use icons plus labels, with destructive Close buttons styled distinctly.
	- Show the active context below the action rows: active domain or Google editor type, active-window match count, all-window match count, and total window count.
	- For Google editor tabs, display the resolved type label such as Google Docs or Google Sheets instead of only `docs.google.com`.
- Stats view:
	- Show total windows, total tabs, average tabs per window, current-domain count, all-window current-domain count, top domains, duplicate count, and audible/heavy tab count.
	- Keep actions in stats contextual and non-destructive by default, such as focus tab, copy URL, or open duplicate set in a new window.
- Settings view:
	- Keep current behavior settings, including Ignore Pinned Tabs and Detect Duplicate Google Docs.
	- Add interface launch mode: Popup or Side Panel.
	- Add per-mode action visibility controls for popup and side panel.
	- Add any future badge settings if badge counters are implemented.
- About view:
	- Show extension name, version from `manifest.json`, and a one-sentence purpose statement.
	- Show a short local-first privacy note: tab data is read only to perform requested actions and is not sent to external services.
	- List the main permissions in plain language: tabs, tab groups, windows, side panel, and storage.
	- Provide links or buttons for documentation, source/repository, issue reporting, and feedback when available.
	- Include an optional changelog or "What's new" entry for the current release.
	- Include reset/help affordances only if they do not duplicate Settings controls.
	- Keep decorative imagery optional and avoid shrinking the operations area in compact popup mode.
	- In popup mode, keep About concise and scroll-free when possible.
	- In side-panel mode, allow a fuller About page with privacy, permissions, and troubleshooting sections.

**Context data needed for the UI**:
- Active tab domain or Google editor type key.
- Active-window matching count and total active-window tab count.
- All-window matching count and total tab count.
- Total window count.
- Current settings and visible action configuration.
- Optional stats data: top domains, duplicates, oldest tab, audible tabs, discarded tabs.

**Side panel layout**:
- Reuse the same action sections and components as the popup.
- Allow more breathing room for future utilities like tab search, duplicate review, domain stats, and visible result summaries.
- Keep destructive actions visually distinct and confirmation-gated.

**Per-mode action visibility**:
- Add configuration for each action so the popup and side panel can show different subsets.
- Default popup actions should favor fast, common tasks such as Move Domain, Remove Duplicates, and Bring All to This Window.
- Default side-panel actions should include the complete operation set unless the user hides specific actions.
- Store visibility preferences by stable action IDs rather than display text, so localization does not affect settings.
- Keep hidden actions available in settings so a user can restore them without resetting all preferences.

**Implementation plan**:
1. Extract shared UI action rendering into reusable markup/style conventions that can be used by both `side-panel.html` and a new `popup.html`.
2. Add `popup.html`, `popup.js`, and `popup.css` or share the existing side-panel assets if the styles remain compatible.
3. Update `manifest.json` with `action.default_popup` for popup mode support.
4. Add an interface-mode setting in the options page.
5. Add per-display-mode action visibility settings in the options page.
6. Add a read-only stats/context message in the service worker for active domain/type, counts, totals, and top-level stats.
7. Implement the Operations view first because it maps directly to validated behavior.
8. Implement Stats, Settings, and About as separate views after Operations is stable.
9. When side-panel mode is selected, configure action click behavior to open the side panel and avoid showing the popup as the main path.
10. When popup mode is selected, use the popup as the primary action surface and keep a button/link to open the side panel for expanded workflows.
11. Keep all action behavior behind the existing service-worker message API so UI mode changes do not fork business logic.
12. Add unit or DOM smoke tests once the UI is split; manual Chrome validation must cover both launch modes, contextual counts, settings persistence, and hidden-action restoration.

**Constraints**:
- Do not change tab-operation semantics as part of this UI redesign.
- Do not reintroduce the debug controls into the visible UI.
- Do not hardcode action visibility separately in popup and side-panel markup; both modes should read from the same action registry/config model.
- Keep localization updates paired across English and Spanish for every user-facing string.
- Preserve keyboard navigation, focus states, ARIA labels, reduced motion support, and high contrast support.

**Open decision**: Chrome action behavior may need a practical compromise because `default_popup` and programmatic side-panel opening compete for the toolbar click. Validate whether switching modes should be implemented by updating `chrome.action.setPopup()` at runtime, by using a side-panel button inside the popup, or by making popup the toolbar default while side panel remains explicitly opened from the popup.

### Hybrid Model: Tabs + Accordions + Progressive Disclosure

**Tab 1: Quick Actions** (Most-used operations, expanded by default)
- Sort by Domain
- Remove Duplicates

**Accordions** (Secondary operations, collapsed by default)
- More Organization (Group, Ungroup)
- Move & Consolidate (Move to new window, Bring all here)
- Cleanup & Closing (Close tabs)

**Tab 2: Settings** (User preferences)
- Ignore Pinned Tabs
- Language selection

---

## Related Research

For detailed design rationale and best practices, see:
- [Research: Feature Grouping Strategy](../research/05-feature-grouping-strategy.md) – Detailed recommendations
- [Research: Tab UI Patterns](../research/01-tab-ui-patterns.md) – Tab design best practices
- [Research: Progressive Disclosure](../research/03-progressive-disclosure.md) – Feature prioritization
- [Research: Accordions & Collapsible Content](../research/04-accordions-collapsible.md) – Expandable patterns

---

## Accessibility

All design patterns must support:
- Keyboard navigation (Tab, Arrow keys, Enter/Space)
- Screen readers (ARIA labels and roles)
- Focus management with visible indicators
- Color contrast (WCAG AA)
- Reduced motion preferences
