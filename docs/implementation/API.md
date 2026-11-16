# API Contract — CodeSense AI

Base path: `/api/v1`. All responses are JSON. Every response includes `X-Request-Id`. Errors use a consistent envelope:

```json
{ "error": { "code": "<CODE>", "message": "<safe message>", "requestId": "<id>" } }
```

All state-changing endpoints require a valid session cookie (`cs.sid`) and a CSRF token (`X-CSRF-Token`) except where noted.

## Authentication

### POST /auth/register
Create an account. Body: `{ email, password }`. Validated with Zod (email format, password >= 8 chars with letter + number).
- `201 { created: true, user: { id, email }, message }` — account created, session established.
- `201 { created: false, message }` — email already exists (generic; no enumeration).
- `400 { error: { code: 'VALIDATION_ERROR', fieldErrors } }` — invalid input.
- `429 { error: { code: 'RATE_LIMITED' } }` — rate limited.
- CSRF: not required (public endpoint, rate-limited by IP + email).

### POST /auth/login
Verify credentials. Body: `{ email, password }`.
- `200 { user: { id, email }, message }` — session established (rotated).
- `401 { error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password.' } }` — generic failure (no enumeration).
- `429` — rate limited.
- CSRF: not required (public endpoint, rate-limited by IP + email).

### POST /auth/logout
Destroy the server session. Requires `requireAuth` + CSRF.
- `200 { message: 'Signed out.' }` — session destroyed, cookie cleared.

### GET /auth/me
Return the current user. Requires `requireAuth`.
- `200 { user: { id, email, status } }` — safe fields only (no passwordHash).
- `401` — unauthenticated or invalid session.

### GET /auth/csrf-token
Issue/return the session-bound CSRF token. No auth required.
- `200 { csrfToken }` — token string.

## Languages

### GET /languages
Return the public language capability registry. No auth required.
- `200 { languages: [ { canonicalId, displayName, monacoId, reviewEnabled, aiReviewSupported } ] }`
- Five entries: javascript, typescript, python, java, cpp — all `reviewEnabled: true`, `aiReviewSupported: true`.

## Reviews

### POST /reviews
Submit code for review. Requires `requireAuth` + `reviewLimiter` + CSRF + Zod validation.
Body: `{ source, language, title?, clientRequestId? }`.
- `201 { reviewId, status: 'completed', findings, summary, limitationNotice, provider, model, completedAt }` — success.
- `201/502 { reviewId, status: 'failed', failureReason, providerUnavailable: true }` — provider not configured / unavailable (honest failure, never fabricated).
- `400 { error: { code: 'VALIDATION_ERROR', fieldErrors } }` — invalid source/language/title.
- `413 { error: { code: 'PAYLOAD_TOO_LARGE' } }` — source exceeds size cap.
- `401` — unauthenticated.
- `403 { error: { code: 'CSRF_ERROR' } }` — missing/invalid CSRF token.
- `429` — rate limited.

### GET /reviews
List the authenticated user's reviews. Requires `requireAuth`. Query: `page`, `limit` (1-100), `language`, `status`, `sort` (createdAt|updatedAt|language|status), `order` (asc|desc).
- `200 { reviews: [...], total, page, limit }` — owner-scoped only.

### GET /reviews/:reviewId
Get a single review. Requires `requireAuth`. Owner-scoped in the DB query.
- `200 { review: {...} }` — includes source, findings, status, metadata.
- `404` — not found (consistent; does not reveal whether another user's review exists).
- `401` — unauthenticated.

### DELETE /reviews/:reviewId
Delete a review. Requires `requireAuth` + CSRF. Owner-scoped in the DB query.
- `200 { message: 'Review deleted.' }` — deleted.
- `404` — not found (owner mismatch or nonexistent).
- `401` — unauthenticated.
- `403` — CSRF error.

## Health

### GET /health/live
Process liveness. `200 { status: 'ok', service: 'codesense-backend' }`.

### GET /health/ready
Dependency readiness. `200 { status: 'ready', checks: { database, provider } }` or `503 { status: 'not-ready', ... }`. Provider readiness means `GEMINI_API_KEY` and `GEMINI_MODEL` are configured — key value is never disclosed.

## Error codes

| Code | Meaning | HTTP |
|------|---------|------|
| `VALIDATION_ERROR` | Request failed schema validation | 400 |
| `UNAUTHENTICATED` | No valid session | 401 |
| `FORBIDDEN` | CSRF or authorization failure | 403 |
| `NOT_FOUND` | Resource not found (owner-scoped) | 404 |
| `PAYLOAD_TOO_LARGE` | Source exceeds size cap | 413 |
| `RATE_LIMITED` | Rate limit exceeded | 429 |
| `PROVIDER_UNAVAILABLE` | AI provider error (502/504) | 502/504 |
| `INVALID_PROVIDER_RESPONSE` | Provider returned malformed output | 502 |
| `CSRF_ERROR` | Missing/invalid CSRF token | 403 |
| `INTERNAL_ERROR` | Server error (safe message) | 500 |
