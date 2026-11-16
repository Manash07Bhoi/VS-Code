# Conditional Logic and State Rules — CodeSense AI

The backend is authoritative for identity, ownership, validation, limits and persisted review status.

## 1. Authentication

- No valid session: protected navigation redirects to login with safe internal return target.
- Valid session: render authenticated shell.
- Session expires during request: clear stale state and require reauthentication.
- Login rate-limited: prevent repeated submission and show server-derived retry guidance.
- Invalid credentials: generic response that does not reveal account existence.

## 2. Registration

- Empty/malformed email: field error, no submission.
- Weak password: reject on client and server.
- Duplicate account: safe nonrevealing response.
- Backend failure: preserve safe inputs and allow retry.
- Success: only after account persistence and session flow actually succeeds.

## 3. Editor

- Monaco not initialized: Analyze unavailable.
- Editor initialization fails: show actionable failure, not a ready-looking empty editor.
- Empty source: reject.
- Unsupported language: reject before provider call.
- Source too large: show actual limit; never silently truncate.
- Submission pending: block duplicate submission of same source revision.
- Source changes after submission: report stays bound to submitted revision.
- Unsaved source would be discarded: ask confirmation.
- No valid session: do not submit.

## 4. Analysis

- Invalid request: reject before provider operation.
- Rate/concurrency limit reached: return meaningful retry information.
- Provider unconfigured: unavailable/configuration state, never canned findings.
- Timeout: lifecycle becomes failed/retryable according to actual workflow; no indefinite spinner.
- Malformed provider output: reject and record safe diagnostics; no fake success.
- Valid output: normalize and persist before completed state.
- Zero findings: display no-findings result and limitation caveat.
- No location: omit jump-to-line.
- No improved code: omit copy/apply-fix actions for that finding.
- Low confidence: distinguish from evidence-backed diagnostics.

## 5. Report

- Unknown ID: not-found.
- Another user's report: deny without data leakage.
- Processing: show persisted status; do not invent percentage progress.
- Failed: show failure; retry only if safe retry route exists.
- Completed: render stored analysis.
- Malformed legacy result: safe fallback and diagnostic record; do not invent fields.
- Deleted: return to history and update its result state.

## 6. History

- No stored records: first-use empty.
- Records exist but no matches: no-match state and clear-filters.
- Search/filter change: reset page/cursor and fetch again.
- Sort change: apply allowlisted sort and stable tie-breaker.
- Page exceeds results after deletion: return to last valid page or empty.
- API failure: preserve controls and show retry; do not present stale data as current.

## 7. Notifications

- No notification subsystem: omit badge/center.
- Synchronous review: inline status only.
- Persisted async event: show only after source state transition is saved.
- Read action: persist if cross-device/server-backed.
- Notification fetch failure: show failure, not a false zero unread count.

## 8. Responsive conditions

- Wide desktop: full navigation and editor workspace.
- Compact desktop: collapse secondary panels, retain core actions.
- Unsupported viewport: use deliberate compact layout or clear limitation; do not claim Android support.
- Reduced-motion preference: remove nonessential movement.

## 9. Error precedence

Specific validation takes precedence over generic submit failure. Authentication failure takes precedence over protected data rendering. Provider failure must not be hidden by success UI. Independent panel failures should not erase valid unrelated content. Never replace failed request output with cached sample data.

## 10. Invariants

- A report cannot become completed without valid normalized output being persisted.
- Owner is immutable after report creation.
- No user's query returns another user's data.
- Deletion is not reported successful before backend confirmation.
- Notification requires a real source event.
- Editor content cannot be called identical to reviewed source unless revisions match.
