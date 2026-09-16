# Atlassian Product Classification

**Status**: Planned P1 feature; do not implement yet.

## Problem

Atlassian products can share a site hostname. Hostname-only grouping merges distinct workspaces, such as:

- `https://client.jira.com/wiki/spaces/ENG/...` - Confluence
- `https://client.jira.com/browse/ENG-123` - Jira

The extension should classify an eligible Atlassian URL by product before it derives a grouping or sort key. It must preserve the existing hostname behavior for URLs that cannot be classified with confidence.

## Research Findings

Atlassian Cloud identifies products primarily through product-specific URL namespaces, not separate hostnames:

- Confluence Cloud REST v2 requests are under `/wiki/api/v2/...`. This confirms `/wiki` as the Confluence product context path on a shared Cloud site.
- Jira Cloud REST API requests are under `/rest/api/3/...`. Jira issue resources are identified by an issue ID or key; the user-facing issue route convention is `/browse/{issueKey}`.
- Official REST paths are integration contracts, rather than a promise that every browser UI route is stable. Browser classification must therefore recognize documented product prefixes and conservatively treat all other paths as unknown.

There is no reliable passive, universal browser URL marker for every Atlassian deployment. Cloud sites commonly use `*.atlassian.net`; self-managed Jira and Confluence can use a customer-controlled hostname and context path. Product detection must not assume an `atlassian.net` hostname or infer a product only from a hostname containing `jira`.

### Official Sources

- [Confluence Cloud REST API v2 introduction](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/) documents `/wiki/api/v2/pages` and other Confluence endpoints under `/wiki`.
- [Jira Cloud REST API v3 introduction](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/) documents Jira endpoints under `/rest/api/3/...`.
- [Jira Cloud issue API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) documents Jira issues as resources identified by an ID or key.

## Options

| Option | Reliability | Cost and risk | Recommendation |
|---|---|---|---|
| URL-path classifier | High for documented prefixes; safe fallback for unknown paths | Small shared utility and focused tests | Use for the initial feature |
| Per-site user override | Covers custom self-managed context paths | Requires settings UI, validation, and localized copy | Follow-up when real custom paths require it |
| Tab title or favicon inference | Heuristic only; titles and icons can change or be customized | False positives; title availability is inconsistent | Do not use as a primary signal |
| Fetch a product REST endpoint | Can confirm a product after authentication | Requires host permissions, cross-origin requests, and may create user-visible/auth failure cases | Do not use for tab classification |
| Inject page script and inspect DOM | Product-specific and brittle | Requires host permissions and content scripts; violates the lightweight URL-only design | Do not use |

## Proposed Classification Contract

Introduce a pure utility, conceptually `detectAtlassianProduct(url)`, returning `jira`, `confluence`, or `null`.

Initial rules, evaluated on `new URL(url).pathname` with path-segment boundaries:

| URL path | Product | Confidence |
|---|---|---|
| `/wiki` or `/wiki/...` | Confluence | Strong |
| `/browse/{issueKey}` | Jira | Strong when `{issueKey}` matches the Jira issue-key shape |
| `/rest/api/{version}/...` | Jira | Strong for API URLs; tabs may still be retained as Jira |
| `/jira/...` | Jira | Medium; recognize only after adding real-world fixtures |
| Any other path | `null` | Do not specialize |

The initial implementation should produce product-qualified grouping keys and labels only when a rule matches:

- `client.jira.com + Confluence` -> key `atlassian:confluence:client.jira.com`, label `Confluence: client.jira.com`
- `client.jira.com + Jira` -> key `atlassian:jira:client.jira.com`, label `Jira: client.jira.com`
- Unknown `client.jira.com` route -> existing key and label `client.jira.com`

For the existing "No Subdomain" mode, preserve the user-selected base-domain semantics while retaining the product discriminator, for example `atlassian:confluence:jira.com` and `atlassian:jira:jira.com`. This requires an explicit product-aware domain match rule so Move and Close operations do not join Jira and Confluence solely because the host matches.

## Implementation Plan

1. Add `detectAtlassianProduct(url)` in `utils.js`, using `URL.pathname`; return `null` for invalid, ambiguous, and unsupported paths.
2. Apply the result consistently in `getGroupingKey()`, `getGroupingLabel()`, and `getDomainSortKey()` ahead of hostname fallback, matching the existing Google Workspace specialization pattern.
3. Define a shared product-aware domain matching helper for domain Move and Close operations. It must use the active tab's detected product whenever it is known, and retain current domain-only behavior when it is unknown.
4. Add table-driven unit tests for Jira, Confluence, unknown Atlassian routes, non-Atlassian lookalikes, invalid URLs, and No Subdomain behavior.
5. Update English and Spanish strings only if product-qualified labels become user-visible beyond generated group names.
6. Manually validate sorting, grouping, Move Domain, and Close Domain against a Jira issue and a Confluence page on the same site, including grouped and pinned-tab settings.

## Acceptance Criteria

- Jira and Confluence tabs on the same hostname sort and group separately when their paths meet a supported rule.
- A Jira domain Move or Close action does not include recognized Confluence tabs, and the reverse is also true.
- Unknown paths continue to use the current hostname-based behavior.
- Custom domains are supported when their path matches a rule; the implementation does not require an Atlassian-owned hostname.
- The classifier performs no network request, content-script injection, or title/fav-icon inference.
- Existing Google Workspace product classification and all non-Atlassian behavior remain unchanged.

## Open Questions

- Which additional Jira browser routes occur in the target environments, particularly `/jira/software/...`, `/secure/...`, and project routes?
- Should an administrator or user be able to configure product context paths for self-managed instances? Defer until the URL-only rules prove insufficient.
- Should Bitbucket, Trello, Jira Service Management, and Atlassian Administration be included in a later product registry? They are out of scope for this P1 item.

**Research date**: September 16, 2026
