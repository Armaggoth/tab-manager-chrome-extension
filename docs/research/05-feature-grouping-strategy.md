# Feature Grouping Strategy for Tab Manager

## Tab Manager Operations Analysis

### Current Operations (12 total)

#### Group 1: Organization & Sorting
1. Sort tabs by domain
2. Group tabs by domain
3. Group tabs by domain (no subdomain)
4. Ungroup tabs

**Characteristics**: Reorganize/reorder existing tabs in current window

#### Group 2: Movement & Relocation
5. Move domain tabs (current window) → new window
6. Move domain tabs (all windows) → new window
7. Bring all tabs to current window

**Characteristics**: Move tabs between windows

#### Group 3: Duplicate Management
8. Remove duplicates

**Characteristics**: Clean up redundant content

#### Group 4: Cleanup & Closing
9. Close domain tabs (current window)
10. Close domain tabs (all windows)

**Characteristics**: Remove tabs from active browsing

#### Group 5: Search & Focus
11. Find media playing
12. (Future: Jump to tab, search tabs, etc.)

**Characteristics**: Locate and focus specific tabs

---

## Information Architecture: User Tasks

### Primary User Tasks (MVP - What Users Do Most)

#### Task 1: Clean Up Disorder
- **User need**: "I have too many tabs open, help me organize them"
- **Operations**:
  - Sort by domain
  - Remove duplicates
  - Close unwanted tabs

#### Task 2: Locate Information
- **User need**: "Where's that tab I need?"
- **Operations**:
  - Find media playing
  - Find tab by domain

#### Task 3: Consolidate Workspaces
- **User need**: "Move related tabs to a separate window"
- **Operations**:
  - Move domain to new window
  - Bring all here

### Secondary User Tasks (Advanced)

#### Task 4: Organize by Project
- **User need**: "Group tabs by project/domain"
- **Operations**:
  - Group by domain (with/without subdomain)
  - Ungroup

---

## Recommended UI Grouping Models

### Model 1: Task-Based Tabs

Organize by user workflow rather than technical grouping:

```
┌─────────────────────────────────────┐
│ Clean Up | Find | Consolidate       │
├─────────────────────────────────────┤
│                                     │
│ CLEAN UP (Tab 1)                    │
│ ┌─────────────────────────────────┐ │
│ │ [Sort by Domain]                │ │
│ │ [Remove Duplicates]             │ │
│ │ [Close Tabs...]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ FIND (Tab 2)                        │
│ ┌─────────────────────────────────┐ │
│ │ [Find Playing Media]            │ │
│ │ [Jump to Tab by Domain]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ CONSOLIDATE (Tab 3)                 │
│ ┌─────────────────────────────────┐ │
│ │ [Move to New Window]            │ │
│ │ [Bring All Here]                │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Advantages**:
- Aligns with how users think about tasks
- Each tab has clear purpose
- New features fit logically into tabs
- Easy to find operations for current task

**Disadvantages**:
- Requires some categorization work
- Might be overkill for MVP with only 12 operations

---

### Model 2: Category Tabs with Accordions

Organize by operation type, with progressively-disclosed advanced options:

```
┌─────────────────────────────────────┐
│ Common | Advanced                   │
├─────────────────────────────────────┤
│                                     │
│ ▼ Organization                      │
│   [Sort by Domain]                  │
│   [Remove Duplicates]               │
│   [Close Domain (Current)]          │
│                                     │
│ ► Advanced Options                  │
│   [Group by Domain]                 │
│   [Group (no subdomain)]            │
│   [Ungroup]                         │
│   [Move Domain (Current) → New]     │
│   [Move Domain (All) → New]         │
│   [Bring All Here]                  │
│   [Close Domain (All)]              │
│   [Find Playing Media]              │
│                                     │
└─────────────────────────────────────┘
```

**Advantages**:
- Balances discoverability with simplicity
- Progressive disclosure hides complexity
- Scales well for future features
- Two levels: primary and secondary

**Disadvantages**:
- Requires decision about what's "primary"
- May feel artificial if advanced features are useful

---

### Model 3: Category Tabs + Accordions (Nested Grouping)

Organize by operation category in tabs, then by sub-category with accordions:

```
┌─────────────────────────────────────┐
│ Organization | Movement | Cleanup   │
├─────────────────────────────────────┤
│                                     │
│ ORGANIZATION TAB                    │
│ ▼ Sorting                           │
│   [Sort by Domain]                  │
│   [Sort by Domain (no subdomain)]   │
│                                     │
│ ▼ Grouping                          │
│   [Group by Domain]                 │
│   [Group (no subdomain)]            │
│   [Ungroup]                         │
│                                     │
│ ▼ Cleanup                           │
│   [Remove Duplicates]               │
│                                     │
│ MOVEMENT TAB                        │
│ [Move Domain → New (Current)]       │
│ [Move Domain → New (All)]           │
│ [Bring All Here]                    │
│                                     │
│ CLEANUP TAB                         │
│ [Close Domain (Current)]            │
│ [Close Domain (All)]                │
│ [Find Playing Media]                │
│                                     │
└─────────────────────────────────────┘
```

**Advantages**:
- Clear, organized structure
- Multiple organizational levels match complexity
- Good discoverability
- Tab names are obvious

**Disadvantages**:
- More complex to implement
- Overkill if side panel narrow

---

### Model 4: Collapsible Accordion (No Tabs)

Simple accordion structure, good for narrow side panel:

```
┌─────────────────────────────────────┐
│                                     │
│ ▼ Sort & Organize                   │
│   [Sort by Domain]                  │
│   [Group by Domain]                 │
│   [Group (no subdomain)]            │
│   [Ungroup]                         │
│   [Remove Duplicates]               │
│                                     │
│ ► Move & Consolidate                │
│   (5 operations)                    │
│                                     │
│ ► Cleanup & Closing                 │
│   (3 operations)                    │
│                                     │
│ ► Find & Focus                      │
│   [Find Playing Media]              │
│                                     │
└─────────────────────────────────────┘
```

**Advantages**:
- Simple, mobile-friendly
- All operations discoverable
- Flexible: expand only what you need
- Good use of limited space

**Disadvantages**:
- Most-used features may be hidden
- Requires extra click to expand

---

## Recommended Approach: Hybrid Model

**For MVP**: Combine Tabs + Accordions with Progressive Disclosure

```
┌─────────────────────────────────────┐
│ Quick Actions | Settings            │
├─────────────────────────────────────┤
│                                     │
│ QUICK ACTIONS TAB                   │
│ ┌─────────────────────────────────┐ │
│ │ [Sort by Domain]                │ │
│ │ [Remove Duplicates]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ▼ More Organization                 │
│   [Group by Domain]                 │
│   [Group (no subdomain)]            │
│   [Ungroup]                         │
│                                     │
│ ▼ Move & Consolidate                │
│   [Move Domain → New (Current)]     │
│   [Move Domain → New (All)]         │
│   [Bring All Here]                  │
│                                     │
│ ▼ Cleanup & Closing                 │
│   [Close Domain (Current)]          │
│   [Close Domain (All)]              │
│   [Find Playing Media]              │
│                                     │
│ SETTINGS TAB                        │
│ ☐ Ignore Pinned Tabs               │
│ ☐ Ignore Grouped Tabs              │
│ 🌐 Language: English ▼             │
│                                     │
└─────────────────────────────────────┘
```

**Why This Works**:
1. **Tab 1 (Quick Actions)**: Most-used operations immediately visible
2. **Accordions**: Group related operations, hide by default
3. **Tab 2 (Settings)**: Already separate conceptually
4. **Scalable**: Easy to add operations to existing accordion sections
5. **Progressive disclosure**: Supports both novice and power users

---

## Alternative: Compact Tab Manager (Very Space-Efficient)

If side panel is very narrow, use single accordion:

```
┌─────────────────────────────────────┐
│ ▼ Sort & Organize (EXPANDED)        │
│   [Sort by Domain]                  │
│   [Remove Duplicates]               │
│                                     │
│ ► Manage Tabs                       │
│ ► Move & Consolidate                │
│ ► Cleanup                           │
│ ► Settings                          │
│                                     │
└─────────────────────────────────────┘
```

**Advantages**: Minimal visual footprint
**Disadvantages**: Settings buried under accordions

---

## Domain Selection UX Improvement

### Current Approach
- Uses `prompt()` dialog box (not discoverable, looks old)

### Improved Approaches

#### Option A: Dropdown Select
```
┌─────────────────────────────────────┐
│ Select domain to close:             │
│ ┌──────────────────────────────────┐│
│ │ google.com                  ▼    ││
│ └──────────────────────────────────┘│
│ [Close Tabs] [Cancel]               │
└─────────────────────────────────────┘
```

#### Option B: List with Radio Buttons
```
┌─────────────────────────────────────┐
│ Close tabs from:                    │
│                                     │
│ ⦿ google.com (8 tabs)              │
│ ○ github.com (3 tabs)              │
│ ○ stackoverflow.com (5 tabs)        │
│                                     │
│ [Close Selected] [Cancel]           │
└─────────────────────────────────────┘
```

#### Option C: Inline with Buttons
```
┌─────────────────────────────────────┐
│ Domains currently open:             │
│                                     │
│ [google.com] ✕                      │
│ [github.com] ✕                      │
│ [stackoverflow.com] ✕               │
│                                     │
└─────────────────────────────────────┘
```

**Recommendation**: Option A (Dropdown) balances simplicity with visual consistency

---

## Implementation Roadmap

### Phase 1: MVP (Current)
- Single row of 12 buttons (or grouped by category)
- No tabbed interface yet
- Basic functionality working

### Phase 2: UI Reorganization (Next)
- Introduce tabs + accordions
- Progressive disclosure: "Quick Actions" vs. "Advanced"
- Improve domain selection UX
- Settings moved to separate tab

### Phase 3: Future Enhancement
- Search/filter operations
- Keyboard shortcuts for frequent operations
- Operation history/undo
- Custom operation grouping per user

---

## Design Decision Summary

**Recommended for Tab Manager v1.0+**:
- **Tab 1: Quick Actions** – 2-3 most-used operations
- **Accordions**: Secondary operations grouped logically
- **Tab 2: Settings** – User preferences, language
- **Domain Selection**: Dropdown (or list) instead of prompt()

This approach:
✓ Supports both novice and power users
✓ Scales for future features
✓ Maintains clarity and discoverability
✓ Follows progressive disclosure best practices
✓ Mobile and desktop friendly
