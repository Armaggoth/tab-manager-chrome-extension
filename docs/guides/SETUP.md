# Tab Manager Extension - Setup Guide

## Step 1: Project Scaffolding ✅ Complete

You've successfully created the following project structure:

### Created Files

#### Core Extension Files
- **manifest.json** - Extension configuration (Manifest v3)
- **service-worker.js** - Background service worker with utility functions
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

## Step 3: Implement Core Logic

The service worker currently has utility functions but needs handlers for the main operations:

- [ ] Sort tabs by domain
- [ ] Group tabs by domain
- [ ] Group tabs by domain (ignore subdomain)
- [ ] Ungroup tabs
- [ ] Remove duplicate tabs
- [ ] Move tabs to new window (current/all windows)
- [ ] Bring all tabs to current window
- [ ] Close tabs (current/all windows)

## Step 4: Add Message Handlers

Update `service-worker.js` to handle messages from `side-panel.js`:

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'sortByDomain':
      // Implement sorting logic
      break;
    case 'groupByDomain':
      // Implement grouping logic
      break;
    // ... more cases
  }
});
```

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

## Next: Step 2 - Core Logic Implementation

When ready, we'll implement the service worker message handlers for all tab operations.
