export function extractDomain(url, ignoreSubdomain = false) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!ignoreSubdomain) {
      return hostname;
    }

    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

export function extractGoogleDocsId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'docs.google.com') {
      return null;
    }

    const match = url.match(/\/(document|spreadsheets|presentation|forms)\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[2]) {
      return match[2];
    }

    return null;
  } catch (e) {
    return null;
  }
}

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
