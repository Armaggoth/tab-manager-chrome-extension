# Development Progress

## Current Status: Step 2 (Core Logic Implementation)

### ✅ Completed (Chat #1 - 2026-05-07)

**Scaffolding & Setup**
- Manifest v3 configuration
- Side panel UI with all 12 action buttons (full HTML/CSS/JS)
- Options page (settings: ignore pinned tabs, ignore grouped tabs, language)
- Service worker with utility functions (`extractDomain`, `detectGoogleDocsType`)
- Localization files (English & Spanish)
- Full A11y implementation (semantic HTML, ARIA, keyboard nav, dark/high-contrast/reduced-motion)
- Documentation (README.md, SETUP.md, CLAUDE.md)
- Git initialized and pushed to https://github.com/Armaggoth/tab-manager-chrome-extension.git

### 🚀 Next: Implement Core Logic

**Service Worker Message Handlers** (11 operations to implement in `service-worker.js`):

- [ ] Sort tabs by domain
- [ ] Group tabs by domain
- [ ] Group tabs by domain (ignore subdomains)
- [ ] Ungroup tabs
- [ ] Remove duplicate tabs
- [ ] Move domain tabs (current window) → new window
- [ ] Move domain tabs (all windows) → new window
- [ ] Bring all tabs to current window
- [ ] Close domain tabs (current window)
- [ ] Close domain tabs (all windows)
- [ ] Find media playing tab across all windows

**What's needed**:
1. Add `chrome.runtime.onMessage.addListener()` to service-worker.js
2. Implement handler for each operation (10 cases in switch statement)
3. Each handler needs to:
   - Query tabs with `chrome.tabs.query()`
   - Filter by domain/settings
   - Perform the action (sort, move, close, etc.)
   - Send response back to side panel

**Supporting tasks**:
- [ ] Improve domain selection UI (currently uses `prompt()`)
- [ ] Add icon assets to `/assets/` (16x16, 48x48, 128x128 PNG)
- [ ] Manual testing in Chrome
- [ ] Add error handling/user feedback

### 🔧 Advanced Feature: Custom Domain Grouping Rules

**Requirement**: Allow users to define custom grouping behavior per domain.

**Example use case**:
- `ai.google.com`, `www.google.com`, `google.com`, `www.google.com/ai` → group together
- `docs.google.com` → exclude from grouping
- Some domains group by subdomain, some by base domain, some by path

**What's needed**:
1. **Domain Rules Config** (stored in `chrome.storage.sync`):
   ```javascript
   {
     "groupingRules": {
       "google.com": {
         "groupBy": "baseDomain",  // "baseDomain", "subdomain", or "path"
         "excluded": false,
         "pathPatterns": [""] // optional path matching
       },
       "docs.google.com": {
         "groupBy": "full",  // or "excluded"
         "excluded": true
       }
     }
   }
   ```

2. **Options Page Enhancement**:
   - Add new section: "Domain Grouping Rules"
   - List detected domains from current tabs
   - For each: dropdown (Group by Base Domain / by Subdomain / by Path / Exclude)
   - Save/load from storage

3. **Service Worker Logic**:
   - Update grouping functions to respect domain rules
   - When no rules defined, use default behavior (groupBy option from button click)
   - Apply path matching if specified

4. **Complexity**: Medium
   - Adds UI section to options page
   - Requires rule evaluation logic in service worker
   - Storage management for per-domain rules

**Note**: This can be added after v1.0 ships. For MVP, keep the two existing grouping modes (by domain, by domain ignoring subdomains).

## How to Continue

1. Read CLAUDE.md for architecture & Chrome API reference
2. Check service-worker.js—utilities are ready, needs message handlers
3. Side panel is complete; it already sends messages on button clicks
4. Implement handlers one at a time, test in Chrome locally

## Key Files

- **service-worker.js** — Where core logic goes (currently 40 lines, needs ~200-300 more)
- **side-panel.js** — Already sends messages, no changes needed
- **CLAUDE.md** — Full architecture & requirements doc
- **manifest.json** — Already has all permissions needed (tabs, windows, storage, sidePanel)

## Testing Approach

1. Load in Chrome: `chrome://extensions/` → Developer mode → Load unpacked
2. Click extension icon → side panel opens
3. Click each button to test (will error until handlers implemented)
4. Use Chrome DevTools on the service worker to debug

## Monetization Decision

**Keeping free for now.** Ship v1.0, get users, add premium features later if needed.
