// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Utility function to extract domain from URL
export function extractDomain(url, ignoreSubdomain = false) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!ignoreSubdomain) {
      return hostname;
    }

    // Remove subdomain: www.example.com -> example.com
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

// Detect Google Docs type from URL
export function detectGoogleDocsType(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'docs.google.com') {
      return null;
    }

    if (url.includes('/document/')) return 'doc';
    if (url.includes('/spreadsheets/')) return 'spreadsheet';
    if (url.includes('/presentation/')) return 'presentation';
    if (url.includes('/forms/')) return 'form';

    return 'unknown';
  } catch (e) {
    return null;
  }
}
