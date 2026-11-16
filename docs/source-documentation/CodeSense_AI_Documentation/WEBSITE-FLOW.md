# Complete Website Flow and Navigation Model

## 1. Route groups

**Public:** product introduction, registration, login, privacy information and not-found.  
**Authenticated:** workspace/dashboard, editor/new review, report detail, review history, account/security settings and editor preferences.  
**System states:** access denied, session expired, service unavailable and not-found.

Do not expose premium/developer subscriptions, billing, pricing or upgrade routes. Do not create an admin route without a verified role requirement and real administrative work.

## 2. Navigation hierarchy

```text
Public visitor
  ├── Product introduction
  │    ├── Create account
  │    └── Sign in
  ├── Create account → Authenticated workspace
  └── Sign in → Authenticated workspace

Authenticated workspace
  ├── Workspace overview
  │    ├── New review → Editor
  │    └── Recent report → Report detail
  ├── Editor
  │    ├── Submit → Review lifecycle → Report
  │    └── Return to workspace
  ├── Review history
  │    └── Selected review → Report detail
  ├── Report detail
  │    ├── Back to origin/history
  │    └── Return to editor only with explicit source handling
  ├── Preferences
  ├── Account/security
  └── Logout → Public sign-in state
```

## 3. Navigation rules

- Every internal link resolves to a real route.
- Protected routes verify session state through backend.
- Deep-linked reports verify ownership.
- Unknown/deleted identifiers produce safe not-found.
- Browser back/forward must not duplicate review submission.
- Unsaved source is preserved or confirmed before destructive navigation.
- Route transitions handle pending requests and stale responses.
- Report opened from history has a clear return path.
- Redirect targets are restricted to safe internal paths.

## 4. Navigation persistence

Search/filter state may be encoded in URL query parameters only if validated and not sensitive. Never place source code, secrets, tokens or private report bodies in URLs. Editor draft persistence must be explicitly chosen; do not imply remote persistence when it is local-only or in-memory.

## 5. Browser history and restoration

On reload, restore the authenticated shell only after session validation. A report reload fetches persisted data again. History may restore safe filters. A pending review can be restored only if backend lifecycle supports status retrieval. Never invent progress to make restoration look smooth.

## 6. Link audit

Before release, crawl internal routes and test external policy links, unknown/deleted report IDs and navigation from landing, auth, footer, account, report, history, dialogs and error states. Broken links are release defects.
