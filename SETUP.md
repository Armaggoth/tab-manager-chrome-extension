# Tab Manager Extension - Setup Guide

## Step 1: Project Scaffolding ✅ Complete

You've successfully created the following project structure:

### Created Files

#### Core Extension Files
- **manifest.json** - Extension configuration (Manifest v3)
- **service-worker.js** - Background service worker with tab-operation handlers and utilities
  - `extractDomain(url, ignoreSubdomain)` - Extract domain from URL
  - `detectGoogleDocsType(url)` - Detect Google Docs type from URL

#### User Interface
- **side-panel.html** - Main side panel interface with semantic HTML and ARIA labels
- **side-panel.css** - Responsive styles with accessibility support (dark mode, high contrast, reduced motion)
- **side-panel.js** - Side panel logic and event handlers

#### Settings & Options
- **options.html** - Settings page with accessibility features
- **options.js** - Settings logic and storage handling
- **options.css** - Settings page styles

#### Localization
- **_locales/en/messages.json** - English translations
- **_locales/es/messages.json** - Spanish translations

#### Documentation
- **README.md** - Full documentation
- **SETUP.md** - This setup guide

#### Project Files
- **.gitignore** - Git ignore patterns
- **assets/.gitkeep** - Assets directory placeholder

## Step 2: Install & Test Locally

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select this folder
5. The extension should appear in Chrome's toolbar

## Step 3: Test Core Logic

The service worker now handles the main tab operations, including sorting, grouping, duplicate removal, moving, closing, bringing tabs between windows, and finding media-playing tabs. Use [docs/guides/MANUAL-TEST-PLAN.md](docs/guides/MANUAL-TEST-PLAN.md) to validate each operation with the relevant settings enabled.

The side panel also includes an explicit **Group Google Docs by Type** action for Google Docs, Sheets, Slides, and Forms.

## Step 4: Manual Validation

Follow the [Manual Test Plan](docs/guides/MANUAL-TEST-PLAN.md) and record failures by settings profile.

## Step 5: Icon Assets

Create or add icons to `/assets/`:
- `icon-16.png` (16x16)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)
- `default-favicon.png` (fallback favicon)

## Accessibility Features Included

- ✅ Semantic HTML (main, section, header, footer)
- ✅ ARIA labels and descriptions on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus management with visible indicators
- ✅ Dark mode support
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Proper heading hierarchy
- ✅ Color contrast compliance (WCAG AA)

## Next: Testing & Polish

Run [docs/guides/MANUAL-TEST-PLAN.md](docs/guides/MANUAL-TEST-PLAN.md) and track follow-up work in [docs/guides/PROGRESS.md](docs/guides/PROGRESS.md).

## Commit Test Hook

The repository includes a tracked `.githooks/pre-commit` hook that runs `npm test` before every commit. Activate it once in a fresh clone with:

```text
git config core.hooksPath .githooks
```

If the test command fails, Git stops the commit. Do not bypass the hook for normal commits.
