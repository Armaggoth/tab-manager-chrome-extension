# Change Management Process

Use this lightweight process for new work. It creates enough context to review, test, and revisit a change without requiring every change to become a full specification.

## Classify the Work

| Type | Record | Required Validation |
|------|--------|---------------------|
| Large feature | A self-contained `docs/specs/specNNN/` folder | Acceptance criteria, focused automated tests, manual Chrome validation, accessibility review |
| Small feature | A concise roadmap or issue entry and the pull request description | Focused automated test when practical; manual Chrome check for UI or browser-API behavior |
| Bug fix | `docs/guides/BUG-LOG.md` with reproduction, expected and actual behavior, root cause, fix, and retest result | Regression test where practical, plus the original reproduction |
| Hotfix | Bug record plus a brief impact, mitigation, and rollback note | Focused regression and release verification before broad follow-up work |
| Refactor, dependency, or maintenance change | Pull request description; add an architecture decision only when behavior or a durable design boundary changes | Existing and targeted tests; verify no user-facing behavior changed unless intended |
| Documentation-only change | Pull request description or the affected planning document | Link and content review |
| User-impacting incident | A blameless postmortem linked from the bug record | Track concrete prevention, mitigation, and detection actions to closure |

## Large Feature Specification

Start a large feature in the next unused `specNNN` folder. Its `README.md` must contain:

- Goal and non-goals
- Decisions made and open decisions
- UX/design, engineering, accessibility, and testing tasks
- Acceptance criteria and a single continuation point
- Links from the documentation index and the roadmap

`spec001` establishes this convention. Completed features remain documented where they are; do not retroactively move them into `docs/specs/`.

## Delivery Workflow

1. Classify the work before changing code and create the appropriate record.
2. Keep each change focused. Use a separate branch and pull request for unrelated work when the repository workflow calls for one.
3. Define observable acceptance criteria before implementation, including localization and accessibility where the UI changes.
4. Run the narrowest meaningful automated check, then perform manual Chrome validation for extension behavior that mocks cannot prove.
5. Link the change record, tests, and any follow-up work in the pull request or commit context.
6. Record verified results in the feature spec, bug log, or manual test plan. Do not mark work complete without a stated validation result.

## Feature Toggles

Use a temporary release toggle only when an incomplete or risky code path must coexist with stable behavior. Record the owner, default state, validation for enabled and disabled paths, and removal trigger. Avoid permanent toggles without a clear product or operational purpose.

## Research Basis

- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): use focused branches, isolated changes, pull-request review, and links between work items and pull requests.
- [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html): distinguish toggle purposes, test both paths, and remove temporary toggles to avoid accumulated complexity.
- [Google SRE Postmortem Culture](https://sre.google/workbook/postmortem-culture/): use blameless incident records with concrete, owned, prioritized, measurable follow-up actions.