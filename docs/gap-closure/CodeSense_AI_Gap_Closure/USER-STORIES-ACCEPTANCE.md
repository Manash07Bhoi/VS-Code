# User Stories and Acceptance Criteria — CodeSense AI

## 1. New user registration
As a new user, I want to create an account so that my reviews are private and retrievable.
- Valid unique credentials create exactly one durable account.
- Invalid fields show actionable errors.
- Duplicate submission does not create duplicate accounts.
- Password is never stored or logged in plaintext.
- No success screen appears until the server confirms persistence.

## 2. Returning user
As a returning user, I want to log in and out securely.
- Valid credentials establish a session.
- Invalid credentials return a generic safe message.
- Expired/revoked sessions cannot access protected endpoints.
- Logout invalidates the server-side session.
- Refresh/replay behavior follows the selected session architecture.

## 3. Code author
As a user, I want to write or paste code in an editor and select a language.
- Monaco loads from a pinned, maintained source.
- Editor load failure has a recoverable error state.
- Source is not silently cleared or truncated.
- Only languages enabled by the server capability registry can be submitted.
- The UI states the source limit before submission.

## 4. Review requester
As a user, I want to request an AI review and know what is happening.
- The server authenticates and validates the request.
- Duplicate in-flight requests are controlled.
- Loading state reflects a real request.
- Provider success is accepted only after schema validation.
- Provider failure, timeout or quota error is shown honestly.
- No canned report is shown when provider is unavailable.

## 5. Learner reading a report
As a user, I want findings that explain why code may be problematic.
- Each finding has a supported category and severity.
- Line ranges are validated against the submitted source.
- Uncertain findings are qualified.
- Recommendation explains the change and possible trade-offs.
- Improved code is distinguishable from original code.
- Empty findings are not represented as proof of code safety.

## 6. Returning to history
As a user, I want to find my previous reports.
- History loads only the authenticated user's records.
- First-use empty state differs from no-filter-match state.
- Pagination is bounded and stable.
- Filters reset pagination.
- Deleted records cannot be reopened.
- Reloading a report returns persisted content, not regenerated output.

## 7. Privacy-conscious user
As a user, I want to know how my source is handled.
- Explain which provider receives code for analysis.
- Explain retention and deletion.
- Do not log raw source by default.
- Deletion removes app-controlled copies according to the declared policy.
- Do not promise deletion from an external provider unless verified contractually.

## 8. Accessibility user
As a keyboard user, I want to complete core workflows without a mouse.
- All actions are reachable and operable by keyboard.
- Focus order is logical and visible.
- Dialogs trap/restore focus appropriately.
- Status updates are announced accessibly.
- Monaco shortcuts do not block browser/application navigation.

## 9. Acceptance test discipline

Each story must map to automated test IDs and manual test evidence in `TEST-MATRIX.md`. Use actual service dependencies for integration tests or clearly isolated test doubles. Never present a test double result as proof of production-provider availability.
