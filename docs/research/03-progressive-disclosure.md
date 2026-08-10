# Progressive Disclosure & Information Architecture

## What is Progressive Disclosure?

Progressive disclosure defers advanced or rarely used features to a secondary screen or interaction, making applications easier to learn and less error-prone.

### Core Concept
1. **Initially**, show users only a few of the most important options
2. **Upon request**, offer a larger set of specialized options
3. Disclose secondary features only if a user asks for them

### Classic Example: Print Dialog
- Primary display: copies, printer selection
- Secondary display (Advanced Options button): scaling, reverse printing, etc.

---

## Benefits of Progressive Disclosure

### Improves 3 of Usability's 5 Components
1. **Learnability** – Novice users focused on most useful features; advanced features hidden
2. **Efficiency of use** – Users don't waste time scanning features they rarely use
3. **Error rate** – Fewer visible options = fewer mistakes for novice users

### For Different User Types
- **Novice users**: Prioritized attention on core features, no overwhelming "wall of options"
- **Advanced users**: Saves time by hiding rarely-used features they can ignore

### Mental Model
- Research shows users develop BETTER mental models when core features are prioritized
- Users understand system better when you help them prioritize

---

## Usability Criteria for Progressive Disclosure

### Critical Success Factors

#### 1. Get the Right Split Between Primary and Secondary
- **Disclose frequently-needed features upfront** – Users should rarely need to progress to secondary screen
- **Don't overload primary display** – Can't contain too many options or you fail to focus attention
- **No confusing features initially** – Primary features should be clear and reduce errors

**How to determine what goes primary?**
- Task analysis and field studies
- For existing systems: frequency-of-use statistics
- Analytics (page views, feature usage)
- Supplement with usability testing to confirm users WANT a feature (not just click by accident)

#### 2. Make Progression Obvious and Clear
- **Simple mechanics** – For web, follow link visualization guidelines; for apps, place advanced features button in clearly visible spot
- **Strong information scent** – Label the button/link so users know what they'll find
  - ✓ "Advanced Options"
  - ✓ "More Settings"
  - ✗ "Configure" (too vague)

### Multiple Disclosure Levels
- In theory: can have tertiary, quaternary levels
- In practice: beyond 2 levels, usability drops significantly because users get lost
- **Better approach**: If too many features, simplify or chunk secondary features into logical groups

---

## Staged Disclosure vs. Progressive Disclosure

### Progressive Disclosure
- **Initial display**: Core features
- **Subsequent displays**: Secondary features (accessed hierarchically)
- **User access**: Optional – most users get what they need initially
- **Navigation**: Hierarchical (start → secondary → return)
- **Main benefit**: Learnability; supports both novices and advanced users

### Staged Disclosure
- **Initial display**: Features accessed first in task sequence
- **Subsequent displays**: Features accessed later in task sequence
- **User access**: Usually mandatory – users step through all stages
- **Navigation**: Linear (one step → next step → finish)
- **Main benefit**: Simplicity; each step is clear and purposeful
- **Example**: Wizards, multi-step forms, checkout flows

### When to Use Staged Disclosure
- When task can be divided into distinct, linear steps
- When steps have little interaction or interdependence
- Problems: if steps are interdependent, forces back-and-forth navigation

**Example: Hotel Reservation**
- ❌ Single-screen approach: Shows availability, prices, dates AND payment info all together
  - Problem: Users want to explore room options first, don't need payment info yet
  - Solution: 2-screen approach (explore, then payment) better than 1-screen or 5-screen

---

## Progressive Disclosure Patterns for Extensions

### Pattern 1: Accordion/Collapsible Sections
```
┌─────────────────────────────┐
│ ▼ Sort Operations           │
│   • Sort by Domain          │
│   • Group by Domain         │
│   • Remove Duplicates       │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ► Move Operations (hidden)  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ► Cleanup Operations        │
└─────────────────────────────┘
```

### Pattern 2: Tabs
- Primary tab: Most-used operations
- Secondary tabs: Organize advanced features
- Advantage: All options remain discoverable

### Pattern 3: Drawer/Expandable Section
- Main action bar with most-used buttons
- "Advanced" or "More" button expands to show additional options

### Pattern 4: Modal/Dialog
- Primary action triggers inline
- "Advanced Options" button opens secondary modal dialog

---

## Information Architecture for Tab Manager

### Suggested Primary Features (MVP)
These should be immediately visible and easy to access:

1. **Sort Operations**
   - Sort tabs by domain
   - Sort tabs by domain (ignore subdomains)

2. **Grouping Operations**
   - Group tabs by domain
   - Group tabs by domain (ignore subdomains)

3. **Quick Cleanup**
   - Remove duplicate tabs
   - Close all tabs from domain

### Suggested Secondary Features (Advanced)
These can be hidden in an expanded section or separate tab:

1. **Move Operations**
   - Move domain tabs (current window) → new window
   - Move domain tabs (all windows) → new window
   - Bring all tabs to current window

2. **Find & Focus**
   - Find media playing tab

3. **Settings** (already in options page)
   - Ignore pinned tabs
   - Ignore grouped tabs
   - Language

---

## Applying Progressive Disclosure to Tab Manager UI

### Recommended UI Structure

#### Current State
- 12 buttons in a grid, all visible at once
- May be overwhelming for new users
- All features have equal visual weight

#### Recommended Changes

**Option A: Tabs + Progressive Disclosure**
```
┌─────────────────────────────────────┐
│  Common | Advanced | Settings       │
├─────────────────────────────────────┤
│                                     │
│  [Sort by Domain]                   │
│  [Group by Domain]                  │
│  [Remove Duplicates]                │
│  [Close Domain in Window]           │
│                                     │
│  ▼ Advanced Options                 │
│    [Move Domain (Current)]          │
│    [Move Domain (All)]              │
│    [Bring All Here]                 │
│    [Find Playing Media]             │
│                                     │
└─────────────────────────────────────┘
```

**Option B: Accordion Structure**
```
┌─────────────────────────────────────┐
│ ▼ Organization (expand/collapse)    │
│   [Sort by Domain]                  │
│   [Group by Domain]                 │
│   [Remove Duplicates]               │
├─────────────────────────────────────┤
│ ► Movement & Cleanup                │
│   (collapsed - shows count)         │
├─────────────────────────────────────┤
│ ► Search & Find                     │
│   (collapsed)                       │
└─────────────────────────────────────┘
```

**Option C: Modal/Expanded Details**
```
Quick Actions (Always Visible):
- Sort by Domain (prominent button)
- Group by Domain (prominent button)
- [More Options] button

Click [More Options] → Modal opens with all 12 operations organized
```

---

## Best Practices for Progressive Disclosure

### DO
- ✓ Research what features users need most via analytics or testing
- ✓ Keep primary features visible and discoverable
- ✓ Use clear, descriptive labels for "expand/advanced/more" controls
- ✓ Maintain consistent information architecture
- ✓ Test with real users to validate feature placement

### DON'T
- ✗ Hide core features that users need frequently
- ✗ Make progression mechanism unclear or hard to find
- ✗ Create more than 2 levels of disclosure (users get lost)
- ✗ Add confusing or misleading features to primary display
- ✗ Assume advanced features won't be discovered (make them clearly labeled)

---

## Implementation Checklist

- [ ] Identify which features are "core" (primary) vs. "advanced" (secondary)
- [ ] Validate with user research or analytics
- [ ] Choose disclosure pattern (tabs, accordion, drawer, etc.)
- [ ] Design primary UI to show core features without overwhelming
- [ ] Design secondary UI that groups related advanced features
- [ ] Make transition mechanism clear and labeled
- [ ] Test keyboard navigation for all disclosure levels
- [ ] Ensure ARIA labels and roles for screen readers
- [ ] Document the information architecture decision
