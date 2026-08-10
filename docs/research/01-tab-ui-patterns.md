# Tab UI Patterns and Best Practices

## When to Use Tabs

### Best Use Cases
- **Lengthy content with clear groupings** – Tabs minimize cognitive load by chunking content into scannable pieces instead of showing it all at once
- **Few content groupings** – Keep the number of tabs small; when tabs overflow, hidden tabs become less discoverable and interaction cost increases
- **Content with unequal importance** – Tab controls select and display a tab by default, receiving more attention. Ensure non-default tab content is supplemental rather than critical
- **Content can be labeled concisely** – Short tab labels work best, conserve horizontal space, and avoid horizontal scrolling
- **Users don't need to simultaneously see information across tabs** – Otherwise, users must repeatedly switch between tabs to compare, increasing cognitive load

### When NOT to Use Tabs
- ❌ When users need to compare information across multiple tabs simultaneously
- ❌ When you have too many tabs (causes carousel/scrolling and reduces discoverability)
- ❌ When tab labels need to be long or complex (sign that choices are too complicated)

---

## Types of Tabs

### Navigation Tabs
- Enable users to navigate to different pages
- Content has broad scope, unrelated and dissimilar
- Usually positioned at top or sometimes left of viewport
- Users expect slight loading delay
- Example: Yahoo Finance top-level navigation

### In-Page Tabs
- Organize and present related content within a single page
- Content has narrow scope, related and similar
- Users expect instantaneous loading, no page navigation
- Users remain on the current view
- Example: Google Finance market categories

### Critical: Don't Mix Tab Types
- Mixing navigation and in-page tabs within one control disorients users
- If you must use both in the same experience, **visually differentiate** them to convey they behave differently
- Example of what to avoid: San Diego Zoo Wildlife Alliance careers page mixed navigation and in-page tabs inconsistently

---

## Tab Visual Design: Best Practices

### 1. Indicate the Selected Tab (Use Multiple Indicators)
**Use at least TWO selection indicators to enhance visual salience:**

- **Common Region** – Use same background fills for selected tab and panel (classic, but less used today)
- **Lines** – Underline the selected tab (popular, flexible layout)
- **Font Styling** – Bold or darker color for selected tab text
- **Size** – Resize selected tab to appear larger
- **Icon** – Give selected tab a distinct icon not found on unselected tabs

**Example:** Crateandbarrel.com uses both common region AND font styling for maximum clarity.

### 2. Make Unselected Tabs Clearly Visible and Readable
- Unselected tabs should be visible to remind users of additional options
- Tabs that fade too much into the background may go unnoticed
- ❌ Don't use low contrast: MongoDB example had poor color contrast on unselected tabs

### 3. Connect Selected Tab to Its Panel
- Use **proximity** – Keep tabs close to their panel content
- Use **common region** – Same background fill between tab and panel creates visual cohesion
- ❌ Avoid large gaps, decorative tags, or full-width lines between tab and panel (Panera Bread example)
- ✅ Good example: macOS Trackpad settings maintain proximity despite different background fills

### 4. Use Only One Row of Tabs
- Avoid stacking tab lists within one control
- Stacking increases risk of ambiguous selection indicators
- Destroys spatial memory – users can't remember which tabs they've visited
- ❌ Amazon 2000 example: Two rows of tabs created difficult design tradeoffs

### 5. Position the Tab List Above the Panel
- Vertical or bottom list arrangements cause users to overlook tabs
- Tabs should be positioned directly above their content panel
- ✅ Vanguard example: Simply positioned tabs directly above content
- ❌ Okta example: Tabs positioned to the right violated multiple best practices

---

## Tab Content: Best Practices

### 1. Arrange Tabs for Efficient Usage
- Place **high-use content first** in the list and select it by default
- Maximizes visibility of frequently accessed content and lowers interaction cost
- Lower-use content in non-default tabs requires more effort to access
- ✅ SpotHero: "Upcoming" reservations placed first as most users care about upcoming bookings

### 2. Logically Group Tab-Panel Content
- How content is perceived and used should inform how it's grouped
- Use **card sorting** research to determine logical groupings
- If you can't find distinct groupings, tabs are likely wrong – use single-page layout with subheadings instead

### 3. Use Descriptive Tab Labels
- Users should predict what they'll find when selecting a tab
- Use **plain language** rather than branded or marketing terms
- Strong **information scent** is crucial since unselected tabs hide their content
- ❌ Variety: "Legit" is unfamiliar branded term for theater reviews – weak information scent

### 4. Write Short Tab Labels
- Tab labels should usually be **1-2 words** maximum
- Short labels are more scannable
- Longer labels signal choices are too complicated for tabs
- Examples: "Overview", "Settings", "History"

### 5. Do NOT Use ALL CAPS for Tab Labels
- All caps negatively impacts legibility
- People are unaccustomed to scanning all-caps text in daily life
- Pick one capitalization style (sentence-case or title-case) and stick with it
- ❌ Penguin Random House: All-caps labels reduce legibility

### 6. Make Tab Features Findable (if applicable)
- For complex apps, tab-management features (add, copy, delete tabs) need to be discoverable
- ✅ Google Sheets: Split buttons with visible arrow hint additional commands available
- ❌ Microsoft Excel: Required knowledge of right-click to access tab options

---

## Accessibility Considerations

### Keyboard Navigation
- Ensure tabs can be navigated and selected using keyboard
- Use **Enter** or **Space** to select a tab
- Arrow keys to navigate between tabs

### Focus
- Tabs should have high-contrast focus highlighting
- Users should always know which tab has focus

### ARIA Roles
- Use appropriate ARIA roles and properties to communicate tab structure to assistive technologies
- W3C APG patterns: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

---

## Related Best Practices

- **Tabs vs. Accordions**: Accordions work better on mobile due to limited screen space. Tabs may be preferable on desktop as accordions can make pages seem too empty when closed.
- **Progressive Disclosure**: Tabs implement progressive disclosure by chunking content and gradually revealing it upon user selection
- **Information Architecture**: Tab organization should match user's mental model of tasks and workflows

---

## Summary Checklist

- [ ] Tabs show related content with clear, distinct groupings
- [ ] Number of tabs is small (avoid carousel/scrolling)
- [ ] At least 2 selection indicators used (line + bold, or common region + font)
- [ ] Tabs positioned directly above their panel
- [ ] Single row of tabs only
- [ ] Tab labels are 1-2 words, plain language, mixed case
- [ ] High-use content in first tab, selected by default
- [ ] Unselected tabs remain visible with good contrast
- [ ] Keyboard navigation working (arrow keys, Enter/Space)
- [ ] Appropriate ARIA roles implemented
