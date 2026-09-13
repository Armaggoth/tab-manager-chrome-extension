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
    this.textContent = '';
    this.className = '';
    this.title = '';
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

  replaceChildren(...children) {
    this.children = children;
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  async click() {
    await this.listeners.click?.();
  }
}

function createFakeDocument() {
  const fakeDocument = {
    elements: new Map(),
    createElement(tagName) {
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
