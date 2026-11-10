import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMostUsedActions,
  getSortedUsageEntries,
  getTotalUsageCount,
  getUsageAction,
  getUsageSuggestion,
  USAGE_SUGGESTION_DEFAULTS,
} from '../usage.js';

const now = 1_000_000;
const thresholds = {
  minTotalUses: 20,
  ratio: 1.5,
  minDelta: 10,
  cooldownMs: 14 * 24 * 60 * 60 * 1000,
};

test('getUsageAction separates group by domain no-subdomain usage', () => {
  assert.equal(getUsageAction({ action: 'groupByDomain', ignoreSubdomain: false }), 'groupByDomain');
  assert.equal(
    getUsageAction({ action: 'groupByDomain', ignoreSubdomain: true }),
    'groupByDomainNoSubdomain'
  );
  assert.equal(getUsageAction({ action: 'removeDuplicates' }), 'removeDuplicates');
});

test('getTotalUsageCount sums recorded feature counts', () => {
  assert.equal(
    getTotalUsageCount({
      sortByDomain: { count: 4 },
      removeDuplicates: { count: 6 },
    }),
    10
  );
});
test('getSortedUsageEntries sorts by count and falls back to display order', () => {
  assert.deepEqual(
    getSortedUsageEntries({
      removeDuplicates: { count: 3 },
      sortByDomain: { count: 3 },
      bringToWindow: { count: 8 },
    }).map(([action]) => action),
    ['bringToWindow', 'sortByDomain', 'removeDuplicates']
  );
});

test('getMostUsedActions returns top used actions with stable tie-breaking', () => {
  assert.deepEqual(
    getMostUsedActions(
      {
        removeDuplicates: { count: 4 },
        sortByDomain: { count: 4 },
        bringToWindow: { count: 8 },
        ungroup: { count: 0 },
      },
      2
    ),
    ['bringToWindow', 'sortByDomain']
  );
});

test('getMostUsedActions ignores zero-count, unknown, and missing actions', () => {
  assert.deepEqual(
    getMostUsedActions({
      unknownAction: { count: 100 },
      sortByDomain: { count: 0 },
      removeDuplicates: { count: 2 },
    }),
    ['removeDuplicates']
  );
});

test('getMostUsedActions puts usage-ranked pins first and fills to six without duplicates', () => {
  assert.deepEqual(
    getMostUsedActions(
      {
        sortByDomain: { count: 2 },
        removeDuplicates: { count: 10 },
        groupByDomain: { count: 8 },
        ungroup: { count: 6 },
        bringToWindow: { count: 4 },
        findMediaPlaying: { count: 2 },
        closeDomainAllWindows: { count: 1 },
      },
      6,
      ['sortByDomain', 'removeDuplicates']
    ),
    [
      'removeDuplicates',
      'sortByDomain',
      'groupByDomain',
      'ungroup',
      'bringToWindow',
      'findMediaPlaying',
    ]
  );
});

test('getMostUsedActions keeps every pin when pins exceed the automatic capacity', () => {
  assert.deepEqual(
    getMostUsedActions(
      { closeDomainAllWindows: { count: 7 }, sortByDomain: { count: 2 } },
      6,
      ['sortByDomain', 'ungroup', 'removeDuplicates', 'findMediaPlaying', 'closeDomainAllWindows', 'bringToWindow', 'groupByDomain']
    ),
    [
      'closeDomainAllWindows',
      'sortByDomain',
      'groupByDomain',
      'ungroup',
      'removeDuplicates',
      'bringToWindow',
      'findMediaPlaying',
    ]
  );
});

test('getUsageSuggestion waits until the minimum total usage threshold', () => {
  assert.equal(
    getUsageSuggestion(
      {
        sortByDomain: { count: 1 },
        removeDuplicates: { count: 18 },
      },
      USAGE_SUGGESTION_DEFAULTS,
      now,
      thresholds
    ),
    null
  );
});

test('getUsageSuggestion respects disabled suggestions and cooldown', () => {
  const usageStats = {
    sortByDomain: { count: 1 },
    removeDuplicates: { count: 25 },
  };

  assert.equal(
    getUsageSuggestion(usageStats, { usageSuggestionsEnabled: false }, now, thresholds),
    null
  );
  assert.equal(
    getUsageSuggestion(
      usageStats,
      { usageSuggestionsEnabled: true, usageSuggestionDismissedUntil: now + 1 },
      now,
      thresholds
    ),
    null
  );
});

test('getUsageSuggestion does not prompt after usage sorting is already enabled', () => {
  assert.equal(
    getUsageSuggestion(
      {
        sortByDomain: { count: 1 },
        ungroup: { count: 24 },
      },
      { ...USAGE_SUGGESTION_DEFAULTS, usageSortEnabled: true },
      now,
      thresholds
    ),
    null
  );
});

test('getUsageSuggestion triggers for the observed grouping-heavy usage pattern', () => {
  assert.deepEqual(
    getUsageSuggestion(
      {
        sortByDomain: { count: 0 },
        groupByDomain: { count: 17 },
        groupByDomainNoSubdomain: { count: 6 },
        groupGoogleDocsByType: { count: 0 },
        ungroup: { count: 24 },
        removeDuplicates: { count: 0 },
      },
      USAGE_SUGGESTION_DEFAULTS,
      now,
      thresholds
    ),
    {
      action: 'ungroup',
      label: 'Ungroup',
      count: 24,
      displacedAction: 'sortByDomain',
      displacedLabel: 'Sort by Domain',
    }
  );
});

test('getUsageSuggestion returns the most-used displaced action after thresholds are met', () => {
  assert.deepEqual(
    getUsageSuggestion(
      {
        sortByDomain: { count: 1 },
        groupByDomain: { count: 2 },
        removeDuplicates: { count: 25 },
      },
      USAGE_SUGGESTION_DEFAULTS,
      now,
      thresholds
    ),
    {
      action: 'removeDuplicates',
      label: 'Remove Duplicates',
      count: 25,
      displacedAction: 'sortByDomain',
      displacedLabel: 'Sort by Domain',
    }
  );
});
