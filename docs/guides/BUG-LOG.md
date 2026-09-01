# Bug Log

This log records defects found while validating the implemented tab-management operations. A bug stays open until the implementation is changed and the same reproduction test passes.

## Bug 1: Sort Moves Excluded Tabs When Repeated

- **Status**: Closed
- **Feature**: Sort by Domain
- **Settings**: Baseline profile; no pinned or grouped-tab exclusions enabled
- **Reproduction**:
  1. Open normal web tabs in a mixed order.
  2. Place a `chrome://extensions/` tab between normal web tabs.
  3. Click **Sort by Domain** twice.
- **Expected**: All non-pinned/non-grouped tabs in the current window, including special URLs, are sorted consistently by their available domain/URL label. Repeated clicks should not change the result.
- **Actual**: The special tab is moved into the sortable range. A second click moves it again, so the result changes between clicks and normal web tabs are not reliably ordered.
- **Evidence**: A focused mock Chrome API test reproduced different tab orders after the first and second sort.
- **Likely cause**: The handler excluded special URLs from the sortable list, then calculated one contiguous insertion range despite special tabs being interleaved among normal tabs.
- **Fix**: Include special URLs in the sortable list, normalize sort keys by removing `www.` and using the first domain part, and group all `chrome-extension://` tabs under one key. Capture the eligible order before sorting, skip browser moves when the order is unchanged, batch fully eligible tabs, and use position-aware moves when pinned or grouped tabs are excluded.

### Retest

- **Regression test**: Passed in Chrome with the 32-tab fixture. All tabs remained present, pinned tabs sorted within the pinned region, and unpinned tabs sorted by normalized first-part keys.
- **Pinned/grouped unit profile**: Passed for eligible-tab ordering and preservation of excluded tab identities. Exact browser positions remain a manual check because the test double does not model Chrome's pinned-tab constraints.
- **Manual result**: Passed. The unpinned order correctly placed `newtab` before `notebook.google.com`, and repeated sorting did not produce a reported change.
- **Status rationale**: The focused unit regression and both full manual reproductions pass, with Ignore Pinned Tabs unchecked and checked.

## Retest Results

Record the date, test setup, and result here after each fix. Do not mark a bug closed until its original reproduction passes and the relevant settings variants have been checked.

## Bug 2: Pinned Tabs Rearranged When Ignored

- **Status**: Closed
- **Feature**: Sort by Domain
- **Settings**: Ignore Pinned Tabs checked
- **Reproduction**:
  1. Arrange five pinned tabs in a known order.
  2. Arrange mixed unpinned tabs in the same window.
  3. Click **Sort by Domain** with Ignore Pinned Tabs enabled.
- **Expected**: The pinned tabs retain their exact existing order. Only eligible unpinned tabs are sorted.
- **Actual**: Previously, the pinned tabs changed from `notebook, amazon, docs, mail, docs` to `docs, amazon, mail, docs, notebook`.
- **Passing behavior**: In the latest 55-tab retest, the pinned tabs retained the exact order `notebook, mail, docs, amazon, docs`. All tabs remained present, and the unpinned tabs were sorted correctly using the normalized domain rules. The result correctly ordered the groups `aistudio`, `amazon`, `camelcamelcamel`, `cawallpaper`, `chrome-extension`, `docs`, `duolingo`, `extensions`, `gemini`, `google`, `instagram`, `learn`, `newtab`, and `notebook`.
- **Likely cause**: The physical reorder path uses positions derived from the full tab list, allowing unpinned-tab moves to affect pinned-tab ordering even though pinned tabs are excluded from the sortable set.
- **Retest result**: Passed with Ignore Pinned Tabs checked. Only unpinned tabs were rearranged.
- **Status rationale**: The pinned-tab order and unpinned sorting both match the expected behavior in the repeated 55-tab manual fixture.

## Successful Validation: Google Editor Type Sorting

- **Feature**: Sort by Domain with Google editor type ordering
- **Fixture**: 54 tabs, including Google Docs, Sheets, Slides, and Forms
- **Settings**: Ignore Pinned Tabs checked
- **Result**: Passed. All 54 tabs remained present, the five pinned tabs retained their original order, and unpinned Google editor tabs were ordered by type: Docs, Sheets, Slides, then Forms.
- **Additional result**: Non-Google tabs remained ordered by their normalized domain keys, including `chrome-extension`, `newtab`, and `notebook`.
- **Remaining coverage**: Google Vids and Google Drawings still need a manual Chrome fixture because they were not present in this run.

## Successful Validation: Group by Domain Repeated Run

- **Feature**: Group by Domain
- **Run**: Second click after the initial grouping run
- **Result**: Passed for idempotency. The existing group IDs remained stable, including the groups for Gemini, Docs, AI Studio, cawallpaper, Google, Duolingo, Microsoft Learn, camelcamelcamel, NotebookLM, Amazon, and Instagram.
- **Latest fixture result**: Passed again with 48 tabs. The five pinned tabs remained ungrouped, all existing group IDs remained unchanged, and no new groups were created.
- **Special tabs**: `chrome://extensions/` and `chrome://newtab/` remained ungrouped.
- **Design clarification**: The first grouping run creates separate groups for ungrouped tabs even when a matching group already exists. This is intentional; normal grouping does not merge existing user groups.

## Successful Validation: Ungroup

- **Feature**: Ungroup
- **Fixture**: 36 tabs with grouped and ungrouped tabs
- **Result**: Passed. Grouped tabs were ungrouped, all rows reported `Group ID: None` and `Group Name: None`, special tabs remained present, and the tab count was unchanged.
- **Pinned tabs**: The six pinned tabs remained present and retained their pinned status.

## Successful Validation: Remove Duplicates

- **Feature**: Remove Duplicates
- **Fixture**: 36 tabs (6 pinned, 30 unpinned) with multiple exact URL duplicate sets (cawallpaper, aistudio, notebook, duolingo, microsoft)
- **Settings**: Ignore Pinned Tabs checked, Detect Duplicate Google Docs checked
- **Result**: Passed. Exactly 9 duplicate tabs were closed (reducing total tabs from 36 to 27). First instances were kept. Pinned tabs (1–6) were completely protected. URLs with different query params (e.g. Amazon cart URLs) were kept separate as expected.
