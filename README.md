# Tab Manager Extension

A Chrome extension for efficiently managing, organizing, and cleaning up browser tabs.

## Features

- **Sort & Group Tabs**
  - Sort tabs by domain
  - Group tabs by domain
  - Group tabs by domain ignoring subdomains
  - Ungroup tabs

- **Clean Up**
  - Remove duplicate tabs
  - Ignore pinned tabs option
  - Ignore grouped tabs option
  - Find media playing tab across all windows

- **Move Tabs**
  - Move all tabs with the same domain from the current window to a new window
  - Move all tabs with the same domain from all windows to a new window
  - Bring all tabs from all windows to the current window

- **Close Tabs**
  - Close all tabs with the same domain from the current window
  - Close all tabs with the same domain from all windows

- **Google Docs Support**
  - Automatically detects and labels Google Docs, Sheets, Slides, and Forms

- **Localization**
  - English
  - Español

- **Accessibility (A11y)**
  - Semantic HTML structure
  - ARIA labels and descriptions
  - Keyboard navigation
  - Focus management
  - High contrast mode support
  - Reduced motion support

## Installation

### Development Mode

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `tab-manager-extension` folder

### Build

No build step is required. The extension uses vanilla JavaScript and CSS.

## Project Structure

```
tab-manager-extension/
├── manifest.json           # Extension configuration
├── service-worker.js       # Background service worker with utilities
├── side-panel.html         # Side panel UI
├── side-panel.js           # Side panel logic
├── side-panel.css          # Side panel styles
├── options.html            # Settings page
├── options.js              # Settings logic
├── options.css             # Settings styles
├── _locales/
│   ├── en/messages.json    # English translations
│   └── es/messages.json    # Spanish translations
├── assets/                 # Icons and images
├── docs/                   # Comprehensive documentation
│   ├── research/          # UX/UI research and best practices
│   ├── design/            # Design patterns and recommendations
│   ├── architecture/      # Technical architecture
│   └── guides/            # Setup and development guides
├── SETUP.md               # Setup instructions
├── PROGRESS.md            # Development progress
├── CLAUDE.md              # Full architecture documentation
└── README.md              # This file
```

## 📚 Documentation

Complete documentation is available in the `docs/` folder:

- **[docs/index.md](docs/index.md)** – Main documentation index
- **[docs/research/](docs/research/)** – UX/UI research (Tab patterns, Progressive Disclosure, etc.)
- **[docs/design/](docs/design/)** – Recommended UI structure and design decisions
- **[docs/architecture/](docs/architecture/)** – Technical architecture details
- **[docs/guides/](docs/guides/)** – Setup and development guides

**Quick Links**:
- 🎯 **For UI design**: [Feature Grouping Strategy](docs/research/05-feature-grouping-strategy.md)
- 🛠️ **For implementation**: [Chrome Extension UI Architecture](docs/research/02-chrome-extension-ui.md)
- 📖 **All topics**: [Documentation Index](docs/index.md)

See [PROGRESS.md](PROGRESS.md) for development status and [SETUP.md](SETUP.md) for local setup instructions.

## Development

### Architecture

- **Manifest v3**: Modern Chrome extension standard
- **Service Worker**: Background logic for tab operations
- **Side Panel**: User interface for managing tabs
- **Options Page**: Settings and preferences

### Key Functions

#### `extractDomain(url, ignoreSubdomain = false)`
Extracts the domain from a URL. If `ignoreSubdomain` is true, returns only the base domain (e.g., `example.com` instead of `www.example.com`).

#### `detectGoogleDocsType(url)`
Detects the type of Google Docs document from the URL:
- `'doc'` for Google Docs
- `'spreadsheet'` for Google Sheets
- `'presentation'` for Google Slides
- `'form'` for Google Forms
- `null` if not a Google Docs URL

### Message Passing

The side panel communicates with the service worker using Chrome's message passing API:

```javascript
chrome.runtime.sendMessage({
  action: 'actionName',
  // additional data...
});
```

### Storage

Settings are stored in Chrome's `chrome.storage.sync` API:

```javascript
chrome.storage.sync.get({ defaultKey: defaultValue }, (items) => {
  // Use items
});

chrome.storage.sync.set({ key: value }, () => {
  // Settings saved
});
```

## Accessibility Features

- **Semantic HTML**: Proper use of `<main>`, `<section>`, `<header>`, `<footer>`, etc.
- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Focus Management**: Clear focus indicators and proper tab order
- **Color Contrast**: WCAG AA compliant color combinations
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **High Contrast**: Respects `prefers-contrast` media query

## Next Steps

1. Implement service worker message handlers for each action
2. Add tab sorting and grouping algorithms
3. Add tab moving and closing logic
4. Create placeholder icon assets
5. Add error handling and user feedback
6. Add unit tests
7. Test across different Chrome versions

## License

MIT
