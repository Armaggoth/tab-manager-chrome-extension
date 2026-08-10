# Accordions & Collapsible Content

## What is an Accordion?

An accordion is a design element that expands in place to expose hidden information. Unlike overlays, accordions push page content down instead of overlaying on top.

### Accordion Components
- **Header** – Clickable title/label
- **Trigger icon** – Visual indicator (▼/►) showing expanded/collapsed state
- **Content** – Hidden content that expands when header clicked
- **Behavior** – Clicking header toggles expansion/collapse

---

## When to Use Accordions

### ✓ Best For

#### 1. **Mobile Interfaces** (Primary Use Case)
- Conserve limited screen space
- Condense information effectively
- Enable users to see the "big picture" before diving into details
- Solve problem of displaying too much content in too little space

#### 2. **Mini-IA / Table of Contents**
- Provide overview of page structure without scrolling
- Give users direct access to sections of interest
- Help users form mental model of page content
- Enable users to gauge if page is relevant to their task

#### 3. **FAQs & Help Sections**
- Users can browse questions without seeing all answers
- Reduces perceived complexity of long content

#### 4. **Forms** (Collapsing Workflow Steps)
- Multi-step forms organized as accordions
- Users see entire workflow without feeling overwhelmed
- Avoids multiple page loads
- Example: Checkout forms where each step is an accordion

#### 5. **Organizing Filters & Options**
- Faceted search or filtering interfaces
- Each filter category in collapsible accordion
- Users can expand only relevant filters

### ✗ Avoid When

- Content is frequently accessed (don't hide commonly-used info)
- Comparing information across multiple sections (requires constant toggling)
- Desktop with ample space (empty collapsed state wastes real estate)

---

## Accordion Benefits & Drawbacks

### Benefits
- **Space-efficient** – Reduces perceived length and cognitive load
- **Big picture first** – Users see structure before diving into details
- **Progressive disclosure** – Hide complexity, reveal on demand
- **Mental model** – Helps users understand page organization

### Drawbacks

#### 1. **Disorientation**
- **Problem**: When accordion expands, it may scroll to top of screen, making it look like a new page loaded
- **Solution 1**: Use Browser Back button to collapse accordion (treat as in-page anchor link)
- **Solution 2**: Don't scroll the page when accordion expands (maintains orientation)
- **Example to avoid**: WebMD expanded Side Effects and scrolled to top, users thought they navigated away

#### 2. **Scrolling Fatigue**
- **Problem**: If expanded content is very long, users must scroll far to reach next accordion or scroll back to close current one
- **Solution 1**: Sticky accordion header (stays at top while scrolling through content)
- **Solution 2**: Persistent "Collapse" button (but make it discoverable – see below)
- **Example**: Wikipedia History accordion was many screenfuls; users stuck scrolling
- **Good example**: Amazon Shoe Size accordion header became sticky while scrolling

#### 3. **Hidden Affordance**
- **Problem**: Collapse/expand feature not obvious to users
- **Solution 1**: ✗ Don't use unfamiliar terms like "Collapse" (example: Zappos)
- **Solution 2**: ✓ Make it obvious via visual design, mouse-over hints, or persistent visible button
- **Solution 3**: ✓ Right-click context menu as alternate access method

---

## Accordion Design Best Practices

### 1. Visual Design
- **Clear headers** – High contrast, easy to read
- **Obvious trigger icon** – ▼ (expanded) / ► (collapsed) or + / −
- **Hover state** – Show clickability via cursor change or background highlight
- **Sufficient padding** – Make targets easy to click (min 44px for mobile touch)

### 2. Keyboard Navigation
- **Tab key** – Navigate between accordion headers
- **Enter/Space** – Expand/collapse current accordion
- **Arrow keys** (optional but helpful):
  - Up/Down: Move between accordion headers
  - Enter/Space: Expand/collapse

### 3. Focus & Visual Feedback
- **Focus indicator** – Clear outline when tabbing through headers
- **High contrast** – At least WCAG AA level
- **Visual state change** – User should clearly see accordion expanding/collapsing

### 4. Content Organization
- **Logical grouping** – Accordion sections should represent clear, distinct categories
- **Parallel structure** – All accordion items should have similar importance and format
- **Meaningful headers** – Should indicate what's inside without requiring expansion

### 5. Default State
- **By default: all collapsed** – Allows users to see full structure and decide where to start
- **Exception**: If one section is critical/highly-used, expand that one by default
- ❌ Don't expand first accordion by default just because it's first (WebMD Drug Warnings example)

---

## Accordion Patterns for Tab Manager

### Pattern 1: Feature Categories with Collapsed Groups

```
┌──────────────────────────────────────────┐
│ ▼ Organization & Sorting                 │ (expanded by default)
│   ├─ Sort by Domain                      │
│   ├─ Group by Domain                     │
│   ├─ Group by Domain (no subdomain)      │
│   └─ Remove Duplicates                   │
├──────────────────────────────────────────┤
│ ► Movement & Relocation                  │ (collapsed)
│   (3 operations)                         │
├──────────────────────────────────────────┤
│ ► Cleanup & Closing                      │ (collapsed)
│   (3 operations)                         │
├──────────────────────────────────────────┤
│ ► Find & Focus                           │ (collapsed)
│   (1 operation)                          │
└──────────────────────────────────────────┘
```

### Pattern 2: Accordion with Search/Filter

For larger feature sets, add search to filter visible accordions:

```
┌──────────────────────────────────────────┐
│ 🔍 Search operations...                  │
├──────────────────────────────────────────┤
│ ▼ Sort                                   │
│   ├─ Sort by Domain                      │
│   ├─ Group by Domain                     │
│   └─ ...                                 │
│ ► Move                                   │
│ ► Cleanup                                │
└──────────────────────────────────────────┘
```

### Pattern 3: Accordion with Indicators

Show count/status in header to give users preview:

```
┌──────────────────────────────────────────┐
│ ▼ Duplicate Tabs (5 found)               │ (indicates urgency/relevance)
│   [Close All Duplicates]                 │
├──────────────────────────────────────────┤
│ ► Pinned Tabs (3 total)                  │
│   (collapsed - shows count)              │
└──────────────────────────────────────────┘
```

---

## Preventing Common Accordion Problems

### Problem 1: Users Get Disoriented
- **Solution**: Don't scroll page when accordion expands
- Keep accordion in view when content is short
- If content is long, use sticky header (stays visible at top)

### Problem 2: Users Can't Find Collapse Button
- **Solution**: Make header itself clickable (standard pattern)
- Don't hide collapse in context menu unless paired with obvious "more options" icon
- Avoid unfamiliar terminology

### Problem 3: Too Much Content Under One Accordion
- **Solution**: Limit accordion content length
- If expanding shows many screenfuls, consider:
  - Breaking into multiple accordions
  - Adding search/filter
  - Pagination within accordion
  - Sticky collapse button at top of expanded content

### Problem 4: Users Don't Know What's Inside
- **Solution**: Use descriptive headers with strong "information scent"
- Consider showing counts or indicators
- Can show preview text in header (truncated)

---

## Accessibility Considerations

### ARIA Roles & Attributes
```html
<!-- Accordion container -->
<div role="region" aria-label="Accordion">

  <!-- Accordion header (button) -->
  <button
    aria-expanded="false"
    aria-controls="panel1"
    id="accordion-header-1"
  >
    <span class="trigger-icon">▼</span>
    Sort Operations
  </button>

  <!-- Accordion content panel -->
  <div id="panel1" role="region" aria-labelledby="accordion-header-1">
    <!-- Content here -->
  </div>

</div>
```

### Keyboard Support
- All accordion headers focusable via Tab key
- Enter/Space expands/collapses
- Optional: Arrow keys navigate between headers

### Focus Management
- Focus remains on header after expansion
- Clear focus indicator visible
- Focus outline has good contrast (WCAG AA+)

### Screen Reader Support
- `aria-expanded` announces state
- `aria-controls` links header to panel
- `aria-labelledby` links panel to its header
- Descriptive header text describes content

---

## Comparison: Accordions vs. Tabs for Tab Manager

| Factor | Accordions | Tabs |
|--------|-----------|------|
| **Space efficiency** | Better (collapses to headers) | Good (headers always visible) |
| **Mobile friendly** | Excellent | Good |
| **Desktop friendly** | Fair (empty space when collapsed) | Excellent |
| **Discoverability** | Good (all options visible as headers) | Excellent (tabs always visible) |
| **Scrolling** | Can be issue if content long | Usually not (tabs at top) |
| **Multiple selections** | Easy to expand several | Harder (single tab at a time) |
| **Implementation complexity** | Moderate | Lower |

**Recommendation for Tab Manager**:
- If side panel is narrow (mobile-like), **accordions** better
- If side panel is wider (desktop), **tabs or accordions** both work
- Consider hybrid: **tabs for major categories, accordions within tabs**

---

## Implementation Checklist

- [ ] All accordion headers clickable and focusable
- [ ] Enter/Space expands/collapses
- [ ] Arrow keys navigate between headers (optional but recommended)
- [ ] Trigger icon visible and clear (▼ / ►)
- [ ] Focus outline clearly visible with good contrast
- [ ] `aria-expanded` attribute updated on state change
- [ ] `aria-controls` and `aria-labelledby` properly set
- [ ] Keyboard focus management correct
- [ ] No page scroll when accordion expands/collapses
- [ ] Content length reasonable (max 1-2 screenfuls)
- [ ] Headers have descriptive, scannable text
- [ ] Tested with screen readers
- [ ] Tested with keyboard-only navigation
