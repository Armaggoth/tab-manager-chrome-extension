# Architecture Documentation

This folder contains documentation about Tab Manager's technical architecture and design.

## Contents

- [Undo Feature Plan](undo-feature.md) – Planned undo/redo design for the last 20 actions
- [Feature Usage Tracking](feature-usage-tracking.md) – Implemented usage stats, threshold suggestion, and menu reordering
- **Coming Soon**: Service worker implementation patterns
- **Coming Soon**: Message passing architecture
- **Coming Soon**: Tab API usage patterns
- **Coming Soon**: State management

---

## Overview

Tab Manager follows a standard Chrome extension architecture:

```
User Interface (popup or side-panel HTML/JS/CSS)
          ↓ chrome.runtime.sendMessage()
Service Worker (service-worker.js)
          ↓ Chrome APIs
Chrome Tab/Window APIs
```

For detailed information, see:
- [Research: Chrome Extension UI Architecture](../research/02-chrome-extension-ui.md) – API reference
- [Guides: Setup](../guides/SETUP.md) – Initial setup
- Root directory [CLAUDE.md](../../CLAUDE.md) – Full architecture details

---

## Related Documentation

- [Research Folder](../research/) – UX/UI research and best practices
- [Design Folder](../design/) – UI design decisions and patterns
- [Guides Folder](../guides/) – Setup, development, and process guides
