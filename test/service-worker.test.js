import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectGoogleDocsType,
  getDomainSortKey,
  getGroupingKey,
  getGoogleDocsTypeLabel,
} from '../utils.js';

let currentTabs = [];
let settings = {};
let messageHandler;
let moveCalls = [];
let removeCalls = [];
let groups = [];
let groupCalls = [];
let windowCreateCalls = [];
let updateCalls = [];
let currentWindowId = 1;

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
      const ids = new Set(tabIds);
      const movedTabs = tabIds.map((tabId) => {
        const tab = currentTabs.find((candidate) => candidate.id === tabId);
        return moveProperties.windowId === undefined
          ? tab
          : { ...tab, windowId: moveProperties.windowId, pinned: false };
      });
      const remainingTabs = currentTabs.filter((tab) => !ids.has(tab.id));
      const insertIndex = moveProperties.index === -1 ? remainingTabs.length : moveProperties.index;
      remainingTabs.splice(insertIndex, 0, ...movedTabs);
      currentTabs = remainingTabs;
      callback(movedTabs);
    },
    update: (tabId, updateProperties, callback) => {
      updateCalls.push({ tabId, updateProperties });
      currentTabs = currentTabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updateProperties } : tab
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
  },
  storage: {
    sync: {
      get: (defaults, callback) => callback({ ...defaults, ...settings }),
    },
  },
  action: { onClicked: { addListener: () => {} } },
  sidePanel: { open: () => {} },
  windows: {
    WINDOW_ID_CURRENT: currentWindowId,
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
    update: (windowId, updateInfo, callback) => callback({ id: windowId, ...updateInfo }),
  },
  tabGroups: {
    TAB_GROUP_ID_NONE: -1,
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

function runMoveDomainCurrentWindow(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'moveDomainCurrentWindow' }, {}, resolve);
  });
}

function runBringAllToCurrentWindow(tabs, activeSettings = {}) {
  currentTabs = tabs.map((tab) => ({ ...tab }));
  settings = activeSettings;
  moveCalls = [];
  groupCalls = [];
  removeCalls = [];
  windowCreateCalls = [];
  updateCalls = [];
  currentWindowId = 1;
  return new Promise((resolve) => {
    messageHandler({ action: 'bringToWindow' }, {}, resolve);
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

test('bring all to this window moves pinned and grouped tabs', { concurrency: false }, async () => {
  await runBringAllToCurrentWindow([
    createTab(1, 'https://current.example/'),
    createTab(2, 'https://other.example/a', { windowId: 2 }),
    createTab(3, 'https://other.example/pinned', { windowId: 2, pinned: true }),
    createTab(4, 'https://other.example/grouped', { windowId: 3, groupId: 8 }),
  ], { ignorePinnedTabs: true });

  assert.deepEqual(moveCalls, [
    { tabIds: [3], moveProperties: { windowId: 1, index: -1 } },
    { tabIds: [2, 4], moveProperties: { windowId: 1, index: -1 } },
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
