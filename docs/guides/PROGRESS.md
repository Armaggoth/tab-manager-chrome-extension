# Development Progress

## Current Status: Testing & Polish

### Completed (Chat #1 - 2026-05-07)

#### Scaffolding & Setup

- Manifest v3 configuration
- Side panel UI with all 13 action buttons (full HTML/CSS/JS)
- Options page (settings: ignore pinned tabs, language)
- Service worker with utility functions (`extractDomain`, `detectGoogleDocsType`)
- Localization files (English & Spanish)
- Full A11y implementation (semantic HTML, ARIA, keyboard nav, dark/high-contrast/reduced-motion)
- Documentation (README.md, SETUP.md, CLAUDE.md)
- Git initialized and pushed to https://github.com/Armaggoth/tab-manager-chrome-extension.git

### Completed (Chat #2 - 2026-06-04)

**Google Docs Duplicate Detection Feature**
- Added `extractGoogleDocsId()` utility function to extract document ID from Google Docs URLs
- Added `detectDuplicateGoogleDocs` setting to options page with checkbox UI
- Implemented setting persistence via `chrome.storage.sync`
- Added localization strings (English & Spanish) for the new setting
- Updated CLAUDE.md and this progress tracker with new requirements

### Completed (Chat #3 - 2026-06-04)

**Core Logic Implementation - All 12 Service Worker Message Handlers**
- Implemented `chrome.runtime.onMessage.addListener()` in service-worker.js
- Sort tabs by domain
- Group tabs by domain (with ignoreSubdomain option)
- Ungroup tab groups
- Remove duplicate tabs (with detectDuplicateGoogleDocs support)
- Move domain tabs (current window) -> new window
- Move domain tabs (all windows) -> new window
- Move ungrouped current-window tabs -> new window
- Bring all tabs to current window
- Close domain tabs (current window)
- Close domain tabs (all windows)
- Find and focus currently playing media tab
- Added helper functions: `filterTabs()`, `getSettings()`, `queryTabs()`, `moveTabs()`
- Handlers respect user settings where applicable; normal sorting and grouping always protect existing groups

### Completed (Chat #4 - 2026-09-11)

**Move Tabs Clarity and Operations UI Mode Planning**
- Clarified the Move Tabs labels to state when tabs move to a new window, and added action-specific tooltips in the shared popup and side-panel action renderer.
- Made the popup width content-driven so longer Move Tabs labels are not ellipsized.
- Added focused DOM coverage for all Move Tabs labels and tooltips; `node --test test/panel-actions.test.js` passed with 6 tests.
- Reorganized outstanding requirements into P1-P5 active, queued, and deferred roadmap sections.
- Added [Spec 001: Operations UI Modes](../specs/spec001/README.md) as the source of truth for its decisions and pending work, linked it from the documentation indexes, and added an extension-wide accessibility improvement requirement.

## Testing & Manual Validation

- [ ] Execute the detailed [Manual Test Plan](MANUAL-TEST-PLAN.md) by settings profile and feature
- [x] Add and pass unit tests for Sort by Domain, Remove Duplicates, and Move Ungrouped to New Window
- [ ] Test each remaining operation in Chrome locally
- [x] Test Sort by Domain in Chrome with Ignore Pinned Tabs checked and unchecked
- [x] Test Group by Domain in Chrome, including repeated-click idempotency
- [x] Test Group by Domain (No Subdomain) in Chrome
- [x] Test Ungroup in Chrome locally
- [x] Verify pinned-tab filtering and grouped-tab protection for tested operations
- [x] Test Remove Duplicates in Chrome locally
- [ ] Test Google Docs duplicate detection
- [ ] Verify move/close operations work across multiple windows
- [ ] Test media finding functionality
- [x] Investigate and fix the Sort by Domain defects involving special tabs, repeated clicks, and pinned-tab preservation (checked and unchecked Ignore Pinned Tabs retests passed)

## Completed Supporting Tasks

- [x] Do not create groups with a single tab; skip singleton group buckets to avoid noisy UX
- [x] Add a feature to move all ungrouped tabs in the current window to a new browser window
- [x] Use the active tab automatically for domain actions instead of a `prompt()` domain-selection dialog
- [x] Hide temporary usage-count numbers beside actions in both the popup and side panel while retaining usage statistics in Settings
- [x] Show the number of tabs that each action would affect directly on each action button; omit the count when it is zero
- [x] Add a visual cue in the popup and side panel when pinned tabs are being ignored, using the no-pin PNG with an explanatory tooltip
- [x] Add separate visible buttons for Move Domain (Current Window, No Subdomain) and Move Domain (All Windows, No Subdomain), using the existing no-subdomain matching logic, including Google Docs handling, without duplicating classification rules
- [x] Add icon assets to `/assets/` (16x16, 48x48, 128x128 transparent PNG)
- [x] Add a settings option (`accessMode`) and a `popup.html`/`popup.js` launcher, so the toolbar icon can open either the side panel or a popup listing the exact same actions (list-based UI as a starting point; visual design still to be decided)
- [x] Remove temporary usage-count numbers from the popup and side panel before shipping

## Requirements Roadmap

P1-P2 are active priorities. P3 is intentionally queued after them. P4-P5 are deferred and should not be implemented until their prerequisites are complete.

### P1: Current UI Direction

- [ ] Implement [Spec 001: Operations UI Modes](../specs/spec001/README.md)
- [ ] Improve the text-based Operations UI with a more visual, user-friendly horizontal layout based on researched Chrome extension UI best practices

### P2: Configurable Operations

- [ ] Build the icon-based Operations UI with a smaller configurable action set, supporting most-used ordering or explicit user selection in Settings
- [ ] Add an Operations configuration tab with a checkbox for every action, allowing users to show or hide it in the popup and side-panel UI
- [ ] Suggest hiding least-used actions from the popup and side-panel UI, using the per-action visibility controls above as a prerequisite

### P3: Settings Completion

- [ ] Keep Operations as the main popup/side-panel view; add Stats, Settings, and About as tabs in the settings window
- [ ] Add the core About tab with version, description, permissions, privacy, and documentation; defer feedback and changelog details
- [ ] Complete an extension-wide accessibility improvement pass across the popup, side panel, options page, and user feedback, covering semantic structure, accessible names, keyboard flow, focus states, contrast, screen-reader behavior, and reduced motion

### P4: Deferred Polish and Exploration

- [ ] Add error handling/user feedback (toast messages) - deferred until after the core UI and move features
- [ ] Add configurable toolbar badge showing how many windows would be affected by the active action/domain context - deferred because the badge meaning is currently ambiguous
- [ ] Evaluate local Playwright automation to reduce manual extension reloads - defer; use the current Node tests and manual Chrome validation until feature work is complete

### P5: Deferred Release Work

- [ ] Build and package for distribution - deferred until the remaining features and Chrome validation are complete
- [ ] Complete the [Chrome Web Store publishing guide](CHROME-WEB-STORE-PUBLISHING.md), including developer account setup, dedicated email decision, listing assets, privacy disclosures, and review submission - deferred until feature work is complete

## Completed Grouping Safety Change

Grouped tabs are protected across standard organization operations and broad cleanup operations (Sort, Group, Move Ungrouped, Remove Duplicates). Domain move and close actions are explicit exceptions: they affect all same-domain tabs, including grouped tabs, to match the expected one-click domain extraction behavior. The former `ignoreGroupedTabs` setting was removed because making protection optional was unsafe:

1. [x] Separate grouped tabs from ungrouped tabs for normal sorting and grouping.
2. [x] Leave grouped tabs in their existing groups and positions.
3. [x] Sort only eligible ungrouped pinned and unpinned tabs within their own regions.
4. [x] Group only eligible ungrouped tabs.
5. [x] Preserve existing groups; create a separate group for ungrouped matches instead of merging.
6. [x] Make repeated sorting and grouping operations no-ops after the desired state is reached.
7. Reserve changes to existing groups for a future, explicitly named `Regroup All Tabs` action.
8. [x] Add unit tests for grouped-tab protection and repeated grouping before manual Chrome tests.

Grouped-tab protection is now unconditional for operations that use `filterTabs()` / `filterUngroupedTabs()`. Domain move and close actions use a domain-action filter so grouped same-domain tabs can be handled intentionally.

## Advanced Features

### Custom Domain Grouping Rules

**Requirement**: Allow users to define custom grouping behavior per domain.

**Example use case**:
- `ai.google.com`, `www.google.com`, `google.com`, `www.google.com/ai` -> group together
- `docs.google.com` -> exclude from grouping
- Some domains group by subdomain, some by base domain, some by path

**What's needed**:
1. **Domain Rules Config** (stored in `chrome.storage.sync`)
2. **Options Page Enhancement** with detected domains and grouping choices
3. **Service Worker Logic** to evaluate domain rules and path matching

**Complexity**: Medium

**Note**: This can be added after v1.0 ships. For MVP, keep the two existing grouping modes (by domain, by domain ignoring subdomains).

### Google Docs Grouping by Document Type

- [x] Add an explicit side-panel action to group Google Docs, Sheets, Slides, and Forms separately
- [x] Research current Google editor URL families and define shared type ordering for sorting and grouping
- [x] Share Google editor type classification and ordering rules with sorting and grouping
- [x] Apply editor-type grouping to **Group by Domain** while keeping **Group by Domain (No Subdomain)** as one Google group
- [x] Sort unsupported Google editor paths alphabetically by a dynamic path identifier
- [x] Preserve the existing domain-grouping behavior
- [x] Validate grouping and type sorting with Docs, Sheets, Slides, and Forms in Chrome
- [ ] Validate grouping and type sorting with Google Vids and Drawings in Chrome

### Future UX Task: Revisit Tab List Utility

**Goal**: Explore whether a lightweight, on-demand tab utility can provide more value than a permanently visible tab list.

**Research areas**:
- Search tabs and jump directly to a selected tab
- Filter tabs by domain or window
- Find duplicate or related tabs
- Select tabs for a management action
- Surface focused utilities such as media-playing tabs

**Constraints**:
- Avoid recreating a full visual tab manager that is cumbersome to scan or operate
- Keep the management buttons as the default side-panel experience
- Use progressive disclosure, such as a `Find & Focus` or `Tab Overview` action

**Next step**: Prototype the smallest useful interaction and validate it before adding the tab list back to the main side panel. See [Feature Grouping Strategy](../research/05-feature-grouping-strategy.md) and [Progressive Disclosure](../research/03-progressive-disclosure.md).

## Documentation Structure

Comprehensive documentation is organized in the [`docs/`](../) folder:

- [Documentation index](../index.md)
- [UX/UI research](../research/)
- [Design patterns](../design/)
- [Technical architecture](../architecture/)
- [Setup and development guides](./)

## How to Continue

1. **Understand the project**: Read [CLAUDE.md](../../CLAUDE.md) for full architecture
2. **Setup locally**: Follow [SETUP.md](SETUP.md)
3. **Design the UI**: Review [Feature Grouping Strategy](../research/05-feature-grouping-strategy.md)
4. **Test in Chrome**: Load the extension and test each operation
5. **Refer to documentation**: Use [docs/index.md](../index.md) for the documentation hub

## Key Files

- [service-worker.js](../../service-worker.js) - Core tab-operation logic
- [side-panel.js](../../side-panel.js) - Button event handling and message passing
- [CLAUDE.md](../../CLAUDE.md) - Full architecture and requirements
- [manifest.json](../../manifest.json) - Extension permissions and configuration

## Testing Approach

1. Load in Chrome: `chrome://extensions/` -> Developer mode -> Load unpacked
2. Click the extension icon to open the side panel
3. Click each button to test
4. Use Chrome DevTools on the service worker to debug

### Future: Playwright Automation

If manual reloads become too disruptive, evaluate Playwright with its bundled Chromium and a persistent browser context that loads this unpacked Manifest V3 extension. The initial scope should be:

- Unit tests for utility functions such as domain extraction and Google Docs ID detection
- Service-worker tests with mocked Chrome APIs for tab and window operations
- A small smoke suite for the side-panel page, button interactions, and message passing

The real Chrome side-panel container is browser UI, so the extension page can be tested directly while side-panel opening and sizing remain a small manual smoke check. Prefer local Playwright automation before considering BrowserStack, Sauce Labs, or another cloud browser service. See the [official Playwright Chrome extension guidance](https://playwright.dev/docs/chrome-extensions).

## Monetization Decision

**Keeping free for now.** Ship v1.0, get users, add premium features later if needed.
