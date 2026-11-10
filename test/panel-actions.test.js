import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(tagName, document) {
    this.tagName = tagName;
    this.document = document;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.dataset = {};
    this.classList = {
      add: (...classes) => {
        this.className = [...new Set([...this.className.split(' '), ...classes])].join(' ');
      },
    };
    this.textContent = '';
    this.className = '';
    this.title = '';
    this.hidden = false;
  }

  set id(value) {
    this._id = value;
    this.document.elements.set(value, this);
  }

  get id() {
    return this._id;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  appendChild(child) {
    this.children.push(child);
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = children;
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  async click() {
    await this.listeners.click?.();
  }

  focus() {}
}

function createFakeDocument() {
  const fakeDocument = {
    elements: new Map(),
    createElement(tagName) {
      return new FakeElement(tagName, this);
    },
    createElementNS(_namespace, tagName) {
      return new FakeElement(tagName, this);
    },
    getElementById(id) {
      return this.elements.get(id) || null;
    },
  };
  return fakeDocument;
}

test('wires Group by Domain (No Subdomain) from rendered action metadata', async () => {
  const sentMessages = [];
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: {
      sendMessage: async (message) => {
        sentMessages.push(message);
      },
      openOptionsPage: () => {},
    },
    tabs: { query: () => {} },
  };

  const { getActionButtons, initActionButtons, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);
  initActionButtons(getActionButtons());

  await document.getElementById('group-by-domain-ignore-subdomain').click();

  assert.deepEqual(sentMessages, [{ action: 'groupByDomain', ignoreSubdomain: true }]);
});

test('wires no-subdomain move actions from rendered action metadata', async () => {
  const sentMessages = [];
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: {
      sendMessage: async (message) => {
        sentMessages.push(message);
      },
      openOptionsPage: () => {},
    },
    tabs: {
      query: (_query, callback) => callback([{ url: 'https://www.example.com/page' }]),
    },
  };

  const { getActionButtons, initActionButtons, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);
  initActionButtons(getActionButtons());

  await document.getElementById('move-domain-current-window-no-subdomain').click();
  await document.getElementById('move-domain-all-windows-no-subdomain').click();

  assert.deepEqual(sentMessages, [
    { action: 'moveDomainCurrentWindowNoSubdomain', domain: 'www.example.com' },
    { action: 'moveDomainAllWindowsNoSubdomain', domain: 'www.example.com' },
  ]);
});

test('wires Move Active Tab to New Window from rendered action metadata', async () => {
  const sentMessages = [];
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: {
      sendMessage: async (message) => {
        sentMessages.push(message);
      },
      openOptionsPage: () => {},
    },
    tabs: { query: () => {} },
  };

  const { getActionButtons, initActionButtons, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);
  initActionButtons(getActionButtons());

  await document.getElementById('move-active-tab-to-new-window').click();

  assert.deepEqual(sentMessages, [{ action: 'moveActiveTabToNewWindow' }]);
});

test('wires domain bring actions from rendered action metadata', async () => {
  const sentMessages = [];
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: {
      sendMessage: async (message) => {
        sentMessages.push(message);
      },
      openOptionsPage: () => {},
    },
    tabs: {
      query: (_query, callback) => callback([{ url: 'https://www.example.com/page' }]),
    },
  };

  const { getActionButtons, initActionButtons, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);
  initActionButtons(getActionButtons());

  await document.getElementById('bring-domain-to-current-window').click();
  await document.getElementById('bring-domain-to-current-window-no-subdomain').click();

  assert.deepEqual(sentMessages, [
    { action: 'bringDomainToCurrentWindow', domain: 'www.example.com' },
    { action: 'bringDomainToCurrentWindowNoSubdomain', domain: 'www.example.com' },
  ]);
});

test('Bring All captures the active tab and its window in the originating UI', async () => {
  globalThis.document = createFakeDocument();
  const sentMessages = [];
  globalThis.chrome = {
    runtime: { sendMessage: async (message) => sentMessages.push(message) },
    tabs: {
      query: (query, callback) => {
        assert.deepEqual(query, { active: true, currentWindow: true });
        callback([{ id: 42, windowId: 7, active: true }]);
      },
    },
  };
  const { getActionButtons, initActionButtons, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);
  initActionButtons(getActionButtons());

  await document.getElementById('bring-to-window').click();

  assert.deepEqual(sentMessages, [{ action: 'bringToWindow', windowId: 7, activeTabId: 42 }]);
});

test('renders clear new-window labels and tooltips for Move Tabs actions', async () => {
  globalThis.document = createFakeDocument();

  const { renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);

  assert.deepEqual(
    [
      'move-domain-current-window',
      'move-domain-all-windows',
      'move-domain-current-window-no-subdomain',
      'move-domain-all-windows-no-subdomain',
      'move-ungrouped-current-window',
      'move-active-tab-to-new-window',
      'bring-domain-to-current-window',
      'bring-domain-to-current-window-no-subdomain',
      'bring-to-window',
    ].map((id) => {
      const button = document.getElementById(id);
      return { text: button.textContent, title: button.title };
    }),
    [
      {
        text: 'Move Domain to New Window (Current Window)',
        title: "Move every tab from the active tab's domain in this window to a new window",
      },
      {
        text: 'Move Domain to New Window (All Windows)',
        title: "Move every tab from the active tab's domain in all windows to a new window",
      },
      {
        text: 'Move Base Domain to New Window (Current Window)',
        title: "Move every tab from the active tab's base domain in this window to a new window",
      },
      {
        text: 'Move Base Domain to New Window (All Windows)',
        title: "Move every tab from the active tab's base domain in all windows to a new window",
      },
      {
        text: 'Move Ungrouped to New Window',
        title: 'Move every ungrouped tab in this window to a new window',
      },
      {
        text: 'Move Active Tab to New Window',
        title: 'Move only the active tab in this window to a new window',
      },
      {
        text: 'Bring Domain to This Window',
        title: "Bring tabs from the active tab's domain in other windows into this window",
      },
      {
        text: 'Bring Base Domain to This Window',
        title: "Bring tabs from the active tab's base domain in other windows into this window",
      },
      {
        text: 'Bring All to This Window',
        title: 'Move every tab from other windows into this window',
      },
    ]
  );
});

test('renders Most Used actions without repeating them in their original group', async () => {
  const sentMessages = [];
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: {
      sendMessage: async (message) => {
        sentMessages.push(message);
      },
      openOptionsPage: () => {},
    },
    tabs: { query: () => {} },
  };

  const { getActionButtons, initActionButtons, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container, { mostUsedActions: ['removeDuplicates'] });
  initActionButtons(getActionButtons());

  assert.equal(container.children[0].children[0].textContent, 'Most Used');
  assert.ok(document.getElementById('most-used-remove-duplicates'));
  assert.equal(document.getElementById('remove-duplicates'), null);
  assert.ok(document.getElementById('sort-by-domain'));

  const groupTitles = container.children.map((group) => group.children[0].textContent);
  assert.ok(!groupTitles.includes('Clean Up'));

  await document.getElementById('most-used-remove-duplicates').click();

  assert.deepEqual(sentMessages, [{ action: 'removeDuplicates' }]);
});

test('renderConfiguredActionGroups prepends Most Used when usage sorting is enabled', async () => {
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    storage: {
      sync: { get: async (defaults) => ({ ...defaults }) },
      local: {
        get: async (defaults) => ({
          ...defaults,
          usageSortEnabled: true,
          usageStats: {
            removeDuplicates: { count: 12 },
            sortByDomain: { count: 6 },
          },
        }),
      },
    },
  };

  const { renderConfiguredActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  await renderConfiguredActionGroups(container);

  assert.equal(container.children[0].children[0].textContent, 'Most Used');
  assert.ok(document.getElementById('most-used-remove-duplicates'));
  assert.ok(document.getElementById('most-used-sort-by-domain'));
});

test('pins and unpins actions persistently and show Most Used while usage sorting is off', async () => {
  globalThis.document = createFakeDocument();
  const localState = {
    usageStats: {},
    usageSortEnabled: false,
    pinnedActions: [],
  };
  globalThis.chrome = {
    storage: {
      sync: { get: async (defaults) => ({ ...defaults }) },
      local: {
        get: async (defaults) => ({ ...defaults, ...localState }),
        set: async (updates) => Object.assign(localState, updates),
      },
      onChanged: { addListener: () => {} },
    },
  };

  const { renderConfiguredActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  await renderConfiguredActionGroups(container);

  const pinButton = document.getElementById('pin-sort-by-domain');
  assert.equal(pinButton.attributes['aria-pressed'], 'false');
  assert.equal(pinButton.attributes['aria-label'], 'Pin Sort by Domain to Most Used');
  await pinButton.click();

  assert.deepEqual(localState.pinnedActions, ['sortByDomain']);
  assert.equal(container.children[0].children[0].textContent, 'Most Used');
  const renderedActionKeys = container.children.flatMap((group) =>
    group.children.slice(1).map((row) => row.children[0].dataset.actionKey)
  );
  assert.equal(renderedActionKeys.filter((actionKey) => actionKey === 'sortByDomain').length, 1);
  assert.equal(
    document.getElementById('most-used-pin-sort-by-domain').attributes['aria-pressed'],
    'true'
  );

  const reopenedContainer = document.createElement('div');
  await renderConfiguredActionGroups(reopenedContainer);
  assert.equal(
    document.getElementById('most-used-pin-sort-by-domain').attributes['aria-pressed'],
    'true'
  );
  await document.getElementById('most-used-pin-sort-by-domain').click();
  assert.deepEqual(localState.pinnedActions, []);
  assert.equal(reopenedContainer.children[0].children[0].textContent, 'Sort & Group');
});

test('an unpinned action stays in Most Used when usage sorting is enabled and it ranks in the top six', async () => {
  globalThis.document = createFakeDocument();
  const localState = {
    usageStats: { sortByDomain: { count: 12 } },
    usageSortEnabled: true,
    pinnedActions: [],
  };
  globalThis.chrome = {
    storage: {
      sync: { get: async (defaults) => ({ ...defaults }) },
      local: {
        get: async (defaults) => ({ ...defaults, ...localState }),
        set: async (updates) => Object.assign(localState, updates),
      },
      onChanged: { addListener: () => {} },
    },
  };

  const { renderConfiguredActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  await renderConfiguredActionGroups(container);
  await document.getElementById('most-used-pin-sort-by-domain').click();
  await document.getElementById('most-used-pin-sort-by-domain').click();

  assert.deepEqual(localState.pinnedActions, []);
  assert.ok(document.getElementById('most-used-sort-by-domain'));
  assert.equal(
    document.getElementById('most-used-pin-sort-by-domain').attributes['aria-pressed'],
    'false'
  );
});

for (const mode of ['text', 'icons']) {
  test(`preserves affected-tab counts after pinning, unpinning, and storage rerenders in ${mode} mode`, async () => {
    globalThis.document = createFakeDocument();
    const storageListeners = [];
    const tabListeners = [];
    const windowFocusListeners = [];
    const localState = { pinnedActions: [] };
    let counts = { sortByDomain: 3, groupByDomain: 2 };
    globalThis.chrome = {
      runtime: {
        sendMessage: async (message) => {
          assert.equal(message.action, 'getAffectedTabCounts');
          return { counts };
        },
      },
      tabs: Object.fromEntries(
        ['onActivated', 'onCreated', 'onRemoved', 'onUpdated', 'onMoved'].map((name) => [
          name,
          { addListener: (listener) => tabListeners.push(listener) },
        ])
      ),
      windows: { onFocusChanged: { addListener: (listener) => windowFocusListeners.push(listener) } },
      storage: {
        sync: { get: async (defaults) => ({ ...defaults, operationsUiMode: mode }) },
        local: {
          get: async (defaults) => ({ ...defaults, ...localState }),
          set: async (updates) => Object.assign(localState, updates),
        },
        onChanged: { addListener: (listener) => storageListeners.push(listener) },
      },
    };

    const { initAffectedTabCounts, renderConfiguredActionGroups } = await import('../panel-actions.js');
    const refreshCounts = await initAffectedTabCounts();
    const container = document.createElement('div');
    await renderConfiguredActionGroups(container, refreshCounts);

    const assertCounts = () => {
      const rows = mode === 'icons'
        ? container.children.slice(1).flatMap((panel) => panel.children)
        : container.children.flatMap((group) => group.children.slice(1));
      for (const row of rows) {
        const button = row.children[0];
        if (!button?.dataset.actionKey) continue;
        const count = counts[button.dataset.actionKey] || 0;
        assert.match(button.attributes['aria-label'], new RegExp(`affects ${count} tabs$`));
        if (mode === 'icons') {
          assert.equal(button.actionCountElement.textContent, count ? String(count) : '');
          assert.equal(button.actionCountElement.hidden, count === 0);
        } else if (count) {
          assert.ok(button.textContent.endsWith(` · ${count}`));
        } else {
          assert.ok(!button.textContent.includes(' · '));
        }
      }
    };

    assertCounts();
    counts = { sortByDomain: 4, groupByDomain: 1 };
    for (const listener of windowFocusListeners) await listener(2);
    assertCounts();
    await document.getElementById('pin-sort-by-domain').click();
    assertCounts();
    await document.getElementById('most-used-pin-sort-by-domain').click();
    assertCounts();

    localState.usageStats = { groupByDomain: { count: 10 } };
    for (const listener of storageListeners) {
      await listener({ usageStats: { newValue: localState.usageStats } }, 'local');
    }
    assertCounts();
    assert.equal(tabListeners.length, 5);
    assert.equal(storageListeners.length, 2);

    counts = { sortByDomain: 1 };
    await tabListeners[0]();
    assertCounts();
  });
}

test('renders the Icons view with Most Used first and keeps actions in their category panels', async () => {
  globalThis.document = createFakeDocument();

  const { renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container, { mode: 'icons', mostUsedActions: ['removeDuplicates'] });

  const tablist = container.children[0];
  assert.equal(tablist.attributes.role, 'tablist');
  assert.equal(tablist.children[0].dataset.tabId, 'most-used');
  assert.equal(tablist.children[0].attributes['aria-selected'], 'true');
  assert.ok(document.getElementById('most-used-remove-duplicates'));
  assert.ok(document.getElementById('remove-duplicates'));
  assert.ok(document.getElementById('most-used-pin-remove-duplicates'));
  assert.ok(document.getElementById('pin-remove-duplicates'));
  assert.equal(
    document.getElementById('most-used-remove-duplicates').children[0].src,
    'assets/icons/48/remove-duplicates.png'
  );
});

test('renders an empty Most Used state with a direct mode switch to Text', async () => {
  globalThis.document = createFakeDocument();
  const storedSettings = [];
  globalThis.chrome = {
    storage: {
      sync: {
        set: (settings, callback) => {
          storedSettings.push(settings);
          callback();
        },
      },
    },
  };

  const { renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container, { mode: 'icons' });
  const mostUsedPanel = document.getElementById('actions-panel-most-used');
  await mostUsedPanel.children[1].click();

  assert.deepEqual(storedSettings, [{ operationsUiMode: 'text' }]);
  assert.equal(container.className, 'actions-grid');
  assert.ok(document.getElementById('sort-by-domain'));
});

test('supports automatic arrow-key navigation between action tabs', async () => {
  globalThis.document = createFakeDocument();
  const { renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container, { mode: 'icons' });

  const [mostUsedTab, sortGroupTab] = container.children[0].children;
  let prevented = false;
  mostUsedTab.listeners.keydown({
    key: 'ArrowRight',
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(mostUsedTab.attributes['aria-selected'], 'false');
  assert.equal(sortGroupTab.attributes['aria-selected'], 'true');
  assert.equal(document.getElementById('actions-panel-most-used').hidden, true);
  assert.equal(document.getElementById('actions-panel-sort-group').hidden, false);
});

test('rebinds icon action buttons after usage statistics refresh', async () => {
  const sentMessages = [];
  let onChangedListener;
  let usageStats = { sortByDomain: { count: 2 } };
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: { sendMessage: async (message) => sentMessages.push(message) },
    storage: {
      sync: { get: async (defaults) => ({ ...defaults, operationsUiMode: 'icons' }) },
      local: {
        get: async (defaults) => ({ ...defaults, usageStats }),
      },
      onChanged: { addListener: (listener) => (onChangedListener = listener) },
    },
    tabs: { query: () => {} },
  };

  const { getActionButtons, initActionButtons, renderConfiguredActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  await renderConfiguredActionGroups(container, () => initActionButtons(getActionButtons()));
  usageStats = { removeDuplicates: { count: 3 } };
  await onChangedListener({ usageStats: { newValue: usageStats } }, 'local');
  await document.getElementById('most-used-remove-duplicates').click();

  assert.deepEqual(sentMessages, [{ action: 'removeDuplicates' }]);
});

test('renders affected-tab counts on action buttons', async () => {
  globalThis.document = createFakeDocument();
  globalThis.chrome = {
    runtime: {
      sendMessage: async () => ({ counts: { sortByDomain: 3 } }),
    },
    tabs: {},
    storage: { onChanged: { addListener: () => {} } },
  };

  const { getActionButtons, initAffectedTabCounts, renderActionGroups } = await import('../panel-actions.js');
  const container = document.createElement('div');
  renderActionGroups(container);
  getActionButtons();
  await initAffectedTabCounts();

  assert.equal(document.getElementById('sort-by-domain').textContent, 'Sort by Domain · 3');
  assert.equal(document.getElementById('group-by-domain').textContent, 'Group by Domain');
  assert.equal(
    document.getElementById('sort-by-domain').attributes['aria-label'],
    'Sort by Domain, affects 3 tabs'
  );
});
