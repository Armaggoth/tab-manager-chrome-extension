# Manual Test Plan

This plan validates each side-panel operation against the settings that affect it. Run the tests in a disposable Chrome profile or with tabs that can be safely moved, grouped, and closed.

## Test Fixture

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

## Test Cases

### 1. Sort by Domain

Run with Profiles A-D. In Window A, click **Sort by Domain**.

Expected:

- Sortable tabs in the current window are ordered by hostname.
- Other windows are unchanged.
- Pinned tabs are unchanged when Profile B or D is active.
- Already-grouped tabs are unchanged when Profile C or D is active.
- Special URLs such as `chrome://extensions/` are not sorted by the operation.

Additional questions:

1. Did the first click produce the same stable order when repeated? **Yes/No**
2. Did `chrome://extensions/` stay in a stable position instead of moving on repeated clicks? **Yes/No/Not tested**
3. Did the result match the intended hostname ordering for all normal web tabs? **Yes/No**

Known issue from the first manual run: repeated clicks moved `chrome://extensions/` upward until it sat beside the `chrome-extension` tab, and the observed order was not the expected hostname order. Treat this as a defect to investigate, not a passing result.

### 2. Group by Domain

Reset the fixture. Run with Profiles A-D. In Window A, click **Group by Domain**.

Expected:

- Tabs with the same full hostname are placed in the same Chrome tab group.
- Different subdomains, such as `aistudio.google.com` and `gemini.google.com`, remain separate groups.
- Other windows are unchanged.
- Excluded pinned or already-grouped tabs remain unchanged for Profiles B-D.

Questions:

1. Was one group created per full hostname? **Yes/No**
2. Were different subdomains kept separate? **Yes/No**
3. Were excluded tabs left outside newly created groups? **Yes/No/Not applicable**

### 3. Group by Domain (No Subdomain)

Reset the fixture. Run with Profiles A-D. In Window A, click **Group by Domain (No Subdomain)**.

Expected:

- Tabs are grouped by the base domain where supported.
- `aistudio.google.com`, `gemini.google.com`, `notebooklm.google.com`, and `www.google.com` are grouped under `google.com`.
- Excluded pinned or already-grouped tabs remain unchanged for Profiles B-D.

Questions:

1. Were subdomains of the same base domain grouped together? **Yes/No**
2. Were unrelated base domains kept separate? **Yes/No**
3. Did any excluded tab get moved into a new group? **Yes/No**

### 4. Group Google Docs by Type

Reset the fixture. Run with Profiles A-D. In Window A, click **Group Google Docs by Type**.

Expected:

- Docs tabs are grouped as **Google Docs**.
- Sheets tabs are grouped as **Google Sheets**.
- Slides tabs are grouped as **Google Slides**.
- Forms tabs are grouped as **Google Forms**.
- Non-Google tabs are not moved into these groups.
- Pinned and already-grouped tabs follow the active filtering settings.

Questions:

1. Did each recognized document type get its own group? **Yes/No**
2. Were non-Google tabs left untouched? **Yes/No**
3. Did the group titles identify Docs, Sheets, Slides, and Forms correctly? **Yes/No**

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

Reset the fixture. In Window A, click **Move Domain (Current Window)** and enter a domain present in Window A.

Expected:

- Matching tabs from Window A move to one new window.
- Matching tabs in Window B remain in Window B.
- Excluded pinned or grouped tabs are not moved when their ignore setting is enabled.
- A domain that does not exist produces no destructive change.

Questions:

1. Did the domain-selection prompt accept a valid domain? **Yes/No**
2. Did only matching tabs from the current window move? **Yes/No**
3. Were matching tabs in other windows left where they were? **Yes/No**
4. Did canceling or entering an invalid domain leave tabs unchanged? **Yes/No/Not tested**

### 8. Move Domain (All Windows)

Reset the fixture. In Window A, click **Move Domain (All Windows)** and enter a domain present in both windows.

Expected:

- Matching tabs from all windows move to one new window.
- Nonmatching tabs remain in their original windows.
- Excluded pinned or grouped tabs are not moved when their ignore setting is enabled.

Questions:

1. Were matching tabs collected from all windows? **Yes/No**
2. Were nonmatching tabs left unchanged? **Yes/No**
3. Were excluded tabs preserved? **Yes/No/Not applicable**

### 9. Bring All to This Window

Reset the fixture with tabs in Window A and Window B. Focus Window A and click **Bring All to This Window**.

Expected:

- Tabs from other windows move into the current window.
- Tabs already in the current window remain there.
- The operation does not close tabs.

Questions:

1. Did tabs from other windows move into the focused window? **Yes/No**
2. Were all tabs preserved? **Yes/No**
3. Did the operation behave the same with pinned/grouped settings enabled? **Yes/No/Not tested**

### 10. Close Domain (Current Window)

Reset the fixture. In Window A, click **Close Domain (Current Window)** and enter a domain present in Window A and Window B.

Expected:

- A confirmation prompt appears.
- Confirming closes matching tabs only in Window A.
- Canceling closes nothing.
- Matching tabs in Window B remain open.
- Excluded pinned or grouped tabs are preserved when their ignore settings are enabled.

Questions:

1. Did confirmation appear before closing? **Yes/No**
2. Did confirming close only matching current-window tabs? **Yes/No**
3. Did canceling preserve all tabs? **Yes/No/Not tested**

### 11. Close Domain (All Windows)

Reset the fixture. In Window A, click **Close Domain (All Windows)** and enter a domain present in multiple windows.

Expected:

- A confirmation prompt appears.
- Confirming closes matching tabs in every window.
- Canceling closes nothing.
- Excluded pinned or grouped tabs are preserved when their ignore settings are enabled.

Questions:

1. Did confirmation appear before closing? **Yes/No**
2. Were matching tabs closed across all windows? **Yes/No**
3. Did canceling preserve all tabs? **Yes/No/Not tested**

### 12. Settings and Side-Panel Smoke Test

Open Settings and test each setting at least once.

Questions:

1. Did the Settings button open the options page? **Yes/No**
2. Did changing Ignore Pinned Tabs persist after reopening Settings? **Yes/No**
3. Did changing Ignore Grouped Tabs persist after reopening Settings? **Yes/No**
4. Did changing Detect Duplicate Google Docs persist after reopening Settings? **Yes/No**
5. Did changing the language update the visible interface? **Yes/No/Not tested**
6. Did the side panel expand and shrink with Chrome's panel width? **Yes/No**
7. Did all controls remain keyboard accessible? **Yes/No**

## Test Results

Record failures with:

- Test case and settings profile
- Starting tab/window arrangement
- Expected behavior
- Actual behavior
- Whether the issue reproduces on a second attempt

After completing the matrix, update the broad checklist in [PROGRESS.md](PROGRESS.md) and record implementation defects separately from tests that passed.
