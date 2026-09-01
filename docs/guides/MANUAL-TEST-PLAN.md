# Manual Test Plan

This plan validates each side-panel operation against the settings that affect it. Run the tests in a disposable Chrome profile or with tabs that can be safely moved, grouped, and closed.

## Automated Tests

Run the unit tests from the repository root with:

```text
npm test
```

The current suite covers **Sort by Domain**, **Group by Domain**, and **Remove Duplicates** (including Google Docs ID duplicate detection, exact URL duplicate removal, and pinned/grouped protections) through the service-worker message path. Add unit tests for each subsequent feature before or alongside its manual validation.

## Current Validation Status

The following features have passed manual Chrome validation:

- Sort by Domain with Ignore Pinned Tabs checked and unchecked
- Group by Domain, including repeated-click idempotency
- Group by Domain (No Subdomain)
- Ungroup
- Google editor type grouping/sorting for Docs, Sheets, Slides, and Forms

Remaining browser validation includes Remove Duplicates, the move and close operations, Find Media Playing, and Google Vids/Drawings coverage.

## Test Fixture

For move-window testing, you can open a disposable Chrome profile with the extension loaded and two prepared windows:

```text
npm run test:chrome:move -- --reset
```

The script uses `.chrome-test-profile/`, which is ignored by Git. Omit `--reset` to reuse the same disposable profile.

Create these tabs in **Window A**, in a deliberately mixed order:

- `https://www.amazon.com/`
- `https://aistudio.google.com/`
- `https://gemini.google.com/`
- `chrome://extensions/`
- `https://notebooklm.google.com/`
- `https://www.google.com/`
- `https://www.duolingo.com/`
- `https://www.instagram.com/`
- `https://docs.google.com/document/d/DOC_ID/edit`
- `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
- `https://docs.google.com/presentation/d/SLIDE_ID/edit`
- `https://docs.google.com/forms/d/FORM_ID/edit`

Also create **Window B** with at least one tab from a domain present in Window A and one unrelated tab. Use a pinned tab and a grouped tab when a test calls for them.

Record the starting tab order and window membership before each test. Reset the fixture between destructive tests.

## Settings Matrix

Run the relevant tests with these settings combinations:

| Profile | Ignore pinned | Ignore grouped | Detect duplicate Google Docs | Purpose |
|---|---:|---:|---:|---|
| A | Off | Off | Off | Baseline behavior |
| B | On | Off | Off | Pinned-tab filtering |
| C | Off | On | Off | Grouped-tab filtering |
| D | On | On | Off | Combined filtering |
| E | Off | Off | On | Google Docs duplicate behavior |

`Detect duplicate Google Docs` affects **Remove Duplicates** only. The pinned and grouped settings affect operations that use the shared tab filter. Language can be checked once as a UI smoke test, but it does not change operation behavior in the current implementation.

## Common Questions

For every case, answer:

1. Did the expected button appear? **Yes/No**
2. Did clicking it produce an error, unexpected prompt, or no response? **Yes/No**
3. Did only the intended tabs, groups, or windows change? **Yes/No**
4. Did the operation preserve tabs excluded by the active settings? **Yes/No/Not applicable**
5. What was unexpected? **Open answer, optional**

## Sorting Debug View

Use the **Sorting Debug** section above the action buttons when investigating sort behavior.

1. Arrange a mixed set of regular, empty, and special tabs in the current window.
2. Include at least one pinned tab.
3. Click **Scramble Tabs** to create a fresh random order.
4. Click **Read Current Domains** and capture the list as the before state.
5. Click **Sort by Domain**.
6. Capture the refreshed list as the after state.
7. Click **Copy Tab List** and paste the result into the bug report.

Use **Read All Windows** when validating move-window behavior. It lists tabs from every browser window and includes each tab's `Window ID`, making before/after window membership easier to compare.

Expected:

- Every current-window tab appears in both lists, including empty and special tabs.
- **Scramble Tabs** randomizes pinned and unpinned tabs independently, while keeping pinned tabs in Chrome's pinned region.
- Each row includes its position, extracted domain or a no-domain label, the URL, `Pinned: Yes` or `Pinned: No`, `Grouped: Yes` or `Grouped: No`, the group ID (or `Group ID: None` when ungrouped), and the group name (or `Group Name: None` when ungrouped).
- **Read All Windows** rows also include the browser `Window ID` for each tab.
- The after state reflects the actual browser tab order after sorting.
- The debug view does not apply the pinned/grouped filtering settings.

Questions:

1. Did **Read Current Domains** show every current-window tab? **Yes/No**
2. Did the list include empty and special tabs? **Yes/No**
3. Did every row include the correct pinned flag? **Yes/No**
4. Did every row include the correct grouped flag, group ID, and group name? **Yes/No**
5. Did the list refresh after clicking **Sort by Domain**? **Yes/No**
6. Did **Read All Windows** show tabs from every browser window with the correct Window ID? **Yes/No/Not tested**
7. Did **Copy Tab List** copy the complete visible list, including URLs, pinned flags, group IDs, group names, and Window IDs when visible? **Yes/No**

## Test Cases

### 1. Sort by Domain

Run with Profiles A-D. In Window A, click **Sort by Domain**. Profile B/D must be repeated after Profile A so both unchecked and checked pinned-tab behavior are tested. Existing grouped tabs must be protected in every profile.

Expected:

- Sortable tabs in the current window are ordered by hostname.
- A leading `www.` is ignored for sorting.
- For domains without `www.`, the first domain part is used as the primary sort key. For example, `aistudio.google.com` sorts by `aistudio`.
- `chrome:` is treated as a protocol, so `chrome://newtab/` sorts by `newtab` and `chrome://extensions/` sorts by `extensions`.
- All `chrome-extension://` tabs share the `chrome-extension` sort key and remain together.
- Other windows are unchanged.
- With Ignore Pinned Tabs off, pinned tabs are sorted within the pinned region.
- Pinned tabs are unchanged when Profile B or D is active.
- Already-grouped tabs are unchanged in every profile; grouped-tab protection is always enabled.
- Special URLs such as `chrome://extensions/` are included and sorted using their available domain/URL label.

Additional questions:

1. Did the first click produce the same stable order when repeated? **Yes/No**
2. Did `chrome://extensions/` stay in a stable sorted position when the sort was repeated? **Yes/No/Not tested**
3. Did the result match the intended hostname ordering for all normal web tabs? **Yes/No**

Known issue from the first manual run: repeated clicks moved `chrome://extensions/` upward until it sat beside the `chrome-extension` tab, and the observed order was not the expected hostname order. Treat this as a defect to investigate, not a passing result.

### 2. Group by Domain

Reset the fixture with at least two existing groups. Run with Profiles A-D. In Window A, click **Group by Domain** twice.

Expected:

- Tabs with the same full hostname are placed in the same Chrome tab group.
- Google editor tabs are the special case: Docs, Sheets, Slides, Forms, Vids, and Drawings are grouped by editor type rather than all sharing one `docs.google.com` group.
- Unknown Google editor paths use a separate dynamic group key based on their first path segment.
- Different subdomains, such as `aistudio.google.com` and `gemini.google.com`, remain separate groups.
- Other windows are unchanged.
- Existing grouped tabs remain unchanged in every profile.
- Only ungrouped eligible tabs are grouped.
- Ungrouped tabs matching an existing group title are placed in a separate new group; existing groups are never merged.
- The second click produces no additional groups or tab movement.

Questions:

1. Was one group created per full hostname? **Yes/No**
2. Were different subdomains kept separate? **Yes/No**
3. Were excluded tabs left outside newly created groups? **Yes/No/Not applicable**
4. Did the second click leave the groups unchanged? **Yes/No**

### 3. Group by Domain (No Subdomain)

Reset the fixture with at least two existing groups. Run with Profiles A-D. In Window A, click **Group by Domain (No Subdomain)** twice.

Expected:

- Tabs are grouped by the base domain where supported.
- All recognized Google editor types are collapsed into one `google.com` group.
- `aistudio.google.com`, `gemini.google.com`, `notebooklm.google.com`, and `www.google.com` are grouped under `google.com`.
- Existing grouped tabs remain unchanged in every profile.
- Only ungrouped eligible tabs are grouped.
- The second click produces no additional groups or tab movement.

Questions:

1. Were subdomains of the same base domain grouped together? **Yes/No**
2. Were unrelated base domains kept separate? **Yes/No**
3. Did any excluded tab get moved into a new group? **Yes/No**
4. Did the second click leave the groups unchanged? **Yes/No**

### 4. Group Google Docs by Type

Reset the fixture. Run with Profiles A-D. In Window A, click **Group Google Docs by Type**.

Expected:

- Docs tabs are grouped as **Google Docs**.
- Sheets tabs are grouped as **Google Sheets**.
- Slides tabs are grouped as **Google Slides**.
- Forms tabs are grouped as **Google Forms**.
- Vids tabs are grouped as **Google Vids**.
- Drawings tabs are grouped as **Google Drawings** when their URL uses the drawings editor path.
- Non-Google tabs are not moved into these groups.
- Pinned and already-grouped tabs follow the active filtering settings.

Questions:

1. Did each recognized document type get its own group? **Yes/No**
2. Were non-Google tabs left untouched? **Yes/No**
3. Did the group titles identify Docs, Sheets, Slides, and Forms correctly? **Yes/No**
4. Did Vids and Drawings use the correct labels when present? **Yes/No/Not tested**

### Google Editor Type Sorting Rule

Google editor tabs use the shared type classifier and sort key. Within the `docs` sort group, the expected order is:

```text
Google Docs -> Google Sheets -> Google Slides -> Google Forms -> Google Vids -> Google Drawings
```

Unsupported `docs.google.com` editor paths are placed after recognized types and sorted alphabetically by their first path segment. For example, `new-editor` sorts before `whiteboards`. If no path segment is available, the full URL is the final fallback.

The same classifier, ordering, and labels must be used by **Group Google Docs by Type** so sorting and grouping remain consistent under the DRY principle.

### 5. Ungroup

Reset the fixture with several groups in Window A. Run with Profiles A-D and click **Ungroup**.

Expected:

- All grouped tabs in the current window are ungrouped.
- Tabs in other windows are unchanged.
- The pinned/grouped settings do not prevent ungrouping, because this operation intentionally removes groups.

Questions:

1. Were all groups in the current window removed? **Yes/No**
2. Were groups in other windows preserved? **Yes/No/Not tested**

### 6. Remove Duplicates

Create duplicate normal URLs in Window A and Window B. Run with Profiles A-D, then repeat with Profile E.

Expected with duplicate Google Docs detection **Off**:

- Exact duplicate URLs are reduced to one tab.
- Different Google Docs pages with the same document ID are treated as different URLs.

Expected with duplicate Google Docs detection **On**:

- Tabs for the same Google document ID are reduced to one, even when their paths or sheet/page locations differ.
- Different document IDs remain open.
- Pinned or grouped tabs are preserved when their ignore settings are enabled.

Questions:

1. Were exact duplicate URLs reduced to one? **Yes/No**
2. With detection On, were same-ID Docs, Sheets, Slides, or Forms tabs reduced to one? **Yes/No/Not tested**
3. With detection Off, did different URLs remain separate? **Yes/No/Not tested**
4. Were excluded pinned/grouped tabs preserved? **Yes/No/Not applicable**

### 7. Move Domain (Current Window)

Reset the fixture. In Window A, focus a tab whose domain appears more than once in Window A, then click **Move Domain (Current Window)**.

Expected:

- The active tab's domain is used automatically; no domain-selection prompt appears.
- Matching tabs from Window A move to one new window.
- For `docs.google.com`, only tabs matching the active Google editor type move. For example, an active Google Doc moves Google Docs tabs, not Sheets or Slides.
- Matching tabs in Window B remain in Window B.
- Grouped matching tabs move with the domain.
- Pinned matching tabs are not moved when Ignore Pinned Tabs is enabled.
- If the active tab has no usable domain, no destructive change occurs.

Questions:

1. Did the action run without a domain-selection prompt? **Yes/No**
2. Was the active tab's domain used as the target domain? **Yes/No**
3. Did only matching tabs from the current window move? **Yes/No**
4. For Google editor tabs, did only the active editor type move? **Yes/No/Not tested**
5. Were matching tabs in other windows left where they were? **Yes/No**
6. Did grouped matching tabs move with the domain? **Yes/No/Not tested**
7. Were ignored pinned matching tabs preserved? **Yes/No/Not applicable**
8. Did focusing a tab without a usable domain leave tabs unchanged? **Yes/No/Not tested**

### 8. Move Domain (All Windows)

Reset the fixture. In Window A, focus a tab whose domain appears in multiple windows, then click **Move Domain (All Windows)**.

Expected:

- The active tab's domain is used automatically; no domain-selection prompt appears.
- Matching tabs from all windows move to one new window.
- For `docs.google.com`, only tabs matching the active Google editor type move across windows. For example, active Sheets moves Sheets tabs, not Docs or Slides.
- Nonmatching tabs remain in their original windows.
- Grouped matching tabs move with the domain.
- Pinned matching tabs are not moved when Ignore Pinned Tabs is enabled.

Questions:

1. Did the action run without a domain-selection prompt? **Yes/No**
2. Was the active tab's domain used as the target domain? **Yes/No**
3. Were matching tabs collected from all windows? **Yes/No**
4. For Google editor tabs, did only the active editor type move? **Yes/No/Not tested**
5. Were nonmatching tabs left unchanged? **Yes/No**
6. Did grouped matching tabs move with the domain? **Yes/No/Not tested**
7. Were ignored pinned matching tabs preserved? **Yes/No/Not applicable**

### 9. Move Ungrouped to New Window

Reset the fixture with grouped and ungrouped tabs in Window A. Include at least one grouped tab, one regular ungrouped tab, one `chrome://` tab, and one pinned tab. Click **Move Ungrouped to New Window**.

Expected:

- Eligible ungrouped tabs from Window A move to one new window.
- Already-grouped tabs remain in Window A.
- Ungrouped `chrome://` tabs move like other ungrouped tabs.
- Pinned tabs remain in Window A when Ignore Pinned Tabs is enabled.
- Tabs in other windows are unchanged.

Questions:

1. Did eligible ungrouped tabs move to one new window? **Yes/No**
2. Were grouped tabs preserved in the original window? **Yes/No**
3. Did ungrouped `chrome://` tabs move with the other ungrouped tabs? **Yes/No/Not tested**
4. Were ignored pinned tabs preserved? **Yes/No/Not applicable**
5. Were tabs in other windows unchanged? **Yes/No/Not tested**

### 10. Bring All to This Window

Reset the fixture with tabs in Window A and Window B. Focus Window A and click **Bring All to This Window**.

Expected:

- Tabs from other windows move into the current window.
- Tabs already in the current window remain there.
- Grouped tabs from other windows move and preserve their group assignments.
- Pinned tabs from other windows move too, are handled separately from unpinned tabs, and are re-pinned in their original moved order regardless of the Ignore Pinned Tabs setting.
- The operation does not close tabs.

Questions:

1. Did tabs from other windows move into the focused window? **Yes/No**
2. Were all tabs preserved? **Yes/No**
3. Did grouped tabs move while preserving their group assignments? **Yes/No/Not tested**
4. Did pinned tabs move, stay pinned, and keep their moved-tab order regardless of the Ignore Pinned Tabs setting? **Yes/No/Not tested**

### 11. Close Domain (Current Window)

Reset the fixture. In Window A, focus a tab whose domain appears in Window A and Window B, then click **Close Domain (Current Window)**.

Expected:

- The active tab's domain is used automatically; no domain-selection prompt appears.
- A confirmation prompt appears naming the active tab's domain.
- Confirming closes matching tabs only in Window A.
- Canceling closes nothing.
- Matching tabs in Window B remain open.
- Grouped matching tabs close with the domain.
- Pinned matching tabs are preserved when Ignore Pinned Tabs is enabled.

Questions:

1. Did the action skip the domain-selection prompt? **Yes/No**
2. Did confirmation appear before closing and name the active tab's domain? **Yes/No**
3. Did confirming close only matching current-window tabs? **Yes/No**
4. Did grouped matching tabs close with the domain? **Yes/No/Not tested**
5. Were ignored pinned matching tabs preserved? **Yes/No/Not applicable**
6. Did canceling preserve all tabs? **Yes/No/Not tested**

### 12. Close Domain (All Windows)

Reset the fixture. In Window A, focus a tab whose domain appears in multiple windows, then click **Close Domain (All Windows)**.

Expected:

- The active tab's domain is used automatically; no domain-selection prompt appears.
- A confirmation prompt appears naming the active tab's domain.
- Confirming closes matching tabs in every window.
- Canceling closes nothing.
- Grouped matching tabs close with the domain.
- Pinned matching tabs are preserved when Ignore Pinned Tabs is enabled.

Questions:

1. Did the action skip the domain-selection prompt? **Yes/No**
2. Did confirmation appear before closing and name the active tab's domain? **Yes/No**
3. Were matching tabs closed across all windows? **Yes/No**
4. Did grouped matching tabs close with the domain? **Yes/No/Not tested**
5. Were ignored pinned matching tabs preserved? **Yes/No/Not applicable**
6. Did canceling preserve all tabs? **Yes/No/Not tested**

### 13. Settings and Side-Panel Smoke Test

Open Settings and test each setting at least once.

Questions:

1. Did the Settings button open the options page? **Yes/No**
2. Did changing Ignore Pinned Tabs persist after reopening Settings? **Yes/No**
3. Did changing Detect Duplicate Google Docs persist after reopening Settings? **Yes/No**
4. Did changing the language update the visible interface? **Yes/No/Not tested**
5. Did the side panel expand and shrink with Chrome's panel width? **Yes/No**
6. Did all controls remain keyboard accessible? **Yes/No**

## Test Results

Record failures with:

- Test case and settings profile
- Starting tab/window arrangement
- Expected behavior
- Actual behavior
- Whether the issue reproduces on a second attempt

After completing the matrix, update the broad checklist in [PROGRESS.md](PROGRESS.md) and record implementation defects separately from tests that passed.
