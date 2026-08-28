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

    if (urlObj.pathname.startsWith('/document/')) return 'doc';
    if (urlObj.pathname.startsWith('/spreadsheets/')) return 'spreadsheet';
    if (urlObj.pathname.startsWith('/presentation/')) return 'presentation';
    if (urlObj.pathname.startsWith('/forms/')) return 'form';
    if (urlObj.pathname.startsWith('/videos/')) return 'video';
    if (urlObj.pathname.startsWith('/drawings/')) return 'drawing';

    return 'unknown';
  } catch (e) {
    return null;
  }
}

export function getDomainSortKey(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'chrome-extension:') {
      return 'chrome-extension';
    }

    const googleDocsType = detectGoogleDocsType(url);
    if (googleDocsType) {
      if (googleDocsType !== 'unknown') {
        return `docs:${getGoogleDocsTypeSortKey(googleDocsType)}`;
      }

      const editorSlug = urlObj.pathname.split('/').find(Boolean) || 'unknown';
      return `docs:${getGoogleDocsTypeSortKey('unknown')}:${editorSlug.toLowerCase()}`;
    }

    const hostname = urlObj.hostname.replace(/^www\./, '');
    return hostname.split('.')[0] || urlObj.protocol.replace(':', '');
  } catch (e) {
    return '';
  }
}

export function getGoogleDocsTypeSortKey(type) {
  const typeOrder = {
    doc: '01-doc',
    spreadsheet: '02-spreadsheet',
    presentation: '03-presentation',
    form: '04-form',
    video: '05-video',
    drawing: '06-drawing',
    unknown: '99-unknown',
  };

  return typeOrder[type] || typeOrder.unknown;
}

export function getGoogleDocsTypeLabel(type) {
  const typeLabels = {
    doc: 'Google Docs',
    spreadsheet: 'Google Sheets',
    presentation: 'Google Slides',
    form: 'Google Forms',
    video: 'Google Vids',
    drawing: 'Google Drawings',
  };

  return typeLabels[type] || 'Google Workspace file';
}

export function getGroupingKey(url, ignoreSubdomain = false) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'docs.google.com') {
      if (ignoreSubdomain) return 'google.com';

      const type = detectGoogleDocsType(url);
      if (type && type !== 'unknown') return `google:${type}`;

      const editorSlug = urlObj.pathname.split('/').find(Boolean) || 'unknown';
      return `google:unknown:${editorSlug.toLowerCase()}`;
    }

    return extractDomain(url, ignoreSubdomain) || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

export function getGroupingLabel(url, ignoreSubdomain = false) {
  if (ignoreSubdomain && getGroupingKey(url, true) === 'google.com') {
    return 'google.com';
  }

  const type = detectGoogleDocsType(url);
  if (type && type !== 'unknown') return getGoogleDocsTypeLabel(type);

  if (type === 'unknown') {
    try {
      const editorSlug = new URL(url).pathname.split('/').find(Boolean) || 'unknown';
      return `Google Workspace: ${editorSlug.toLowerCase()}`;
    } catch (e) {
      return 'Google Workspace file';
    }
  }

  return extractDomain(url, ignoreSubdomain) || 'unknown';
}
