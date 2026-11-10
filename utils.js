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

// Standard URL schemes that carry no meaningful hostname (no "domain" to group/sort by).
const KNOWN_PROTOCOLS = {
  'file:': { key: 'file', label: 'Local Files' },
  'about:': { key: 'about', label: 'Browser Pages' },
  'data:': { key: 'data', label: 'Data URIs' },
  'blob:': { key: 'blob', label: 'Blob URLs' },
  'view-source:': { key: 'view-source', label: 'View Source' },
  'filesystem:': { key: 'filesystem', label: 'File System' },
  'mailto:': { key: 'mailto', label: 'Mail Links' },
  'tel:': { key: 'tel', label: 'Phone Links' },
  'javascript:': { key: 'javascript', label: 'Script Links' },
};

// Looks up a friendly key/label for hostname-less protocols (e.g. file://, about:).
export function getKnownProtocolInfo(url) {
  try {
    const { protocol } = new URL(url);
    return KNOWN_PROTOCOLS[protocol] || null;
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

export function detectAtlassianProduct(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const segments = pathname.split('/').filter(Boolean);
    const hostname = urlObj.hostname.toLowerCase();
    const isAtlassianHost = hostname.endsWith('.atlassian.net') || hostname.endsWith('.jira.com');

    const application = urlObj.searchParams.get('application')?.toLowerCase();
    if (hostname === 'id.atlassian.com' && /^[a-z][a-z0-9-]*$/.test(application || '')) {
      return application;
    }

    if (segments[0] === 'wiki') {
      return 'confluence';
    }

    if (segments[0] === 'browse' && segments[1]) {
      const issueKey = segments[1];
      if (/^[a-z][a-z0-9_]*-[0-9]+$/i.test(issueKey)) {
        return 'jira';
      }
    }

    if (segments[0] === 'rest' && segments[1] === 'api') {
      return 'jira';
    }

    if (segments[0] === 'jira' && segments.length > 1 && isAtlassianHost) {
      return 'jira';
    }

    if (segments[0] === 'secure' && isAtlassianHost) {
      return 'jira';
    }

    return null;
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

    const atlassianProduct = detectAtlassianProduct(url);
    if (atlassianProduct) {
      const hostname = extractDomain(url, false) || urlObj.hostname;
      return `atlassian:${atlassianProduct}:${hostname}`;
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

    const atlassianProduct = detectAtlassianProduct(url);
    if (atlassianProduct) {
      return `atlassian:${atlassianProduct}`;
    }

    return extractDomain(url, ignoreSubdomain) || getKnownProtocolInfo(url)?.key || 'unknown';
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

  const atlassianProduct = detectAtlassianProduct(url);
  if (atlassianProduct) {
    const productLabel = atlassianProduct[0].toUpperCase() + atlassianProduct.slice(1);
    return productLabel;
  }

  return extractDomain(url, ignoreSubdomain) || getKnownProtocolInfo(url)?.label || 'unknown';
}

// Shared action -> display label map, used by both the side panel/popup and the
// Settings "Usage" tab so feature names stay consistent everywhere.
export const ACTION_LABELS = {
  sortByDomain: 'Sort by Domain',
  groupByDomain: 'Group by Domain',
  groupByDomainNoSubdomain: 'Group by Domain (No Subdomain)',
  groupGoogleDocsByType: 'Group Google Docs by Type',
  ungroup: 'Ungroup',
  removeDuplicates: 'Remove Duplicates',
  moveDomainCurrentWindow: 'Move Domain to New Window (Current Window)',
  moveDomainAllWindows: 'Move Domain to New Window (All Windows)',
  moveDomainCurrentWindowNoSubdomain: 'Move Base Domain to New Window (Current Window)',
  moveDomainAllWindowsNoSubdomain: 'Move Base Domain to New Window (All Windows)',
  moveUngroupedCurrentWindow: 'Move Ungrouped to New Window',
  moveActiveTabToNewWindow: 'Move Active Tab to New Window',
  bringDomainToCurrentWindow: 'Bring Domain to This Window',
  bringDomainToCurrentWindowNoSubdomain: 'Bring Base Domain to This Window',
  bringToWindow: 'Bring All to This Window',
  closeDomainCurrentWindow: 'Close Domain (Current Window)',
  closeDomainAllWindows: 'Close Domain (All Windows)',
  findMediaPlaying: 'Find Media Playing',
};

export const ACTION_GROUPS = [
  {
    title: 'Sort & Group',
    actions: [
      {
        key: 'sortByDomain',
        id: 'sort-by-domain',
        icon: 'assets/icons/48/sort-by-domain.png',
        ariaLabel: 'Sort tabs by domain',
        title: 'Sort tabs alphabetically by domain',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'groupByDomain',
        id: 'group-by-domain',
        icon: 'assets/icons/48/group-by-domain.png',
        ariaLabel: 'Group tabs by domain',
        title: 'Group tabs by their domain',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'groupByDomainNoSubdomain',
        id: 'group-by-domain-ignore-subdomain',
        icon: 'assets/icons/48/group-by-domain-ignore-subdomain.png',
        ariaLabel: 'Group tabs by domain ignoring subdomains',
        title: 'Group tabs by domain (e.g., example.com)',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'groupGoogleDocsByType',
        id: 'group-google-docs-by-type',
        icon: 'assets/icons/48/group-google-docs-by-type.png',
        ariaLabel: 'Group Google Docs tabs by document type',
        title: 'Group Google Docs, Sheets, Slides, and Forms tabs by type',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'ungroup',
        id: 'ungroup',
        icon: 'assets/icons/48/ungroup.png',
        ariaLabel: 'Ungroup tabs',
        title: 'Ungroup all grouped tabs',
        buttonClass: 'btn-secondary',
      },
    ],
  },
  {
    title: 'Clean Up',
    actions: [
      {
        key: 'removeDuplicates',
        id: 'remove-duplicates',
        icon: 'assets/icons/48/remove-duplicates.png',
        ariaLabel: 'Remove duplicate tabs',
        title: 'Close duplicate tabs keeping one per URL',
        buttonClass: 'btn-secondary',
      },
    ],
  },
  {
    title: 'Move Tabs',
    actions: [
      {
        key: 'moveDomainCurrentWindow',
        id: 'move-domain-current-window',
        icon: 'assets/icons/48/move-domain-current-window.png',
        ariaLabel: 'Move current-window tabs from this domain to a new window',
        title: 'Move every tab from the active tab\'s domain in this window to a new window',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'moveDomainAllWindows',
        id: 'move-domain-all-windows',
        icon: 'assets/icons/48/move-domain-all-windows.png',
        ariaLabel: 'Move tabs from this domain in all windows to a new window',
        title: 'Move every tab from the active tab\'s domain in all windows to a new window',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'moveDomainCurrentWindowNoSubdomain',
        id: 'move-domain-current-window-no-subdomain',
        icon: 'assets/icons/48/move-domain-current-window-no-subdomain.png',
        ariaLabel: 'Move current-window tabs from this base domain to a new window',
        title: 'Move every tab from the active tab\'s base domain in this window to a new window',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'moveDomainAllWindowsNoSubdomain',
        id: 'move-domain-all-windows-no-subdomain',
        icon: 'assets/icons/48/move-domain-all-windows-no-subdomain.png',
        ariaLabel: 'Move tabs from this base domain in all windows to a new window',
        title: 'Move every tab from the active tab\'s base domain in all windows to a new window',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'moveUngroupedCurrentWindow',
        id: 'move-ungrouped-current-window',
        icon: 'assets/icons/48/move-ungrouped-current-window.png',
        ariaLabel: 'Move ungrouped current-window tabs to a new window',
        title: 'Move every ungrouped tab in this window to a new window',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'moveActiveTabToNewWindow',
        id: 'move-active-tab-to-new-window',
        icon: 'assets/icons/48/move-ungrouped-current-window.png',
        ariaLabel: 'Move the active tab to a new window',
        title: 'Move only the active tab in this window to a new window',
        buttonClass: 'btn-secondary',
      },
      {
        key: 'bringDomainToCurrentWindow',
        id: 'bring-domain-to-current-window',
        icon: 'assets/icons/48/bring-domain-to-current-window.png',
        ariaLabel: 'Bring tabs from this domain into this window',
        title: "Bring tabs from the active tab's domain in other windows into this window",
        buttonClass: 'btn-secondary',
      },
      {
        key: 'bringDomainToCurrentWindowNoSubdomain',
        id: 'bring-domain-to-current-window-no-subdomain',
        icon: 'assets/icons/48/bring-domain-to-current-window-no-subdomain.png',
        ariaLabel: 'Bring tabs from this base domain into this window',
        title: "Bring tabs from the active tab's base domain in other windows into this window",
        buttonClass: 'btn-secondary',
      },
      {
        key: 'bringToWindow',
        id: 'bring-to-window',
        icon: 'assets/icons/48/bring-to-window.png',
        ariaLabel: 'Move tabs from all other windows to this window',
        title: 'Move every tab from other windows into this window',
        buttonClass: 'btn-secondary',
      },
    ],
  },
  {
    title: 'Search & Focus',
    actions: [
      {
        key: 'findMediaPlaying',
        id: 'find-media-playing',
        icon: 'assets/icons/48/find-media-playing.png',
        ariaLabel: 'Find media playing',
        title: 'Focus the tab currently playing audio or video',
        buttonClass: 'btn-secondary',
      },
    ],
  },
  {
    title: 'Close Tabs',
    actions: [
      {
        key: 'closeDomainCurrentWindow',
        id: 'close-domain-current-window',
        icon: 'assets/icons/48/close-domain-current-window.png',
        ariaLabel: 'Close domain tabs from current window',
        title: 'Close all tabs with selected domain in current window',
        buttonClass: 'btn-danger',
      },
      {
        key: 'closeDomainAllWindows',
        id: 'close-domain-all-windows',
        icon: 'assets/icons/48/close-domain-all-windows.png',
        ariaLabel: 'Close domain tabs from all windows',
        title: 'Close all tabs with selected domain from all windows',
        buttonClass: 'btn-danger',
      },
    ],
  },
];
