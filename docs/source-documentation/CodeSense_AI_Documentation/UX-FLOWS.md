# UX Flows — CodeSense AI

## 1. Navigation principles

The user must understand where they are, what the system is doing, whether code has been submitted and the next safe action. Keep the main path focused: authentication → editor → analysis → report → history. Do not insert unnecessary steps after sign-in.

## 2. First visit and account creation

1. Visitor opens the public product page.
2. Visitor chooses Create account.
3. Registration validates input locally for immediate feedback.
4. Backend revalidates, checks uniqueness and rate limits, and creates the account.
5. Establish the configured session only after actual success.
6. Route to authenticated workspace.
7. On failure, preserve safe field input and explain the problem.

Do not claim email verification or password recovery unless a real mail provider and complete secure flow exist.

## 3. Returning-user login

1. User opens Login.
2. Enters credentials and submits.
3. UI prevents duplicate submission and shows pending state.
4. Backend verifies credentials and rate limit.
5. On success, establish secure session and route to intended internal destination.
6. On invalid credentials, use a non-revealing error.
7. On service failure, state that authentication could not be completed; do not show success.

## 4. Start a code review

1. User selects New Review.
2. Editor initializes Monaco.
3. UI obtains the supported language capability list.
4. User selects language and writes/pastes source.
5. Client checks empty input and obvious size constraints.
6. User selects Analyze.
7. UI captures source revision and language; duplicate submission is blocked.
8. Backend authenticates, validates, checks limits and creates lifecycle record.
9. Backend invokes configured AI provider.
10. Provider output is validated against strict schema.
11. Backend persists normalized result.
12. UI displays actual result or honest failure.

If asynchronous processing is used, the lifecycle must be backed by a real durable queue and status mechanism. Do not imitate work with timers.

## 5. Inspect report

1. User opens a completed report.
2. UI fetches the report from backend, scoped to owner.
3. Summary and actual findings render.
4. User selects category/finding.
5. Detail panel shows evidence, explanation, impact and recommendation.
6. User may copy a recommendation or improved code.
7. Jump-to-location is offered only when valid location metadata exists.
8. Applying a suggested change requires confirmation and retains original source.

A report with zero findings does not certify code correctness or security.

## 6. History flow

1. User opens Review History.
2. UI requests first page of real user-owned reviews.
3. If no records exist, show a first-use empty state and New Review action.
4. User searches, filters, sorts or paginates.
5. Filter change resets page position.
6. Selecting an item opens its report.
7. Delete requires confirmation.
8. Successful deletion refreshes result set and pagination.
9. Failed deletion keeps the item visible and shows an actionable error.

## 7. Session expiration and access denial

If server rejects an expired session, stop protected requests, clear stale client auth state, preserve only a safe internal return path and route to login. If a report belongs to another user, do not disclose its existence/content. Apply the documented not-found/forbidden policy.

## 8. Provider failure flow

1. Backend receives timeout, rate limit, invalid response or unavailable status.
2. Backend classifies failure and records safe diagnostic data.
3. Backend does not construct a synthetic report.
4. UI explains failure and whether retry is safe.
5. Retry follows idempotency rules.
6. If provider remains unavailable, UI does not claim completion.

## 9. Distinct empty states

- No history: no review records exist.
- No matches: records exist but search/filter returned none.
- No findings: analysis completed and returned no findings.
- No improved code: no defensible correction was returned.
- No notifications: no real event exists or all have been read.

Do not use one generic empty screen for these conditions.

## 10. Keyboard and pointer operation

Primary journeys must work without a mouse. Provide visible focus, logical tab order, Escape behavior for menus/dialogs and non-conflicting shortcuts. Monaco shortcuts must not trigger destructive application actions.

## 11. Desktop layout transitions

At wide desktop widths, allow the editor to occupy most of the viewport. At narrower desktop widths, collapse secondary panels and compact navigation while keeping essential controls visible. Phone-sized/Android layouts are not a supported target.
