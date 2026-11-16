# REST API Specification — CodeSense AI

This document defines the intended HTTP contract. Arena must reconcile paths, fields and status codes with implementation before release. Do not document an endpoint as available until it exists and is tested.

## 1. Conventions

- HTTPS in production.
- JSON requests/responses unless a defined exception exists.
- Secure session or token auth defined by `SECURITY.md`.
- One consistent API prefix; version if needed.
- Server-side schema validation at all input boundaries.
- Consistent machine-readable error code, safe message, request ID and field details.
- Bounded pagination, stable sorting and validated page/cursor.
- ISO-8601 UTC on the wire; render in browser locale with explicit timezone handling.
- Opaque IDs; client owner IDs are never authorization.

## 2. Authentication endpoints

**POST registration:** create account and establish/initiate secure session. Validate credentials, limits and uniqueness. Never return password hash.

**POST login:** verify credentials, apply throttling and establish a secure session. Use generic credential errors.

**POST logout:** invalidate server-side session/refresh material; be idempotent where possible.

**GET current user:** return safe profile/preferences; never return hash, token or provider configuration.

Password reset and email verification endpoints are out of scope unless a genuine mail provider and complete secure flow exist.

## 3. Review endpoints

**POST create review:** authenticated request includes canonical language ID and source, with optional title only if supported. Backend validates, checks limits and creates lifecycle state. Response reflects real state and ID; it must not contain fake results.

**GET list reviews:** returns only owner's records; supports validated pagination, safe metadata search, language/status/category/date filters and allowlisted sort. Bound all parameters. Never accept raw MongoDB operators or arbitrary field names.

**GET review by ID:** returns actual report and source metadata according to retention policy. Enforce owner scope in database query.

**DELETE review by ID:** removes owner-owned report and app-controlled artifacts according to retention policy. Confirm deletion before success response.

**Optional status/cancel endpoint:** include only for genuine asynchronous/cancellable work; response must reflect persisted backend state.

## 4. Preferences endpoints

Create read/update endpoints only for preferences persisted server-side. Validate allowed values and reject unknown fields. Do not accept a browser-supplied user ID as target identity.

## 5. Notifications endpoints

Create list/read endpoints only when persisted notification events exist and correspond to real review/account events. Otherwise omit the endpoints and use inline status feedback.

## 6. Response and error model

Define consistent success/error envelopes. Distinguish validation, authentication, authorization, not-found, conflict, rate limit, payload too large, provider unavailable, timeout, database unavailable and unexpected internal failure. Public messages do not reveal secrets, provider payloads, stack traces or DB details.

Use correct HTTP semantics, request IDs and safe diagnostic logs. Validation responses identify fields without echoing complete source code.

## 7. Endpoint security

Every protected endpoint authenticates and authorizes server-side. List/detail/delete enforce ownership. Apply body-size and content-type limits, auth/review rate limits, explicit CORS and CSRF if cookie auth is used. Never accept provider keys, database URIs or internal hosts from browser input.

## 8. Contract maintenance

Keep schemas/status codes/descriptions aligned with route code. Use OpenAPI where useful, but avoid a spec that diverges from tested behavior. Contract tests verify required/invalid input, auth, ownership and provider error propagation.
