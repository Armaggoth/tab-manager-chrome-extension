# Chrome Extension UI Architecture

## Available UI Components for Extensions

### 1. **Side Panel** (Most Relevant for Tab Manager)
- **Use case**: Host content in browser's side panel alongside webpage
- **Availability**: Chrome 114+ MV3+
- **Advantages**:
  - Persistent experience alongside main content
  - Can be global (all pages) or tab-specific
  - Remains open when navigating between tabs
  - Full access to Chrome APIs
- **Setup**: Add `"sidePanel"` permission and `"side_panel"` key in manifest
- **Examples**: Dictionary extension, Tab Manager implementations

### 2. Action Icon & Tooltip
- Extension requires at least one icon in the toolbar
- Users click icon to invoke action or open popup
- Can add a label/tooltip explaining the action
- Can add a badge (text overlay) to indicate state or required actions

### 3. Popup
- Window that opens when user clicks action icon
- Can invoke multiple extension features
- Can be opened via:
  - Clicking action icon
  - Keyboard shortcut
  - Via `chrome.action.openPopup()`

### 4. Options Page
- Settings page where users configure extension preferences
- Persisted via `chrome.storage.sync`
- Can be language-specific via localization

### 5. Context Menu
- Appears on right-click (context menu)
- Can have nested sub-menus
- Triggered via right-click on specific elements

### Other Components (Less Relevant)
- Keyboard shortcuts (commands)
- Omnibox integration
- Override Chrome pages (new tab, history, bookmarks)
- Notifications (system tray)

---

## Side Panel API Best Practices

### Setup
```json
{
  "name": "Tab Manager",
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "side-panel.html"
  },
  "action": {
    "default_title": "Open Tab Manager"
  }
}
```

### Control Panel Behavior
```javascript
// Enable opening side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Switch panels if needed (e.g., welcome → main)
chrome.sidePanel.setOptions({ path: "side-panel.html" });

// Open/close programmatically (only on user gesture)
chrome.sidePanel.open({ windowId: tab.windowId });
chrome.sidePanel.close({ windowId: tab.windowId });
```

### Panel State Events
```javascript
// Listen for when panel opens
chrome.sidePanel.onOpened.addListener((info) => {
  console.log("Panel opened in window:", info.windowId);
});

// Listen for when panel closes
chrome.sidePanel.onClosed.addListener((info) => {
  console.log("Panel closed in window:", info.windowId);
});
```

### Features
- **Pin icon** in side panel toolbar allows users to pin/unpin extension
- **Panel positioning** – Users can specify left or right side in Chrome settings
- **Global vs. Tab-specific** – Set `tabId` in options for tab-specific, omit for global
- **Multiple panels** – Can have different panels for different contexts via `getOptions()` / `setOptions()`

---

## Side Panel User Experience Guidelines

### When Panel Closes
- Browser handles persistence – panel remembers if it was open when navigating tabs
- If user navigates to site where panel not enabled, panel auto-closes

### Opening the Panel
- **Action icon click** – Most common and discoverable (via `setPanelBehavior`)
- Keyboard shortcut (via Commands API)
- Context menu item
- Programmatic open on user gesture

### Design as a Companion Tool
- Side panel should improve browsing experience without unnecessary distractions
- Must comply with Chrome Web Store quality guidelines
- Should focus on user's current context/task

---

## Message Passing Pattern (Side Panel ↔ Service Worker)

### From Side Panel to Service Worker
```javascript
// side-panel.js
chrome.runtime.sendMessage({
  action: 'sortByDomain',
  domain: 'example.com'
}, (response) => {
  console.log('Response:', response);
});
```

### Service Worker Listener
```javascript
// service-worker.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'sortByDomain':
      // Handle sorting
      sendResponse({ success: true, result: tabs });
      break;
  }
});
```

---

## Extension Manifest Requirements

### Core Permissions for Tab Manager
```json
{
  "manifest_version": 3,
  "name": "Tab Manager",
  "version": "1.0.0",
  "permissions": [
    "tabs",           // Query and manipulate tabs
    "windows",        // Manipulate windows
    "storage",        // Persist settings
    "sidePanel"       // Side panel API
  ],
  "host_permissions": [
    "<all_urls>"      // Query tabs from all origins
  ],
  "background": {
    "service_worker": "service-worker.js"
  },
  "side_panel": {
    "default_path": "side-panel.html"
  },
  "action": {
    "default_title": "Tab Manager"
  }
}
```

---

## Chrome APIs for Tab Management

### Query Tabs
```javascript
// All tabs across all windows
chrome.tabs.query({}, (tabs) => {});

// Tabs in current window only
chrome.tabs.query({ currentWindow: true }, (tabs) => {});

// Tabs with specific properties
chrome.tabs.query({ title: "Google", status: "complete" }, (tabs) => {});
```

### Tab Properties
- `tab.id` – Unique tab ID
- `tab.windowId` – Window this tab belongs to
- `tab.url` – Tab URL
- `tab.title` – Tab title
- `tab.active` – Is currently active
- `tab.pinned` – Is pinned
- `tab.groupId` – Tab group ID (if grouped)
- `tab.audible` – Is playing audio

### Manipulate Tabs
```javascript
// Move tabs to new window
chrome.tabs.move(tabIds, { windowId: newWindowId });

// Close tabs
chrome.tabs.remove(tabIds);

// Create new window
chrome.windows.create({ tabId: sourceTabId });

// Update tab (focus, highlight)
chrome.tabs.update(tabId, { active: true });
```

---

## Storage for Settings

### Synced Storage
```javascript
// Save settings across user's Chrome browsers
chrome.storage.sync.set({
  ignorePinnedTabs: true,
  language: 'en'
});

// Retrieve settings
chrome.storage.sync.get(['ignorePinnedTabs'], (result) => {
  const { ignorePinnedTabs } = result;
});
```

### Local Storage
```javascript
// Save locally (not synced)
chrome.storage.local.set({ lastSort: 'domain' });
```

---

## Summary: Tab Manager Extension Architecture

```
User clicks toolbar icon
    ↓
Side panel opens (side-panel.html/js/css)
    ↓
User clicks action button (e.g., "Sort by Domain")
    ↓
Side panel sends message: chrome.runtime.sendMessage({ action: 'sortByDomain' })
    ↓
Service Worker receives message (service-worker.js)
    ↓
Handler queries tabs, filters by settings, performs action
    ↓
Handler sends response back to side panel
    ↓
Side panel displays results/feedback to user
```

---

## Quality Guidelines Compliance

- Panel is useful and complements browsing experience
- No misleading or deceptive functionality
- Respects the user's pinned-tab setting and always protects existing tab groups during normal operations
- Clear, accessible UI with keyboard support
- Internationalized (English, Spanish)
