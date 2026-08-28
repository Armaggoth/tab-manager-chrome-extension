# Tab Manager Extension - Documentation

## 📚 Documentation Overview

This folder contains all documentation for Tab Manager, organized into logical sections for easy navigation.

**Last Updated**: August 28, 2026
**Current Phase**: Testing & Polish

---

## 📁 Documentation Sections

### [📖 Research](research/index.md) – UX/UI Research & Best Practices
Comprehensive research on UI patterns, accessibility, and design principles.

**Key Research Topics**:
- [Tab UI Patterns](research/01-tab-ui-patterns.md) – Tab design best practices
- [Chrome Extension UI Architecture](research/02-chrome-extension-ui.md) – APIs and constraints
- [Progressive Disclosure](research/03-progressive-disclosure.md) – Feature prioritization
- [Accordions & Collapsible Content](research/04-accordions-collapsible.md) – Expandable patterns
- [Feature Grouping Strategy](research/05-feature-grouping-strategy.md) – **Recommended for Tab Manager** ⭐

### [🎨 Design](design/index.md) – UI Design Decisions
Design patterns, component specifications, and recommended structure.

### [⚙️ Architecture](architecture/index.md) – Technical Architecture
Service worker patterns, message passing, Chrome APIs, and implementation details.

### [📋 Guides](guides/index.md) – Setup & Development Guides
- [SETUP.md](guides/SETUP.md) – Initial project setup
- [PROGRESS.md](guides/PROGRESS.md) – Development progress tracking
- [MANUAL-TEST-PLAN.md](guides/MANUAL-TEST-PLAN.md) – Feature-by-feature manual test plan

---

## 🚀 Quick Start by Role

### I'm Designing the UI (Designer/PM)
1. Read [Feature Grouping Strategy](research/05-feature-grouping-strategy.md) – Specific recommendations
2. Review [Tab UI Patterns](research/01-tab-ui-patterns.md) – Visual design best practices
3. Check [Design Folder](design/index.md) – Recommended UI structure
4. See [Progressive Disclosure](research/03-progressive-disclosure.md) – Feature prioritization

### I'm Implementing the Code (Developer)
1. Read [SETUP.md](guides/SETUP.md) – Get project running locally
2. Check [Chrome Extension UI Architecture](research/02-chrome-extension-ui.md) – API reference
3. Review [PROGRESS.md](guides/PROGRESS.md) – Next implementation steps
4. See root [CLAUDE.md](../CLAUDE.md) – Full architecture details

### I'm Reviewing Accessibility (A11y/QA)
1. Check [Tab UI Patterns](research/01-tab-ui-patterns.md#accessibility-considerations) – Keyboard & ARIA
2. Review [Accordions & Collapsible Content](research/04-accordions-collapsible.md#accessibility-considerations) – Accessibility requirements
3. See [Design Folder](design/index.md) – Accessibility guidelines

---

## 📖 Research Documents Summary

See [Research folder](research/index.md) for full details on each topic.

| Document | Focus | Key Topics |
|----------|-------|-----------|
| **Tab UI Patterns** | UI/UX | When to use tabs, visual design, accessibility |
| **Chrome Extension UI** | Technical | APIs, side panel, message passing, storage |
| **Progressive Disclosure** | Design Pattern | Feature prioritization, complexity management |
| **Accordions** | UI Pattern | Collapsible content, usability, accessibility |
| **Feature Grouping** | Recommendation | **Recommended UI structure for Tab Manager** |

---

## 🎯 Recommended UI Structure

Based on research and best practices:

### Hybrid Model: Tabs + Accordions + Progressive Disclosure (planned)

The current side panel uses one responsive, scrollable action view. The hybrid model below is a planned UI reorganization, not the current implementation.

**Tab 1: Quick Actions** (Most-used, expanded by default)
- Sort by Domain
- Remove Duplicates

**Accordions** (Secondary, collapsed by default)
- More Organization
- Move & Consolidate
- Cleanup & Closing

**Tab 2: Settings**
- Ignore Pinned Tabs
- Ignore Grouped Tabs
- Language

See [Feature Grouping Strategy](research/05-feature-grouping-strategy.md) for detailed analysis and alternatives.

---

## 📂 Folder Structure

```
docs/
├── index.md (this file)
├── research/
│   ├── index.md
│   ├── 01-tab-ui-patterns.md
│   ├── 02-chrome-extension-ui.md
│   ├── 03-progressive-disclosure.md
│   ├── 04-accordions-collapsible.md
│   └── 05-feature-grouping-strategy.md
├── design/
│   └── index.md
├── architecture/
│   └── index.md
├── guides/
│   ├── index.md
│   ├── SETUP.md
│   ├── PROGRESS.md
│   └── MANUAL-TEST-PLAN.md
└── 00-overview/
    └── (project overview structure)
```

---

## 🔗 Related Files in Workspace

- [README.md](../README.md) – User-facing project documentation
- [CLAUDE.md](../CLAUDE.md) – Full architecture and requirements
- [SETUP.md](../SETUP.md) – Initial setup guide
- [PROGRESS.md](guides/PROGRESS.md) – Development progress tracking

---

## ✅ Best Practices Checklist

### Tab Design
- [ ] At least 2 selection indicators (underline + bold)
- [ ] Tabs positioned above content panel
- [ ] Tab labels 1-2 words, mixed case, descriptive
- [ ] High-use content in first tab, selected by default
- [ ] Keyboard navigation works (Tab, Arrow keys, Enter/Space)

### Progressive Disclosure
- [ ] Core features visible and accessible
- [ ] Advanced features clearly labeled and grouped
- [ ] Progression mechanism obvious (≤2 levels)

### Accordions
- [ ] Clear headers with descriptive text
- [ ] Obvious trigger icon (▼/►)
- [ ] Keyboard navigation works
- [ ] `aria-expanded` attribute maintained
- [ ] No page scroll when expanding/collapsing

### Accessibility (All)
- [ ] Keyboard navigation fully functional
- [ ] Focus indicators clear and high-contrast
- [ ] ARIA labels, roles, properties correct
- [ ] Color contrast WCAG AA+
- [ ] Screen reader tested

---

## 📞 Need Help?

- **UI Design questions?** → See [Research Folder](research/index.md)
- **Implementation questions?** → See [Guides](guides/index.md) or [Architecture](architecture/index.md)
- **Setup issues?** → See [SETUP.md](guides/SETUP.md)
- **Project status?** → See [PROGRESS.md](guides/PROGRESS.md)
- **Full architecture?** → See root [CLAUDE.md](../CLAUDE.md)

---

**Date**: August 28, 2026 | **Phase**: Testing & Polish
