# PRD2 — Detailed Functional, Interaction and Operational Specification

This document expands `PRD.md` into implementable behavior and acceptance rules. It is normative for product behavior. Implementation evidence must be recorded separately in `REPOSITORY-AUDIT.md` and the release report.

## 1. Product operating model

CodeSense AI has three trust boundaries:

1. Browser client: displays the application, hosts Monaco, validates for usability and submits requests. It is not trusted for authorization, secrets, quotas or data ownership.
2. Application backend: authenticates users, validates requests, applies limits, coordinates review workflows, calls providers and stores results.
3. External dependencies: MongoDB and AI provider. Their availability and response quality are not guaranteed; failure must be handled honestly.

The review is advisory. The product must never indicate that a clean report proves correctness, absence of vulnerabilities or production readiness.

## 2. Full feature specification

### 2.1 Registration

Fields: email and password, with password confirmation only when it improves the selected form design. Normalize email according to a documented policy, enforce validation and uniqueness, and reject weak passwords according to a documented policy. Avoid revealing whether an arbitrary email exists through overly specific public errors. Validate server-side even when client validation exists. Create the durable account before displaying success. Send verification email only if a real delivery provider and end-to-end flow are configured; otherwise do not show an unimplemented verification state.

### 2.2 Login and logout

Verify credentials using the password hash, apply rate limits and create a secure session. Cookie sessions must use HttpOnly, Secure in production, SameSite and CSRF controls as appropriate. If token auth is selected, define access/refresh lifetimes, rotation, revocation and safe storage. Logout invalidates the server-side session/refresh credential; deleting a frontend variable is insufficient. Expired sessions route to login with only a safe internal return path.

### 2.3 Dashboard / workspace overview

The dashboard is a utility surface, not an artificial analytics product. Content comes from the authenticated user's real records. The primary action opens the editor. Recent entries link to real reports. Counts, if shown, derive from actual queries and have defined meanings. Do not render fabricated charts or sample activity.

### 2.4 Editor workspace

The editor includes navigation, document context, language selector, Monaco surface, source size feedback, Analyze action and accessible status. Clarify whether drafts persist. Do not claim autosave without implementation and testing. The selected language maps to a canonical identifier accepted by the backend. Unsupported languages must not appear as review-supported.

Editor behavior:
- preserve unsent text when opening panels and moving within the app where appropriate;
- warn before discarding meaningful source;
- never silently clear code;
- prevent duplicate submission for the same revision;
- bind reports to the submitted source revision;
- show Monaco initialization errors and recovery;
- use Monaco keyboard behavior without conflicting global shortcuts.

### 2.5 Analysis lifecycle

Use persisted lifecycle states supported by the actual architecture, such as accepted, processing, completed and failed. Validate every transition. If requests are synchronous, use bounded provider timeouts and a coherent failure path. If work is asynchronous, use a durable queue and idempotent workers; do not imitate background processing with timers.

A review request carries authenticated owner, canonical language, submitted source or a privacy-conscious retained representation, source size/validation metadata, timestamps, status and correlation identifier. Provider/model metadata may be retained when useful and safe. A completed review requires a schema-valid persisted report. A failed review must contain an honest safe failure reason.

### 2.6 Finding taxonomy

**Bug/correctness:** likely incorrect behavior, logic defects, invalid assumptions, unsafe edge cases or failure conditions.

**Security:** potential exposure, injection, authentication/authorization errors, unsafe data handling or cryptographic misuse. Explain exploitability and missing context. Do not call a theoretical concern a confirmed vulnerability without evidence.

**Performance:** algorithmic inefficiency, unnecessary work, resource-heavy patterns or avoidable repeated operations. Avoid generic advice unrelated to the code.

**Code quality/maintainability:** readability, duplication, naming, structure, complexity and maintainable design.

**Improved code:** focused correction or alternative. Explain behavior changes, compatibility assumptions and relevant tests.

Use a consistent severity scale only when supported. Severity is not the same as AI confidence. A report can have no findings; it must not imply certainty.

### 2.7 Report interactions

Users can navigate categories, select a finding, inspect details, jump to a valid location, copy recommendations and copy improved code. Copy actions must use real content and provide real clipboard feedback. Applying a fix into the editor requires explicit confirmation and preserves the original source for comparison. If line mapping is unavailable, do not show a jump action.

### 2.8 Review history

History supports:
- search over safe indexed metadata such as title, language or status; raw source indexing requires a privacy decision;
- language and status filters;
- category/severity filters where supported by report metadata;
- date range filters with timezone-consistent boundaries;
- newest/oldest sorting;
- bounded page size and stable pagination;
- filter reset;
- report navigation;
- deletion with confirmation.

The API enforces owner scope and allowlists sort fields. Search/filter combinations are deterministic. Changing filters resets the cursor/page.

## 3. State model and concurrency

Frontend states distinguish idle, validating, submitting, processing, completed, failed and cancelled only if cancellation is supported. Backend is authoritative. Duplicate submission prevention must exist at UI and API levels where needed. If a user edits while a review processes, the report remains bound to the submitted source revision.

Late responses must not overwrite newer editor state or another report view. Use request identity and stale-response handling. Retries must not create duplicate records unintentionally.

## 4. Data governance

Source code is sensitive user content. Disclose the external AI-provider boundary before submission. Avoid source logging. Determine source/report retention and collect only what is needed. User deletion removes or anonymizes application-controlled data according to a disclosed policy. Do not promise deletion from a third-party provider unless its contract and API support it.

## 5. Desktop interaction model

Primary target is desktop Chrome and Firefox with mouse, keyboard, trackpad and pointer input. Touch gestures are not a requirement. Keyboard accessibility is mandatory.

## 6. Validation rules

Validate client-side for immediate feedback and server-side as authority:
- email format and normalization;
- password policy;
- supported language identifier;
- nonempty source;
- source size and encoding;
- content type;
- review identifier;
- pagination bounds;
- filter and sort allowlists;
- ownership and authorization;
- AI response schema and maximum output size;
- profile/preferences fields if surfaced.

Reject invalid input with actionable field feedback. Never silently truncate or modify source to pass validation.

## 7. Operational controls

Rate-limit authentication, review submission and expensive endpoints. Apply per-user/global concurrency controls. Define AI token budgets and source/output caps. Use MongoDB indexes and bounded queries. Record safe operational metrics and redacted errors. Alert on provider failures, DB outage, high error rates and queue growth if a queue exists.

## 8. Acceptance scenarios

- User with no history sees a real empty state and New Review action.
- Review with no findings displays the actual result plus caveat.
- Provider failure remains failed and offers safe retry only when appropriate.
- Invalid AI output is rejected, not coerced into success.
- User cannot load another user's report by guessing an identifier.
- Nonmatching search produces a no-match state distinct from first-use empty.
- Deleting the last report returns history to its true empty state.
- Reloading a report returns the same persisted analysis, subject to retention.
- Changed editor content is not confused with reviewed source.
- Every report control works with keyboard and pointer.
