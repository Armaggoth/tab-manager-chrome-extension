# Tab Manager Extension

A Chrome extension for efficiently managing, organizing, and cleaning up browser tabs.

## Features

- **Sort & Group Tabs**
  - Sort tabs by domain
  - Group tabs by domain
  - Group tabs by domain ignoring subdomains
  - Group Google Docs tabs by editor type
  - Ungroup tabs
- **Clean Up**
  - Remove duplicate tabs, including optional Google Docs ID detection
  - Ignore pinned tabs option
  - Find media playing tab across all windows
- **Move Tabs**
  - Move exact-domain tabs from the current window or all windows
  - Move base-domain tabs from the current window or all windows, ignoring subdomains
  - Move all ungrouped tabs from the current window to a new window
  - Bring all tabs from all windows to the current window
- **Close Tabs**
  - Close exact-domain tabs from the current window or all windows
- **Google Docs Support**
  - Detects and labels Docs, Sheets, Slides, Forms, Vids, and Drawings
- **Operations UI**
  - Shared popup and side-panel action surface
  - Affected-tab counts on action buttons; zero counts are omitted
  - Pinned-tab ignored cue with an explanatory tooltip
- **Localization**: English and Spanish
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, focus states, high contrast, and reduced motion support

## Installation

### Development Mode

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `tab-manager-extension` folder.

### Build

No build step is required. The extension uses vanilla JavaScript and CSS.

## Project Structure

```
tab-manager-extension/
├── manifest.json           # Extension configuration
├── service-worker.js       # Background tab-operation logic
├── side-panel.html/js/css  # Side-panel Operations UI
├── popup.html/js/css       # Popup Operations UI
├── options.html/js/css     # Settings and usage statistics
├── panel-actions.js        # Shared UI action rendering and wiring
├── utils.js                # Shared domain and action metadata
├── usage.js                # Usage statistics and suggestions
├── _locales/               # English and Spanish translations
├── assets/                 # Extension icons and UI images
├── docs/                   # Research, design, architecture, and guides
├── test/                   # Node test suites
├── SETUP.md                # Setup instructions
├── CLAUDE.md               # Architecture and repository guidance
└── README.md               # This file
```

## Documentation

- [Documentation index](docs/index.md)
- [Progress tracker](docs/guides/PROGRESS.md)
- [Manual test plan](docs/guides/MANUAL-TEST-PLAN.md)
- [Chrome Web Store publishing guide](docs/guides/CHROME-WEB-STORE-PUBLISHING.md)
- [UI research](docs/research/)
- [Architecture documentation](docs/architecture/)

## Development

- **Manifest V3**: Modern Chrome extension standard.
- **Service worker**: Background logic for tab operations.
- **Shared UI module**: Popup and side panel use the same action registry and message wiring.
- **Tests**: Run `npm test`.
- **Storage**: Behavior settings use `chrome.storage.sync`; usage statistics use `chrome.storage.local`.

## Accessibility

All interactive controls have accessible labels and focus states. The UI supports keyboard navigation, WCAG AA contrast, reduced motion, and high contrast preferences.

## Next Steps

1. Complete remaining Chrome manual validation.
2. Implement selectable text/icon Operations modes.
3. Research and improve the text-based layout.
4. Add the core Stats, Settings, and About tabs in the options window.
5. Add deferred feedback, packaging, and Chrome Web Store preparation.

## License

MIT
