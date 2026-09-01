# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tab Manager is a Chrome extension (Manifest v3) that helps users organize and clean up browser tabs. The extension uses a **side panel UI** (not a popup) where users can trigger tab management operations via buttons. Core logic runs in a background **service worker**, while the UI communicates with it via message passing.

**Key Requirement**: All operations are triggered by explicit user action only—no auto-grouping or background reorganization.

## Architecture

```
Side Panel (UI Layer)
  ↓ chrome.runtime.sendMessage()
Service Worker (Logic Layer)
  ↓ chrome.tabs.query(), chrome.windows.create()
Chrome Tab/Window APIs
```


## Requirements to Enforce

1. **Pinned Tabs**: Users can toggle `ignorePinnedTabs` in settings. Filter tabs before operations if enabled.
2. **Grouped Tabs**: Normal operations must protect tabs that are already in a group. Grouped tabs are filtered out by `filterTabs()` and `filterUngroupedTabs()` across all standard operations (Sort, Group, Move, Close, Remove Duplicates). The only operations that affect grouped tabs are:
   - **Ungroup**: explicitly dissolves all tab groups in the window.
   - **Bring All to This Window**: moves all tabs from other windows into the current window (preserving their group assignments).
   - **Find Media Playing**: can focus/highlight a tab even if it is inside a group.
3. **Google Docs Detection**: URL path patterns to extract document type (doc/spreadsheet/presentation/form/video/drawing) from docs.google.com URLs.
4. **Duplicate Google Docs Detection**: Users can toggle `detectDuplicateGoogleDocs` in settings. When enabled, the "Remove Duplicates" operation detects duplicate tabs of the same Google Docs/Sheets/Slides/Form by comparing document IDs, even if they're open on different pages or sheets.
5. **Grouping Safety**: Grouping operations must be idempotent. Repeating the same operation must not create duplicate groups or move tabs that are already in the correct group. Preserve existing groups and create separate groups for ungrouped matches; do not merge groups during normal operations.
6. **Operations Move to New Windows**: When moving tabs, create new Chrome windows (not tab groups).
7. **User Action Only**: No background reorganization. Every operation starts from a button click.
8. **Localization**: Always update both `_locales/en/messages.json` and `_locales/es/messages.json` when adding user-facing strings.

## Key Functions

### Existing Utilities (service-worker.js)

- `extractDomain(url, ignoreSubdomain = false)` → Returns domain (e.g., `example.com`). If `ignoreSubdomain=true`, strips www subdomain.
- `detectGoogleDocsType(url)` → Returns `'doc'`, `'spreadsheet'`, `'presentation'`, `'form'`, `'video'`, `'drawing'`, or `null`.
- `extractGoogleDocsId(url)` → Extracts and returns the document ID from Google Docs URLs (e.g., from `/document/d/{docId}/edit`). Returns `null` if not a valid Google Docs URL. Used for duplicate detection across different pages/slides/sheets.

### Message Passing Pattern

Side panel sends messages like:
```javascript
chrome.runtime.sendMessage({
  action: 'sortByDomain',
  domain: 'example.com' // optional, for domain-specific operations
});
```

Service worker receives and processes:
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'sortByDomain':
      // Implement logic here
      break;
  }
});
```

### Implemented Tab Operations

The service worker implements the operations below. The side panel also exposes an explicit `groupGoogleDocsByType` action for Docs, Sheets, Slides, and Forms.

Each requires a message handler in service-worker.js:

1. **Sort by Domain** – Sort current window tabs alphabetically by domain
2. **Group by Domain** – Group ungrouped tabs by hostname, with `docs.google.com` grouped by editor type
3. **Group by Domain (No Subdomain)** – Group ungrouped tabs by base domain, with all `docs.google.com` editor types grouped together
4. **Ungroup** – If grouping uses tab groups (later feature), ungroup them
5. **Remove Duplicates** – Close duplicate tabs (same URL or same Google Docs ID if `detectDuplicateGoogleDocs` is enabled), keep one
6. **Move Domain (Current Window)** → New Window – Select domain, move all matching tabs to new window
7. **Move Domain (All Windows)** → New Window – Move matching tabs from all browser windows to new window
8. **Bring All to This Window** – Move all tabs from other windows to current window
9. **Close Domain (Current Window)** – Close all tabs matching selected domain in current window
10. **Close Domain (All Windows)** – Close all matching tabs across all browser windows
11. **Find Media Playing** – Find and focus the tab currently playing audio/video across all windows

## Accessibility Standards

**Already implemented** (maintain these):
- Semantic HTML (`<main>`, `<section>`, `<header>`, `role="region"`)
- ARIA labels and descriptions on all buttons
- Keyboard navigation support
- Focus indicators and `focus-visible` states
- Dark mode support (`prefers-color-scheme`)
- High contrast mode support (`prefers-contrast: more`)
- Reduced motion support (`prefers-reduced-motion: reduce`)
- Color contrast (WCAG AA)

When adding new UI: Use semantic HTML first, add `aria-label` or `aria-labelledby` to interactive elements, test keyboard navigation.

## Chrome APIs Used

- `chrome.tabs.query()` – Fetch tabs from current/all windows
- `chrome.windows.create()` – Create new windows
- `chrome.tabs.move()` – Move tabs between windows
- `chrome.tabs.remove()` – Close tabs
- `chrome.tabs.update()` – Update tab properties (focus, highlight)
- `chrome.sidePanel.open()` – Open side panel when icon clicked
- `chrome.storage.sync` – Persist user settings (pinned tabs toggle, language)
- `chrome.runtime.sendMessage()` / `onMessage` – IPC between side panel and service worker
- `tab.audible` – Property on tab object indicating if tab is playing audio/video

## File Responsibilities

- **manifest.json** – Declares permissions, side panel, options page, icons
- **service-worker.js** – Utility functions + message handlers (to be completed)
- **side-panel.html/js/css** – User interface, event listeners, settings retrieval
- **options.html/js/css** – Settings form, storage persistence
- **_locales/en|es/messages.json** – UI string translations
- **README.md** – User and developer documentation
- **SETUP.md** – Step-by-step setup and next-steps guide

## Development Notes

- **No build step** – Vanilla JS, CSS, HTML. Load directly into Chrome via `chrome://extensions` (Developer mode).
- **Icons** – Placeholder system in manifest.json but assets need to be created. Add 16x16, 48x48, 128x128 PNG files to `/assets/`.
- **Testing** – No test framework yet. Manual testing in Chrome required for now.
- **Storage** – Settings stored in `chrome.storage.sync` (synced across user's Chrome browsers).

## Next Steps When Continuing

1. Implement 11 message handlers in service-worker.js for tab operations
2. Create domain selection UI/logic (currently uses `prompt()`, consider improving UX)
3. Add icon assets to `/assets/`
4. Test each operation in Chrome locally
5. Consider error handling and user feedback (toast messages, dialogs)
6. Build a package/zip for distribution

## Common Gotchas

- **Message Handlers**: Forgetting to implement a case in the `onMessage` listener will silently fail. Check the console for missing handlers.
- **Domain Extraction**: URLs without a valid domain (data: URLs, blob: URLs, chrome:// URLs) return null from `extractDomain()`. Filter these before operations.
- **Pinned Tabs**: Always check `settings.ignorePinnedTabs` before operating on tabs.
- **Grouped Tabs**: Normal operations protect tabs already in a group. Use `tab.groupId` to detect grouped tabs (`groupId !== chrome.tabs.TAB_GROUP_ID_NONE`).
- **Window Context**: `chrome.tabs.query({ currentWindow: true })` = tabs in active window. `chrome.tabs.query({})` = all tabs across all windows.

## 📚 Comprehensive Documentation

Complete documentation is available in the `docs/` folder:

- **[docs/index.md](docs/index.md)** – Main documentation hub with role-based navigation
- **[docs/research/](docs/research/)** – UX/UI research (5 documents covering tab patterns, Chrome APIs, progressive disclosure, etc.)
- **[docs/design/](docs/design/)** – Design patterns and recommended UI structure
- **[docs/architecture/](docs/architecture/)** – Technical architecture and component interactions
- **[docs/guides/](docs/guides/)** – Setup guides and development checklists

**Recommended Reading**:
1. [Feature Grouping Strategy](docs/research/05-feature-grouping-strategy.md) – Recommended UI reorganization
2. [Tab UI Patterns](docs/research/01-tab-ui-patterns.md) – Visual design best practices
3. [Chrome Extension UI Architecture](docs/research/02-chrome-extension-ui.md) – Technical constraints and APIs
4. [docs/index.md](docs/index.md) – Full navigation and role-based quick-start
