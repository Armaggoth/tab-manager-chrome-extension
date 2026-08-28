# Development Progress

## Current Status: Testing & Polish

### Completed (Chat #1 - 2026-05-07)

**Scaffolding & Setup**
- Manifest v3 configuration
- Side panel UI with all 12 action buttons (full HTML/CSS/JS)
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

**Core Logic Implementation - All 11 Service Worker Message Handlers**
- Implemented `chrome.runtime.onMessage.addListener()` in service-worker.js
- Sort tabs by domain
- Group tabs by domain (with ignoreSubdomain option)
- Ungroup tab groups
- Remove duplicate tabs (with detectDuplicateGoogleDocs support)
- Move domain tabs (current window) -> new window
- Move domain tabs (all windows) -> new window
- Bring all tabs to current window
- Close domain tabs (current window)
- Close domain tabs (all windows)
- Find and focus currently playing media tab
- Added helper functions: `filterTabs()`, `getSettings()`, `queryTabs()`, `moveTabs()`
- Handlers respect user settings where applicable; normal sorting and grouping always protect existing groups

## Testing & Manual Validation

- [ ] Execute the detailed [Manual Test Plan](MANUAL-TEST-PLAN.md) by settings profile and feature
- [x] Add and pass unit tests for Sort by Domain
- [ ] Test each operation in Chrome locally
- [x] Test Ungroup in Chrome locally
- [ ] Verify filtering (pinned tabs, grouped tabs) works correctly
- [ ] Test Google Docs duplicate detection
- [ ] Verify move/close operations work across multiple windows
- [ ] Test media finding functionality
- [x] Investigate and fix the Sort by Domain defects involving special tabs, repeated clicks, and pinned-tab preservation (checked and unchecked Ignore Pinned Tabs retests passed)

## Supporting Tasks

- [ ] Improve domain selection UI (currently uses `prompt()`)
- [ ] Add icon assets to `/assets/` (16x16, 48x48, 128x128 PNG)
- [ ] Add error handling/user feedback (toast messages)
- [ ] Build and package for distribution
- [ ] Evaluate local Playwright automation to reduce manual extension reloads

## Completed Grouping Safety Change

Normal sorting and grouping now treat existing tab groups as user-owned organization. The former `ignoreGroupedTabs` setting was removed because making protection optional was unsafe:

1. [x] Separate grouped tabs from ungrouped tabs for normal sorting and grouping.
2. [x] Leave grouped tabs in their existing groups and positions.
3. [x] Sort only eligible ungrouped pinned and unpinned tabs within their own regions.
4. [x] Group only eligible ungrouped tabs.
5. [x] Preserve existing groups; create a separate group for ungrouped matches instead of merging.
6. [x] Make repeated sorting and grouping operations no-ops after the desired state is reached.
7. Reserve changes to existing groups for a future, explicitly named `Regroup All Tabs` action.
8. [x] Add unit tests for grouped-tab protection and repeated grouping before manual Chrome tests.

Grouped-tab protection is now unconditional for operations that use the shared filter. Normal grouping does not merge ungrouped tabs into existing groups.

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
- [ ] Validate grouping and type sorting with Docs, Sheets, Slides, Forms, Vids, and Drawings in Chrome (Docs, Sheets, Slides, and Forms sorting passed; Vids/Drawings remain)

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
