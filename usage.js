import { ACTION_GROUPS, ACTION_LABELS } from './utils.js';

export const ACTION_DISPLAY_ORDER = ACTION_GROUPS.flatMap((group) =>
  group.actions.map((action) => action.key)
);

export const USAGE_SUGGESTION_DEFAULTS = {
  usageSuggestionsEnabled: true,
  usageSuggestionDismissedUntil: 0,
  usageSortEnabled: false,
};

export const USAGE_SUGGESTION_THRESHOLDS = {
  minTotalUses: 20,
  ratio: 1.5,
  minDelta: 10,
  cooldownMs: 14 * 24 * 60 * 60 * 1000,
};

export function getUsageAction(request) {
  if (request.action === 'groupByDomain' && request.ignoreSubdomain) {
    return 'groupByDomainNoSubdomain';
  }

  return request.action;
}

export function getTotalUsageCount(usageStats = {}) {
  return Object.values(usageStats).reduce((total, stat) => total + (stat?.count || 0), 0);
}

export function getSortedUsageEntries(usageStats = {}) {
  return Object.entries(usageStats)
    .filter(([action]) => ACTION_LABELS[action])
    .sort(([actionA, statA], [actionB, statB]) => {
      const countDelta = (statB?.count || 0) - (statA?.count || 0);
      if (countDelta !== 0) return countDelta;
      return ACTION_DISPLAY_ORDER.indexOf(actionA) - ACTION_DISPLAY_ORDER.indexOf(actionB);
    });
}

export function getMostUsedActions(usageStats = {}, limit = 6, pinnedActions = []) {
  const pinned = [...new Set(pinnedActions)].filter((action) => ACTION_LABELS[action]);
  const pinnedSet = new Set(pinned);
  const rankedPins = pinned.sort((actionA, actionB) => {
    const countDelta = (usageStats[actionB]?.count || 0) - (usageStats[actionA]?.count || 0);
    if (countDelta !== 0) return countDelta;
    return ACTION_DISPLAY_ORDER.indexOf(actionA) - ACTION_DISPLAY_ORDER.indexOf(actionB);
  });
  const automaticActions = getSortedUsageEntries(usageStats)
    .filter(([, stat]) => (stat?.count || 0) > 0)
    .filter(([action]) => !pinnedSet.has(action))
    .slice(0, Math.max(0, limit - rankedPins.length))
    .map(([action]) => action);

  return [...rankedPins, ...automaticActions];
}

export function getUsageSuggestion(
  usageStats = {},
  preferences = {},
  now = Date.now(),
  thresholds = USAGE_SUGGESTION_THRESHOLDS
) {
  const usageSuggestionsEnabled =
    preferences.usageSuggestionsEnabled ?? USAGE_SUGGESTION_DEFAULTS.usageSuggestionsEnabled;
  const dismissedUntil =
    preferences.usageSuggestionDismissedUntil ?? USAGE_SUGGESTION_DEFAULTS.usageSuggestionDismissedUntil;

  if (preferences.usageSortEnabled) return null;
  if (!usageSuggestionsEnabled || dismissedUntil > now) return null;
  if (getTotalUsageCount(usageStats) < thresholds.minTotalUses) return null;

  for (const [candidateAction, candidateStat] of getSortedUsageEntries(usageStats)) {
    const candidateIndex = ACTION_DISPLAY_ORDER.indexOf(candidateAction);
    if (candidateIndex <= 0) continue;

    const higherActions = ACTION_DISPLAY_ORDER.slice(0, candidateIndex);
    const displacedAction = higherActions.find((action) => {
      const displacedCount = usageStats[action]?.count || 0;
      const candidateCount = candidateStat?.count || 0;
      return (
        candidateCount - displacedCount >= thresholds.minDelta ||
        candidateCount >= Math.max(1, displacedCount) * thresholds.ratio
      );
    });

    if (displacedAction) {
      return {
        action: candidateAction,
        label: ACTION_LABELS[candidateAction],
        count: candidateStat.count,
        displacedAction,
        displacedLabel: ACTION_LABELS[displacedAction],
      };
    }
  }

  return null;
}
