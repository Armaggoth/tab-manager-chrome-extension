import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectAtlassianProduct,
  detectGoogleDocsType,
  getDomainSortKey,
  getGroupingKey,
  getGroupingLabel,
  getGoogleDocsTypeLabel,
} from '../utils.js';

let currentTabs = [];
let settings = {};
let messageHandler;
let moveCalls = [];
let removeCalls = [];
let groups = [];
let groupCalls = [];
let groupMoveCalls = [];
let mergeTransferCalls = [];
let windowCreateCalls = [];
let windowUpdateCalls = [];
let updateCalls = [];
let setPopupCalls = [];
let badgeTextCalls = [];
let badgeColorCalls = [];
let localStorageData = {};
let currentWindowId = 1;
let tabActivatedHandler;
let tabCreatedHandler;
let tabRemovedHandler;
let tabUpdatedHandler;
let tabMovedHandler;
let windowFocusChangedHandler;

globalThis.chrome = {
  tabs: {
    query: (queryInfo, callback) => {
      let result = queryInfo.currentWindow
        ? currentTabs.filter((tab) => tab.windowId === currentWindowId)
        : currentTabs;
      if (queryInfo.active) {
        result = result.filter((tab) => tab.active);
      }
      callback([...result]);
    },
    group: (options, callback) => {
      const groupId = options.groupId ?? Math.max(0, ...groups.map((group) => group.id)) + 1;
      if (options.groupId === undefined) {
        groups.push({ id: groupId, windowId: 1 });
      }
      currentTabs = currentTabs.map((tab) =>
        options.tabIds.includes(tab.id) ? { ...tab, groupId } : tab
      );
      groupCalls.push({ ...options, groupId });
      callback(groupId);
    },
    move: (tabIds, moveProperties, callback) => {
      moveCalls.push({ tabIds: [...tabIds], moveProperties });
      mergeTransferCalls.push([...tabIds]);
      const ids = new Set(tabIds);
      const movedTabs = tabIds.map((tabId) => {
        const tab = currentTabs.find((candidate) => candidate.id === tabId);
        return moveProperties.windowId === undefined
          ? tab
          : {
            ...tab,
            windowId: moveProperties.windowId,
            pinned: false,
            groupId: moveProperties.windowId === tab.windowId ? tab.groupId : -1,
          };
      });
      const remainingTabs = currentTabs.filter((tab) => !ids.has(tab.id));
      const insertIndex = moveProperties.index === -1 ? remainingTabs.length : moveProperties.index;
      remainingTabs.splice(insertIndex, 0, ...movedTabs);
      currentTabs = remainingTabs;
      callback(movedTabs);
    },
    update: (tabId, updateProperties, callback) => {
      updateCalls.push({ tabId, updateProperties });
      const targetWindowId = currentTabs.find((tab) => tab.id === tabId)?.windowId;
      currentTabs = currentTabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, ...updateProperties }
          : updateProperties.active && tab.windowId === targetWindowId
            ? { ...tab, active: false }
            : tab
      );
      const updatedTab = currentTabs.find((tab) => tab.id === tabId);
      if (typeof callback === 'function') callback(updatedTab);
      return Promise.resolve(updatedTab);
    },
    remove: (tabIds, callback) => {
      const ids = new Set(Array.isArray(tabIds) ? tabIds : [tabIds]);
      removeCalls.push(Array.from(ids));
      currentTabs = currentTabs.filter((tab) => !ids.has(tab.id));
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    },
    onActivated: { addListener: (handler) => { tabActivatedHandler = handler; } },
    onCreated: { addListener: (handler) => { tabCreatedHandler = handler; } },
    onRemoved: { addListener: (handler) => { tabRemovedHandler = handler; } },
    onUpdated: { addListener: (handler) => { tabUpdatedHandler = handler; } },
    onMoved: { addListener: (handler) => { tabMovedHandler = handler; } },
  },
  storage: {
    sync: {
      get: (defaults, callback) => {
        const result = { ...defaults, ...settings };
        if (typeof callback === 'function') callback(result);
        return Promise.resolve(result);
      },
    },
    local: {
      get: (key) => {
        const requestedKey = typeof key === 'string' ? key : Object.keys(key)[0];
        return Promise.resolve({ [requestedKey]: localStorageData[requestedKey] });
      },
      set: (items) => {
        Object.assign(localStorageData, items);
        return Promise.resolve();
      },
    },
    onChanged: { addListener: () => {} },
  },
  action: {
    onClicked: { addListener: () => {} },
    setPopup: (options) => {
      setPopupCalls.push(options);
      return Promise.resolve();
    },
    setBadgeText: (details, callback) => {
      badgeTextCalls.push(details.text);
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    },
    setBadgeBackgroundColor: (details, callback) => {
      badgeColorCalls.push(details.color);
      if (typeof callback === 'function') callback();
      return Promise.resolve();
    },
  },
  sidePanel: { open: () => {} },
  windows: {
    WINDOW_ID_CURRENT: currentWindowId,
    WINDOW_ID_NONE: -1,
    onFocusChanged: { addListener: (handler) => { windowFocusChangedHandler = handler; } },
    create: (createData, callback) => {
      const windowId = Math.max(100, ...currentTabs.map((tab) => tab.windowId)) + 1;
      windowCreateCalls.push({ ...createData, windowId });
      currentTabs = currentTabs.map((tab) =>
        tab.id === createData.tabId ? { ...tab, windowId } : tab
      );
      callback({ id: windowId });
    },
    getCurrent: (callback) => {
      const currentWindow = { id: currentWindowId };
      if (typeof callback === 'function') {
        callback(currentWindow);
        return undefined;
      }
      return Promise.resolve(currentWindow);
    },
    update: (windowId, updateInfo, callback) => {
      windowUpdateCalls.push({ windowId, updateInfo });
      const updatedWindow = { id: windowId, ...updateInfo };
      if (typeof callback === 'function') callback(updatedWindow);
      return Promise.resolve(updatedWindow);
    },
  },
  tabGroups: {
    TAB_GROUP_ID_NONE: -1,
    move: async (groupId, moveProperties) => {
      groupMoveCalls.push({ groupId, moveProperties });
      const members = currentTabs.filter((tab) => tab.groupId === groupId);
      mergeTransferCalls.push(members.map((tab) => tab.id));
      currentTabs = currentTabs.filter((tab) => tab.groupId !== groupId);
      currentTabs.push(...members.map((tab) => ({ ...tab, windowId: moveProperties.windowId })));
      groups = groups.map((group) => group.id === groupId
        ? { ...group, windowId: moveProperties.windowId }
        : group);
      return groups.find((group) => group.id === groupId);
    },
    query: (queryInfo, callback) => callback(groups.filter((group) => group.windowId === queryInfo.windowId)),
    update: (groupId, properties, callback) => {
      groups = groups.map((group) =>
        group.id === groupId ? { ...group, ...properties } : group
      );
      callback(groups.find((group) => group.id === groupId));
    },
  },
  runtime: {
    onMessage: {
      addListener: (handler) => {
        messageHandler = handler;
      },
    },
    onInstalled: { addListener: () => {} },
    onStartup: { addListener: () => {} },
  },
};

await import('../service-worker.js');

function createTab(id, url, options = {}) {
  return {
    id,
    url,
    windowId: 1,
    pinned: false,
    groupId: -1,
    ...options,
  };
}

function runSort(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  return new Promise((resolve) => {
    messageHandler({ action: 'sortByDomain' }, {}, resolve);
  });
}

function runRemoveDuplicates(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  return new Promise((resolve) => {
    messageHandler({ action: 'removeDuplicates' }, {}, resolve);
  });
}

function runMoveUngroupedCurrentWindow(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'moveUngroupedCurrentWindow' }, {}, resolve);
  });
}

function runMoveActiveTabToNewWindow(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'moveActiveTabToNewWindow' }, {}, resolve);
  });
}

function runMoveDomainCurrentWindow(tabs, activeSettings = {}, options = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'moveDomainCurrentWindow', ...options }, {}, resolve);
  });
}

function runMoveDomainAllWindows(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'moveDomainAllWindows' }, {}, resolve);
  });
}

function runBringAllToCurrentWindow(tabs, activeSettings = {}, request = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  groupMoveCalls = [];
  mergeTransferCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  windowUpdateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'bringToWindow', ...request }, {}, resolve);
  });
}

function runBringDomainToCurrentWindow(tabs, activeSettings = {}, options = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'bringDomainToCurrentWindow', ...options }, {}, resolve);
  });
}

function runCloseDomainCurrentWindow(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'closeDomainCurrentWindow' }, {}, resolve);
  });
}

function runCloseDomainAllWindows(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'closeDomainAllWindows' }, {}, resolve);
  });
}

function runFindMediaPlaying(tabs) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = {};
  updateCalls = [];
  windowUpdateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'findMediaPlaying' }, {}, resolve);
  });
}

function tabIds() {
  return currentTabs.map((tab) => tab.id);
}

test('sorts tabs alphabetically by hostname', { concurrency: false }, async () => {
  await runSort([
    createTab(1, 'https://gemini.google.com/'),
    createTab(2, 'https://amazon.com/'),
    createTab(3, 'https://aistudio.google.com/'),
  ]);

  assert.deepEqual(tabIds(), [3, 2, 1]);
  assert.equal(moveCalls.length, 1);
  assert.deepEqual(moveCalls[0].tabIds, [3, 2, 1]);
});

test('protects existing groups and leaves singleton buckets ungrouped', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://google.com/old', { groupId: 10 }),
    createTab(2, 'https://google.com/new'),
    createTab(3, 'https://amazon.com/'),
  ];
  groups = [{ id: 10, title: 'google.com', windowId: 1 }];
  settings = {};
  groupCalls = [];

  const runGroup = () =>
    new Promise((resolve) => {
      messageHandler({ action: 'groupByDomain', ignoreSubdomain: false }, {}, resolve);
    });

  await runGroup();
  assert.equal(currentTabs.find((tab) => tab.id === 1).groupId, 10);
  assert.equal(currentTabs.find((tab) => tab.id === 2).groupId, -1);
  assert.equal(currentTabs.find((tab) => tab.id === 3).groupId, -1);
  assert.equal(groupCalls.filter((call) => call.groupId === 10).length, 0);

  const callsAfterFirstRun = groupCalls.length;
  await runGroup();
  assert.equal(groupCalls.length, callsAfterFirstRun);
  assert.equal(groups.filter((group) => group.title === 'google.com').length, 1);
});

test('does not create a group when a domain bucket contains only one eligible tab', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://solo.example/'),
    createTab(2, 'https://shared.example/one'),
    createTab(3, 'https://shared.example/two'),
  ];
  groups = [];
  groupCalls = [];

  await new Promise((resolve) => {
    messageHandler({ action: 'groupByDomain', ignoreSubdomain: false }, {}, resolve);
  });

  assert.deepEqual(
    groupCalls.map((call) => call.tabIds.sort((a, b) => a - b)),
    [[2, 3]]
  );
  assert.equal(groups.filter((group) => group.title === 'shared.example').length, 1);
  assert.equal(groups.find((group) => group.title === 'shared.example').collapsed, true);
});

test('groups Atlassian login and content tabs by application', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://id.atlassian.com/login?application=jira'),
    createTab(2, 'https://client.jira.com/browse/ENG-123'),
    createTab(3, 'https://id.atlassian.com/login?application=confluence'),
    createTab(4, 'https://client.atlassian.net/wiki/spaces/ENG'),
  ];
  groups = [];
  groupCalls = [];

  await new Promise((resolve) => {
    messageHandler({ action: 'groupByDomain', ignoreSubdomain: false }, {}, resolve);
  });

  assert.deepEqual(
    groupCalls.map((call) => call.tabIds.sort((first, second) => first - second)),
    [[1, 2], [3, 4]]
  );
  assert.deepEqual(
    groups.map((group) => group.title),
    ['Jira', 'Confluence']
  );
});

test('moves ungrouped tabs to the right after grouping', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://alpha.example/'),
    createTab(2, 'https://shared.example/one'),
    createTab(3, 'https://shared.example/two'),
    createTab(4, 'https://beta.example/'),
  ];
  groups = [];
  groupCalls = [];
  moveCalls = [];

  await new Promise((resolve) => {
    messageHandler({ action: 'groupByDomain', ignoreSubdomain: false }, {}, resolve);
  });

  assert.deepEqual(tabIds(), [2, 3, 1, 4]);
});

test('does not create a Google Docs group when a document type bucket has only one eligible tab', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://docs.google.com/document/d/solo-doc/edit'),
    createTab(2, 'https://docs.google.com/spreadsheets/d/group-sheet-a/edit'),
    createTab(3, 'https://docs.google.com/spreadsheets/d/group-sheet-b/edit'),
  ];
  groups = [];
  groupCalls = [];

  await new Promise((resolve) => {
    messageHandler({ action: 'groupGoogleDocsByType' }, {}, resolve);
  });

  assert.deepEqual(
    groupCalls.map((call) => call.tabIds.sort((a, b) => a - b)),
    [[2, 3]]
  );
  assert.equal(groups.filter((group) => group.title === 'Google Sheets').length, 1);
  assert.equal(groups.find((group) => group.title === 'Google Sheets').collapsed, true);
});

test('sorts by first domain part after removing www', { concurrency: false }, async () => {
  await runSort([
    createTab(1, 'https://www.google.com/'),
    createTab(2, 'https://aistudio.google.com/'),
    createTab(3, 'https://www.amazon.com/'),
  ]);

  assert.deepEqual(tabIds(), [2, 3, 1]);
});

test('sorts Google editor tabs by document type', { concurrency: false }, async () => {
  await runSort([
    createTab(1, 'https://docs.google.com/forms/d/form/edit'),
    createTab(2, 'https://docs.google.com/document/d/doc/edit'),
    createTab(3, 'https://docs.google.com/videos/d/video/edit'),
    createTab(4, 'https://docs.google.com/spreadsheets/d/sheet/edit'),
    createTab(5, 'https://docs.google.com/presentation/d/slide/edit'),
    createTab(6, 'https://docs.google.com/drawings/d/drawing/edit'),
  ]);

  assert.deepEqual(tabIds(), [2, 4, 5, 1, 3, 6]);
});

test('uses Google editor type groups for Group by Domain', { concurrency: false }, () => {
  assert.equal(getGroupingKey('https://docs.google.com/document/d/id/edit'), 'google:doc');
  assert.equal(
    getGroupingKey('https://docs.google.com/spreadsheets/d/id/edit'),
    'google:spreadsheet'
  );
  assert.equal(
    getGroupingKey('https://docs.google.com/presentation/d/id/edit'),
    'google:presentation'
  );
  assert.equal(getGroupingKey('https://docs.google.com/forms/d/id/edit'), 'google:form');
});

test('detects Atlassian product by URL path on the same host', { concurrency: false }, () => {
  assert.equal(detectAtlassianProduct('https://vailresorts.jira.com/wiki/spaces/GXT/pages/5154045963'), 'confluence');
  assert.equal(detectAtlassianProduct('https://vailresorts.jira.com/browse/GXTD-7520'), 'jira');
  assert.equal(
    detectAtlassianProduct('https://hugeinc.atlassian.net/jira/software/c/projects/DII/boards/1462'),
    'jira'
  );
  assert.equal(
    detectAtlassianProduct('https://herodigital.atlassian.net/jira/for-you?tab=boards'),
    'jira'
  );
  assert.equal(detectAtlassianProduct('https://client.jira.com/secure/Dashboard.jspa'), 'jira');
  assert.equal(
    detectAtlassianProduct(
      'https://id.atlassian.com/login?application=jira&continue=https%3A%2F%2Fvailresorts.jira.com%2Fbrowse%2FGXTD-7798'
    ),
    'jira'
  );
  assert.equal(
    detectAtlassianProduct('https://id.atlassian.com/login?application=confluence'),
    'confluence'
  );
  assert.equal(
    getGroupingKey('https://id.atlassian.com/login?application=bitbucket'),
    'atlassian:bitbucket'
  );
  assert.equal(
    getGroupingLabel('https://id.atlassian.com/login?application=confluence'),
    'Confluence'
  );
  assert.equal(detectAtlassianProduct('https://example.com/login?application=jira'), null);
  assert.equal(detectAtlassianProduct('https://example.com/jira/software/c/projects/DII/boards/1462'), null);
  assert.equal(detectAtlassianProduct('https://example.com/'), null);
});

test('groups Atlassian tabs by product across hosts and page types', { concurrency: false }, () => {
  const jiraLogin = 'https://id.atlassian.com/login?application=jira';
  const jiraTicket = 'https://client.jira.com/browse/ENG-123';
  const confluenceLogin = 'https://id.atlassian.com/login?application=confluence';
  const confluenceArticle = 'https://client.atlassian.net/wiki/spaces/ENG';

  assert.equal(
    getGroupingKey(jiraLogin),
    getGroupingKey(jiraTicket)
  );
  assert.equal(
    getGroupingKey(confluenceLogin),
    getGroupingKey(confluenceArticle)
  );
  assert.notEqual(getGroupingKey(jiraLogin), getGroupingKey(confluenceLogin));
  assert.equal(getGroupingLabel(jiraLogin), 'Jira');
  assert.equal(getGroupingLabel(jiraTicket), 'Jira');
  assert.equal(getGroupingLabel(confluenceLogin), 'Confluence');
  assert.equal(getGroupingLabel(confluenceArticle), 'Confluence');
});

test('keeps Atlassian products separate when ignoring subdomains', { concurrency: false }, () => {
  assert.equal(
    getGroupingKey('https://client.jira.com/wiki/spaces/ENG', true),
    'atlassian:confluence'
  );
  assert.equal(
    getGroupingKey('https://client.jira.com/browse/ENG-123', true),
    'atlassian:jira'
  );
  assert.equal(
    getGroupingLabel('https://client.jira.com/wiki/spaces/ENG', true),
    'Confluence'
  );
  assert.equal(
    getGroupingLabel('https://client.jira.com/browse/ENG-123', true),
    'Jira'
  );
});

test('collapses all Google editor types for Group by Domain without subdomains', () => {
  assert.equal(
    getGroupingKey('https://docs.google.com/document/d/id/edit', true),
    'google.com'
  );
  assert.equal(
    getGroupingKey('https://docs.google.com/spreadsheets/d/id/edit', true),
    'google.com'
  );
  assert.equal(
    getGroupingKey('https://docs.google.com/presentation/d/id/edit', true),
    'google.com'
  );
});

test('detects current Google editor URL families', { concurrency: false }, () => {
  const types = [
    ['document', 'doc'],
    ['spreadsheets', 'spreadsheet'],
    ['presentation', 'presentation'],
    ['forms', 'form'],
    ['videos', 'video'],
    ['drawings', 'drawing'],
  ];

  for (const [path, expectedType] of types) {
    const url = `https://docs.google.com/${path}/d/file-id/edit`;
    assert.equal(detectGoogleDocsType(url), expectedType);
    assert.match(getGoogleDocsTypeLabel(expectedType), /^Google /);
  }
});

test('sorts unsupported Google editor slugs alphabetically after known types', () => {
  assert.equal(
    getDomainSortKey('https://docs.google.com/whiteboards/d/file-id/edit'),
    'docs:99-unknown:whiteboards'
  );
  assert.ok(
    getDomainSortKey('https://docs.google.com/new-editor/d/file-id/edit') <
      getDomainSortKey('https://docs.google.com/whiteboards/d/file-id/edit')
  );
  assert.ok(
    getDomainSortKey('https://docs.google.com/document/d/file-id/edit') <
      getDomainSortKey('https://docs.google.com/new-editor/d/file-id/edit')
  );
});

test('groups all chrome-extension tabs under one sort key', { concurrency: false }, async () => {
  await runSort([
    createTab(1, 'chrome-extension://extension-a/options.html'),
    createTab(2, 'https://amazon.com/'),
    createTab(3, 'chrome-extension://extension-b/options.html'),
  ]);

  assert.deepEqual(tabIds(), [2, 1, 3]);
});

test('does not move tabs when they are already sorted', { concurrency: false }, async () => {
  await runSort([
    createTab(1, 'https://a.example/'),
    createTab(2, 'https://b.example/'),
  ]);

  assert.deepEqual(tabIds(), [1, 2]);
  assert.equal(moveCalls.length, 0);
});

test('sorts special tabs consistently and remains stable when repeated', { concurrency: false }, async () => {
  const tabs = [
    createTab(1, 'https://gemini.google.com/'),
    createTab(2, 'chrome://extensions/'),
    createTab(3, 'https://amazon.com/'),
    createTab(4, 'https://aistudio.google.com/'),
  ];

  await runSort(tabs);
  assert.deepEqual(tabIds(), [4, 3, 2, 1]);

  await new Promise((resolve) => {
    messageHandler({ action: 'sortByDomain' }, {}, resolve);
  });
  assert.deepEqual(tabIds(), [4, 3, 2, 1]);
});

test('sorts pinned tabs when ignore pinned tabs is disabled', { concurrency: false }, async () => {
  await runSort([
    createTab(1, 'https://z.example/', { pinned: true }),
    createTab(2, 'https://a.example/', { pinned: true }),
    createTab(3, 'https://c.example/'),
  ], { ignorePinnedTabs: false });

  assert.deepEqual(currentTabs.map((tab) => tab.id), [2, 1, 3]);
});

test('preserves pinned tabs when ignore pinned tabs is enabled', { concurrency: false }, async () => {
  await runSort(
    [
      createTab(1, 'https://z.example/'),
      createTab(2, 'https://a.example/'),
      createTab(3, 'https://p.example/', { pinned: true }),
      createTab(4, 'https://b.example/', { groupId: 7 }),
      createTab(5, 'https://c.example/'),
    ],
    { ignorePinnedTabs: true }
  );

  assert.deepEqual(
    currentTabs.filter((tab) => !tab.pinned && tab.groupId === -1).map((tab) => tab.id),
    [2, 5, 1]
  );
  assert.deepEqual(
    currentTabs.filter((tab) => tab.pinned || tab.groupId !== -1).map((tab) => tab.id).sort(),
    [3, 4]
  );
});

test('protects grouped tabs during sorting regardless of the setting', { concurrency: false }, async () => {
  await runSort(
    [
      createTab(1, 'https://z.example/', { groupId: 9 }),
      createTab(2, 'https://a.example/'),
      createTab(3, 'https://c.example/'),
    ],
    {}
  );

  assert.equal(currentTabs.find((tab) => tab.id === 1).groupId, 9);
  assert.deepEqual(
    currentTabs.filter((tab) => tab.groupId === -1).map((tab) => tab.id),
    [2, 3]
  );
});

test('removeDuplicates removes exact duplicate URLs and keeps first instance', { concurrency: false }, async () => {
  await runRemoveDuplicates([
    createTab(1, 'https://example.com/page1'),
    createTab(2, 'https://example.com/page2'),
    createTab(3, 'https://example.com/page1'),
  ]);

  assert.deepEqual(tabIds(), [1, 2]);
  assert.deepEqual(removeCalls, [[3]]);
});

test('removeDuplicates keeps the active tab when it is a duplicate', { concurrency: false }, async () => {
  await runRemoveDuplicates([
    createTab(1, 'https://example.com/page1'),
    createTab(2, 'https://example.com/page1'),
    createTab(3, 'https://example.com/page1', { active: true }),
  ]);

  assert.deepEqual(tabIds(), [3]);
  assert.deepEqual(removeCalls, [[1, 2]]);
});

test('removeDuplicates detects duplicate Google Docs by document ID when setting enabled', { concurrency: false }, async () => {
  const doc1 = 'https://docs.google.com/document/d/12345/edit?tab=t.0';
  const doc1AnotherTab = 'https://docs.google.com/document/d/12345/edit?tab=t.1';
  const doc2 = 'https://docs.google.com/document/d/67890/edit';

  await runRemoveDuplicates([
    createTab(1, doc1),
    createTab(2, doc2),
    createTab(3, doc1AnotherTab),
  ], { detectDuplicateGoogleDocs: true });

  assert.deepEqual(tabIds(), [1, 2]);
  assert.deepEqual(removeCalls, [[3]]);
});

test('removeDuplicates treats different Google Docs URLs as separate when setting disabled', { concurrency: false }, async () => {
  const doc1 = 'https://docs.google.com/document/d/12345/edit?tab=t.0';
  const doc1AnotherTab = 'https://docs.google.com/document/d/12345/edit?tab=t.1';

  await runRemoveDuplicates([
    createTab(1, doc1),
    createTab(2, doc1AnotherTab),
  ], { detectDuplicateGoogleDocs: false });

  assert.deepEqual(tabIds(), [1, 2]);
  assert.deepEqual(removeCalls, []);
});

test('removeDuplicates respects ignorePinnedTabs and protects grouped tabs', { concurrency: false }, async () => {
  await runRemoveDuplicates([
    createTab(1, 'https://example.com/page1', { pinned: true }),
    createTab(2, 'https://example.com/page1'),
    createTab(3, 'https://example.com/page2', { groupId: 5 }),
    createTab(4, 'https://example.com/page2'),
  ], { ignorePinnedTabs: true });

  // Tab 1 is pinned & ignored -> skipped by filter. Tab 2 is first seen unpinned.
  // Tab 3 is grouped -> skipped by filter. Tab 4 is first seen unpinned for page2.
  assert.deepEqual(tabIds(), [1, 2, 3, 4]);
  assert.deepEqual(removeCalls, []);
});

test('removeDuplicates treats duplicate chrome URLs like duplicate regular URLs', { concurrency: false }, async () => {
  await runRemoveDuplicates([
    createTab(1, 'chrome://extensions/'),
    createTab(2, 'https://example.com/'),
    createTab(3, 'chrome://extensions/'),
  ]);

  assert.deepEqual(tabIds(), [1, 2]);
  assert.deepEqual(removeCalls, [[3]]);
});

test('moves eligible ungrouped current-window tabs to a new window', { concurrency: false }, async () => {
  await runMoveUngroupedCurrentWindow([
    createTab(1, 'https://alpha.example/'),
    createTab(2, 'https://grouped.example/', { groupId: 5 }),
    createTab(3, 'chrome://extensions/'),
    createTab(4, 'https://pinned.example/', { pinned: true }),
    createTab(5, 'https://other-window.example/', { windowId: 2 }),
    createTab(6, 'https://beta.example/'),
  ], { ignorePinnedTabs: true });

  const movedWindowId = windowCreateCalls[0].windowId;
  assert.deepEqual(windowCreateCalls.map(({ tabId }) => tabId), [1]);
  assert.deepEqual(moveCalls, [{ tabIds: [3, 6], moveProperties: { windowId: movedWindowId, index: -1 } }]);
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === movedWindowId).map((tab) => tab.id),
    [1, 3, 6]
  );
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === 1).map((tab) => tab.id),
    [2, 4]
  );
  assert.equal(currentTabs.find((tab) => tab.id === 5).windowId, 2);
});

test('moves only the active current-window tab to a new window', { concurrency: false }, async () => {
  await runMoveActiveTabToNewWindow([
    createTab(1, 'https://first.example/'),
    createTab(2, 'https://active.example/', { active: true, groupId: 7 }),
    createTab(3, 'https://third.example/'),
    createTab(4, 'https://other-window.example/', { windowId: 2, active: true }),
  ]);

  const movedWindowId = windowCreateCalls[0].windowId;
  assert.deepEqual(windowCreateCalls.map(({ tabId }) => tabId), [2]);
  assert.deepEqual(moveCalls, []);
  assert.equal(currentTabs.find((tab) => tab.id === 2).windowId, movedWindowId);
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === 1).map((tab) => tab.id),
    [1, 3]
  );
  assert.equal(currentTabs.find((tab) => tab.id === 4).windowId, 2);
});

test('does not move an active pinned tab when pinned tabs are ignored', { concurrency: false }, async () => {
  await runMoveActiveTabToNewWindow([
    createTab(1, 'https://active.example/', { active: true, pinned: true }),
  ], { ignorePinnedTabs: true });

  assert.deepEqual(windowCreateCalls, []);
  assert.equal(currentTabs[0].windowId, 1);
});

test('moves current-window domain tabs by active tab domain without a prompt value', { concurrency: false }, async () => {
  await runMoveDomainCurrentWindow([
    createTab(1, 'https://target.example/start', { active: true }),
    createTab(2, 'https://target.example/next'),
    createTab(3, 'https://other.example/'),
    createTab(4, 'https://target.example/grouped', { groupId: 7 }),
    createTab(5, 'https://target.example/other-window', { windowId: 2 }),
  ]);

  const movedWindowId = windowCreateCalls[0].windowId;
  assert.deepEqual(windowCreateCalls.map(({ tabId }) => tabId), [1]);
  assert.deepEqual(moveCalls, [
    { tabIds: [2, 4], moveProperties: { windowId: movedWindowId, index: -1 } },
  ]);
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === movedWindowId).map((tab) => tab.id),
    [1, 2, 4]
  );
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === 1).map((tab) => tab.id),
    [3]
  );
  assert.equal(currentTabs.find((tab) => tab.id === 5).windowId, 2);
});

test('moves only the active Google editor type for domain moves', { concurrency: false }, async () => {
  await runMoveDomainCurrentWindow([
    createTab(1, 'https://docs.google.com/document/d/doc-a/edit', { active: true }),
    createTab(2, 'https://docs.google.com/document/d/doc-b/edit', { groupId: 7 }),
    createTab(3, 'https://docs.google.com/spreadsheets/d/sheet-a/edit'),
    createTab(4, 'https://docs.google.com/presentation/d/slide-a/edit'),
    createTab(5, 'https://other.example/'),
  ]);

  const movedWindowId = windowCreateCalls[0].windowId;
  assert.deepEqual(windowCreateCalls.map(({ tabId }) => tabId), [1]);
  assert.deepEqual(moveCalls, [
    { tabIds: [2], moveProperties: { windowId: movedWindowId, index: -1 } },
  ]);
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === movedWindowId).map((tab) => tab.id),
    [1, 2]
  );
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === 1).map((tab) => tab.id),
    [3, 4, 5]
  );
});

test('moves matching base-domain tabs with no-subdomain domain moves', { concurrency: false }, async () => {
  await runMoveDomainCurrentWindow(
    [
      createTab(1, 'https://www.example.com/start', { active: true }),
      createTab(2, 'https://app.example.com/next'),
      createTab(3, 'https://other.example/'),
      createTab(4, 'https://example.com/grouped', { groupId: 7 }),
    ],
    {},
    { action: 'moveDomainCurrentWindowNoSubdomain' }
  );

  const movedWindowId = windowCreateCalls[0].windowId;
  assert.deepEqual(moveCalls, [
    { tabIds: [2, 4], moveProperties: { windowId: movedWindowId, index: -1 } },
  ]);
});

test('groups Google Docs editor tabs together for no-subdomain domain moves', { concurrency: false }, async () => {
  await runMoveDomainCurrentWindow(
    [
      createTab(1, 'https://docs.google.com/document/d/doc-a/edit', { active: true }),
      createTab(2, 'https://docs.google.com/spreadsheets/d/sheet-a/edit'),
      createTab(3, 'https://docs.google.com/presentation/d/slide-a/edit'),
      createTab(4, 'https://other.example/'),
    ],
    {},
    { action: 'moveDomainCurrentWindowNoSubdomain' }
  );

  assert.deepEqual(moveCalls, [
    { tabIds: [2, 3], moveProperties: { windowId: windowCreateCalls[0].windowId, index: -1 } },
  ]);
});

test('bring all to this window moves pinned and grouped tabs', { concurrency: false }, async () => {
  await runBringAllToCurrentWindow([
    createTab(1, 'https://current.example/'),
    createTab(2, 'https://other.example/a', { windowId: 2 }),
    createTab(3, 'https://other.example/pinned', { windowId: 2, pinned: true }),
    createTab(4, 'https://other.example/grouped', { windowId: 3, groupId: 8 }),
  ], { ignorePinnedTabs: true });

  assert.deepEqual(moveCalls, [
    { tabIds: [3], moveProperties: { windowId: 1, index: -1 } },
    { tabIds: [2], moveProperties: { windowId: 1, index: -1 } },
  ]);
  assert.deepEqual(groupMoveCalls, [
    { groupId: 8, moveProperties: { windowId: 1, index: -1 } },
  ]);
  assert.deepEqual(updateCalls, [
    { tabId: 3, updateProperties: { pinned: true } },
  ]);
  assert.deepEqual(
    currentTabs.filter((tab) => tab.windowId === 1).map((tab) => tab.id),
    [1, 3, 2, 4]
  );
  assert.equal(currentTabs.find((tab) => tab.id === 3).pinned, true);
  assert.equal(currentTabs.find((tab) => tab.id === 4).groupId, 8);
});

test('bring all to this window leaves an active pinned source tab until last with 120 sleeping tabs', { concurrency: false }, async () => {
  const sleepingTabs = Array.from({ length: 120 }, (_, index) =>
    createTab(index + 3, `https://sleeping.example/${index}`, {
      windowId: 2,
      active: false,
      discarded: true,
    })
  );

  await runBringAllToCurrentWindow([
    createTab(1, 'https://destination.example/', { active: true }),
    createTab(2, 'https://source.example/', { windowId: 2, pinned: true, active: true }),
    ...sleepingTabs,
  ]);

  assert.deepEqual(mergeTransferCalls, [...sleepingTabs.map((tab) => [tab.id]), [2]]);
  assert.equal(currentTabs.filter((tab) => tab.discarded).length, 120);
  assert.ok(currentTabs.every((tab) => tab.windowId === 1));
  assert.deepEqual(updateCalls, [
    { tabId: 2, updateProperties: { pinned: true } },
    { tabId: 1, updateProperties: { active: true } },
    { tabId: 1, updateProperties: { active: true } },
  ]);
  assert.deepEqual(removeCalls, []);
  assert.deepEqual(windowCreateCalls, []);
});

test('bring all to this window moves the active group last and preserves separate same-title groups', { concurrency: false }, async () => {
  groups = [
    { id: 7, windowId: 1, title: 'Work', color: 'blue', collapsed: true },
    { id: 8, windowId: 2, title: 'Work', color: 'green', collapsed: false },
    { id: 9, windowId: 2, title: 'Work', color: 'red', collapsed: true },
    { id: 10, windowId: 3, title: 'Other', color: 'yellow', collapsed: false },
  ];
  const expectedGroups = groups.map((group) => ({ ...group, windowId: 1 }));

  await runBringAllToCurrentWindow([
    createTab(1, 'https://destination.example/', { active: true }),
    createTab(2, 'https://destination.example/grouped', { groupId: 7 }),
    createTab(3, 'https://source.example/active', { windowId: 2, groupId: 8, active: true }),
    createTab(4, 'https://source.example/member', { windowId: 2, groupId: 8, discarded: true }),
    createTab(5, 'https://source.example/other', { windowId: 2, groupId: 9, discarded: true }),
    createTab(6, 'https://source.example/loose', { windowId: 2, discarded: true }),
    createTab(7, 'https://third.example/', { windowId: 3, groupId: 10, active: true }),
  ]);

  assert.deepEqual(mergeTransferCalls, [[5], [6], [3, 4], [7]]);
  assert.deepEqual(groupMoveCalls.map((call) => call.groupId), [9, 8, 10]);
  assert.deepEqual(groups, expectedGroups);
  assert.deepEqual(currentTabs.filter((tab) => tab.groupId === 8).map((tab) => tab.id), [3, 4]);
  assert.equal(currentTabs.filter((tab) => tab.discarded).length, 3);
  assert.deepEqual(groupCalls, []);
  assert.deepEqual(updateCalls, [
    { tabId: 1, updateProperties: { active: true } },
    { tabId: 1, updateProperties: { active: true } },
    { tabId: 1, updateProperties: { active: true } },
  ]);
});

test('bring all to this window does nothing when no other windows have tabs', { concurrency: false }, async () => {
  await runBringAllToCurrentWindow([
    createTab(1, 'https://destination.example/', { active: true }),
  ]);

  assert.deepEqual(mergeTransferCalls, []);
  assert.deepEqual(updateCalls, []);
});

test('bring all uses the originating active tab window even when the worker current window differs', { concurrency: false }, async () => {
  groups = [{ id: 19, windowId: 3, title: 'Source', color: 'blue' }];
  const response = await runBringAllToCurrentWindow(
    [
      createTab(1, 'https://other-window.example/', { active: true }),
      createTab(2, 'https://destination.example/', { windowId: 2, active: true, pinned: true }),
      createTab(3, 'https://destination.example/loose', { windowId: 2 }),
      createTab(4, 'https://source.example/', { windowId: 3, active: true, groupId: 19 }),
      createTab(5, 'https://source.example/pinned', { windowId: 3, pinned: true }),
    ],
    { ignorePinnedTabs: true },
    { windowId: 2, activeTabId: 2 }
  );

  assert.equal(response.success, true);
  assert.ok(currentTabs.every((tab) => tab.windowId === 2));
  assert.deepEqual(currentTabs.filter((tab) => tab.active).map((tab) => tab.id), [2]);
  assert.ok(moveCalls.every((call) => call.moveProperties.windowId === 2));
  assert.ok(moveCalls.every((call) => !call.tabIds.includes(2) && !call.tabIds.includes(3)));
  assert.deepEqual(groupMoveCalls, [{ groupId: 19, moveProperties: { windowId: 2, index: -1 } }]);
  assert.equal(currentTabs.find((tab) => tab.id === 2).pinned, true);
  assert.equal(currentTabs.find((tab) => tab.id === 5).pinned, true);
  assert.deepEqual(windowUpdateCalls, [{ windowId: 2, updateInfo: { focused: true } }]);
  assert.deepEqual(windowCreateCalls, []);
  assert.deepEqual(removeCalls, []);
});

test('bring all refuses a stale destination instead of merging into a different window', { concurrency: false }, async (t) => {
  const loggedErrors = [];
  t.mock.method(console, 'error', (...args) => loggedErrors.push(args));
  const response = await runBringAllToCurrentWindow(
    [
      createTab(1, 'https://current.example/', { active: true }),
      createTab(2, 'https://moved-destination.example/', { windowId: 3, active: true }),
    ],
    {},
    { windowId: 2, activeTabId: 2 }
  );

  assert.equal(response.success, false);
  assert.match(response.error, /original destination tab/);
  assert.equal(loggedErrors.length, 1);
  assert.deepEqual(mergeTransferCalls, []);
  assert.deepEqual(updateCalls, []);
  assert.deepEqual(windowUpdateCalls, []);
  assert.deepEqual(currentTabs.map((tab) => tab.windowId), [1, 3]);
});

test('brings matching domain tabs from other windows to the current window', { concurrency: false }, async () => {
  await runBringDomainToCurrentWindow([
    createTab(1, 'https://app.example.com/current', { active: true }),
    createTab(2, 'https://app.example.com/other', { windowId: 2 }),
    createTab(3, 'https://www.example.com/other', { windowId: 2 }),
    createTab(4, 'https://app.example.com/pinned', { windowId: 3, pinned: true }),
    createTab(5, 'https://app.example.com/grouped', { windowId: 3, groupId: 8 }),
  ], { ignorePinnedTabs: false });

  assert.deepEqual(moveCalls, [
    { tabIds: [4], moveProperties: { windowId: 1, index: -1 } },
    { tabIds: [2, 5], moveProperties: { windowId: 1, index: -1 } },
  ]);
  assert.deepEqual(updateCalls, [{ tabId: 4, updateProperties: { pinned: true } }]);
  assert.equal(currentTabs.find((tab) => tab.id === 3).windowId, 2);
});

test('brings matching base-domain tabs from other windows to the current window', { concurrency: false }, async () => {
  await runBringDomainToCurrentWindow(
    [
      createTab(1, 'https://www.example.com/current', { active: true }),
      createTab(2, 'https://app.example.com/other', { windowId: 2 }),
      createTab(3, 'https://other.example/other', { windowId: 2 }),
    ],
    {},
    { action: 'bringDomainToCurrentWindowNoSubdomain' }
  );

  assert.deepEqual(moveCalls, [
    { tabIds: [2], moveProperties: { windowId: 1, index: -1 } },
  ]);
  assert.equal(currentTabs.find((tab) => tab.id === 3).windowId, 2);
});

test('closes current-window domain tabs including grouped matches', { concurrency: false }, async () => {
  await runCloseDomainCurrentWindow([
    createTab(1, 'https://target.example/start', { active: true }),
    createTab(2, 'https://target.example/grouped', { groupId: 7 }),
    createTab(3, 'https://target.example/other-window', { windowId: 2 }),
    createTab(4, 'https://other.example/'),
  ]);

  assert.deepEqual(removeCalls, [[1, 2]]);
  assert.deepEqual(tabIds(), [3, 4]);
});

test('closes current-window Google editor type tabs including grouped matches', { concurrency: false }, async () => {
  await runCloseDomainCurrentWindow([
    createTab(1, 'https://docs.google.com/document/d/doc-a/edit', { active: true }),
    createTab(2, 'https://docs.google.com/document/d/doc-b/edit', { groupId: 7 }),
    createTab(3, 'https://docs.google.com/spreadsheets/d/sheet-a/edit'),
    createTab(4, 'https://docs.google.com/document/d/doc-other-window/edit', { windowId: 2 }),
  ]);

  assert.deepEqual(removeCalls, [[1, 2]]);
  assert.deepEqual(tabIds(), [3, 4]);
});

test('closes all-window Google editor type tabs including grouped matches', { concurrency: false }, async () => {
  await runCloseDomainAllWindows([
    createTab(1, 'https://docs.google.com/spreadsheets/d/sheet-a/edit', { active: true }),
    createTab(2, 'https://docs.google.com/spreadsheets/d/sheet-b/edit', { groupId: 7 }),
    createTab(3, 'https://docs.google.com/spreadsheets/d/sheet-c/edit', { windowId: 2 }),
    createTab(4, 'https://docs.google.com/document/d/doc-a/edit', { windowId: 2 }),
    createTab(5, 'https://docs.google.com/spreadsheets/d/sheet-pinned/edit', {
      pinned: true,
      windowId: 2,
    }),
  ], { ignorePinnedTabs: true });

  assert.deepEqual(removeCalls, [[1, 2, 3]]);
  assert.deepEqual(tabIds(), [4, 5]);
});

test('applies the popup-free side panel access mode by default on load', { concurrency: false }, async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(setPopupCalls.at(-1), { popup: '' });
});

test('sets a badge background color on load', () => {
  assert.equal(badgeColorCalls.length, 1);
  assert.match(badgeColorCalls[0], /^#/);
});

test('badge shows total matching tabs across all windows for the active domain', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://example.com/', { active: true }),
    createTab(2, 'https://example.com/other'),
    createTab(3, 'https://example.com/other-window', { windowId: 2 }),
    createTab(4, 'https://other.example/', { windowId: 2 }),
    createTab(5, 'https://example.com/pinned', { windowId: 3, pinned: true }),
  ];
  settings = { ignorePinnedTabs: true };
  currentWindowId = 1;
  badgeTextCalls = [];

  await new Promise((resolve) => {
    tabActivatedHandler({});
    setTimeout(resolve, 0);
  });

  assert.equal(badgeTextCalls.at(-1), '3');
  const { counts } = await new Promise((resolve) => {
    messageHandler({ action: 'getAffectedTabCounts' }, {}, resolve);
  });
  assert.equal(badgeTextCalls.at(-1), String(counts.closeDomainAllWindows));
  assert.equal(counts.closeDomainAllWindows, counts.moveDomainAllWindows);
});

test('active-tab move count reflects the active tab and pinned-tab setting', { concurrency: false }, async () => {
  currentTabs = [createTab(1, 'https://active.example/', { active: true })];
  settings = { ignorePinnedTabs: true };
  currentWindowId = 1;

  const { counts } = await new Promise((resolve) => {
    messageHandler({ action: 'getAffectedTabCounts' }, {}, resolve);
  });
  assert.equal(counts.moveActiveTabToNewWindow, 1);

  currentTabs[0].pinned = true;
  const pinnedResult = await new Promise((resolve) => {
    messageHandler({ action: 'getAffectedTabCounts' }, {}, resolve);
  });
  assert.equal(pinnedResult.counts.moveActiveTabToNewWindow, 0);
});

test('badge refreshes when switching windows without activating another tab', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://example.com/', { active: true }),
    createTab(2, 'https://example.com/other'),
    createTab(3, 'https://other.example/', { windowId: 2, active: true }),
  ];
  settings = {};
  currentWindowId = 1;
  badgeTextCalls = [];

  await tabActivatedHandler({});
  assert.equal(badgeTextCalls.at(-1), '2');

  assert.equal(typeof windowFocusChangedHandler, 'function');
  currentWindowId = 2;
  await windowFocusChangedHandler(2);
  assert.equal(badgeTextCalls.at(-1), '1');

  currentTabs = [];
  await windowFocusChangedHandler(chrome.windows.WINDOW_ID_NONE);
  assert.equal(badgeTextCalls.at(-1), '1');
});

test('badge counts every matching tab already in a tab group, not just its window', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://example.com/', { active: true }),
    createTab(2, 'https://example.com/grouped-a', { windowId: 2, groupId: 5 }),
    createTab(3, 'https://example.com/grouped-b', { windowId: 2, groupId: 5 }),
  ];
  settings = {};
  currentWindowId = 1;
  badgeTextCalls = [];

  await new Promise((resolve) => {
    tabActivatedHandler({});
    setTimeout(resolve, 0);
  });

  assert.equal(badgeTextCalls.at(-1), '3');
});

test('clears and skips computing the badge when badgeEnabled is false', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://example.com/', { active: true }),
    createTab(2, 'https://example.com/other-window', { windowId: 2 }),
  ];
  settings = { badgeEnabled: false };
  currentWindowId = 1;
  badgeTextCalls = [];

  await new Promise((resolve) => {
    tabActivatedHandler({});
    setTimeout(resolve, 0);
  });

  assert.equal(badgeTextCalls.at(-1), '');
});

test('badge caps at 9+ and clears when nothing matches the active tab', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'https://example.com/', { active: true }),
    ...Array.from({ length: 10 }, (_, index) =>
      createTab(100 + index, 'https://example.com/other', { windowId: 100 + index })
    ),
  ];
  settings = {};
  currentWindowId = 1;
  badgeTextCalls = [];

  await new Promise((resolve) => {
    tabActivatedHandler({});
    setTimeout(resolve, 0);
  });

  assert.equal(badgeTextCalls.at(-1), '9+');

  currentTabs = [createTab(1, 'https://example.com/', { pinned: true, active: true })];
  settings = { ignorePinnedTabs: true };
  badgeTextCalls = [];

  await new Promise((resolve) => {
    tabActivatedHandler({});
    setTimeout(resolve, 0);
  });

  assert.equal(badgeTextCalls.at(-1), '');
});

test('badge recalculates on tab create/remove events for the active domain', { concurrency: false }, async () => {
  currentTabs = [createTab(1, 'https://example.com/', { active: true })];
  settings = {};
  currentWindowId = 1;
  badgeTextCalls = [];

  await new Promise((resolve) => {
    tabActivatedHandler({});
    setTimeout(resolve, 0);
  });
  assert.equal(badgeTextCalls.at(-1), '1');

  currentTabs.push(createTab(2, 'https://example.com/', { windowId: 2 }));
  await new Promise((resolve) => {
    tabCreatedHandler({});
    setTimeout(resolve, 0);
  });
  assert.equal(badgeTextCalls.at(-1), '2');

  currentTabs = currentTabs.filter((tab) => tab.id !== 2);
  await new Promise((resolve) => {
    tabRemovedHandler(2, {});
    setTimeout(resolve, 0);
  });
  assert.equal(badgeTextCalls.at(-1), '1');
});

test('names hostname-less protocols instead of grouping them as unknown', () => {
  assert.equal(getGroupingKey('file:///Users/me/report.html'), 'file');
  assert.equal(getGroupingLabel('file:///Users/me/report.html'), 'Local Files');
  assert.equal(getGroupingKey('about:blank'), 'about');
  assert.equal(getGroupingLabel('about:blank'), 'Browser Pages');
  assert.equal(getGroupingKey('mailto:someone@example.com'), 'mailto');
  assert.equal(getGroupingLabel('mailto:someone@example.com'), 'Mail Links');
});

test('groups file:// tabs together under a Local Files group', { concurrency: false }, async () => {
  currentTabs = [
    createTab(1, 'file:///Users/me/report-a.html'),
    createTab(2, 'file:///Users/me/report-b.html'),
    createTab(3, 'https://example.com/'),
  ];
  groups = [];
  groupCalls = [];

  await new Promise((resolve) => {
    messageHandler({ action: 'groupByDomain', ignoreSubdomain: false }, {}, resolve);
  });

  assert.deepEqual(
    groupCalls.map((call) => call.tabIds.sort((a, b) => a - b)),
    [[1, 2]]
  );
  assert.equal(groups.find((group) => group.title === 'Local Files')?.title, 'Local Files');
});

test('finds and focuses the tab currently playing media', { concurrency: false }, async () => {
  await runFindMediaPlaying([
    createTab(1, 'https://silent.example/', { windowId: 1 }),
    createTab(2, 'https://playing.example/', { windowId: 2, audible: true }),
    createTab(3, 'https://other.example/', { windowId: 2 }),
  ]);

  assert.deepEqual(windowUpdateCalls, [{ windowId: 2, updateInfo: { focused: true } }]);
  assert.deepEqual(updateCalls, [
    { tabId: 2, updateProperties: { highlighted: true, active: true } },
  ]);
});

test('does nothing when no tab is playing media', { concurrency: false }, async () => {
  await runFindMediaPlaying([
    createTab(1, 'https://silent.example/'),
    createTab(2, 'https://also-silent.example/'),
  ]);

  assert.deepEqual(windowUpdateCalls, []);
  assert.deepEqual(updateCalls, []);
});

test('records feature usage for tracked actions', { concurrency: false }, async () => {
  localStorageData = {};
  await runSort([
    createTab(1, 'https://b.example/'),
    createTab(2, 'https://a.example/'),
  ]);

  assert.equal(localStorageData.usageStats.sortByDomain.count, 1);
  assert.ok(localStorageData.usageStats.sortByDomain.lastUsedAt > 0);
});

test('increments usage count on repeated use of the same feature', { concurrency: false }, async () => {
  localStorageData = {};
  await runSort([
    createTab(1, 'https://b.example/'),
    createTab(2, 'https://a.example/'),
  ]);
  await runSort([
    createTab(1, 'https://b.example/'),
    createTab(2, 'https://a.example/'),
  ]);

  assert.equal(localStorageData.usageStats.sortByDomain.count, 2);
});

test('does not record usage when a tracked action makes no change', { concurrency: false }, async () => {
  localStorageData = {};
  await runSort([
    createTab(1, 'https://a.example/'),
    createTab(2, 'https://b.example/'),
  ]);

  assert.equal(localStorageData.usageStats, undefined);
});

test('records no-subdomain grouping separately from normal domain grouping', { concurrency: false }, async () => {
  localStorageData = {};
  currentTabs = [
    createTab(1, 'https://one.example.com/'),
    createTab(2, 'https://two.example.com/'),
  ];
  settings = {};
  groups = [];
  groupCalls = [];

  await new Promise((resolve) => {
    messageHandler({ action: 'groupByDomain', ignoreSubdomain: true }, {}, resolve);
  });

  assert.equal(localStorageData.usageStats.groupByDomainNoSubdomain.count, 1);
  assert.equal(localStorageData.usageStats.groupByDomain, undefined);
});

test('does not record usage for pinned-only domain moves when pinned tabs are ignored', { concurrency: false }, async () => {
  localStorageData = {};
  await runMoveDomainAllWindows([
    createTab(1, 'https://mail.google.com/mail/u/0/', { active: true, pinned: true }),
    createTab(2, 'https://example.com/', { windowId: 2 }),
  ], { ignorePinnedTabs: true });

  assert.deepEqual(windowCreateCalls, []);
  assert.equal(localStorageData.usageStats, undefined);
});

test('does not record usage for debug-only actions', { concurrency: false }, async () => {
  localStorageData = {};
  currentTabs = [createTab(1, 'https://a.example/')];
  settings = {};

  await new Promise((resolve) => {
    messageHandler({ action: 'scrambleTabs' }, {}, resolve);
  });

  assert.equal(localStorageData.usageStats, undefined);
});
