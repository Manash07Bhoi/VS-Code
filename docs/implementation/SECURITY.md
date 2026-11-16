# Security Documentation — CodeSense AI

## Authentication and sessions

- Passwords hashed server-side with bcrypt (work factor 12). Plaintext passwords are never stored, logged, or returned.
- Email normalized to lowercase and trimmed; unique constraint enforced at the DB level.
- Generic login/registration errors — no account enumeration (duplicate email returns generic `created: false`).
- Session cookie `cs.sid`: `HttpOnly`, `SameSite` configurable via `COOKIE_SAMESITE` (`lax` for same-site, `none` for cross-site), `Secure` when `SECURE_COOKIES=true` (production; required when `SameSite=None`), 7-day max age.
- Session rotated on login and registration (session fixation resistance).
- Session destroyed and cookie cleared on logout.
- Client-side auth state derived solely from `api.me()` and login success; never read directly from the cookie.

## CSRF

- Double-submit token bound to the server session.
- `GET /api/v1/auth/csrf-token` issues the token.
- State-changing methods (POST/PUT/PATCH/DELETE) require `X-CSRF-Token` matching the session token.
- Safe methods (GET/HEAD/OPTIONS) exempt.
- Token is random (32 bytes hex), generated on first use and stored in the session.

## Authorization (owner scoping)

- Every review query includes `owner: <authenticated user ID>` in the MongoDB predicate.
- Detail, list, and delete operations are all owner-scoped at the database level.
- Cross-user access returns `404` — no IDOR, no enumeration of other users' records.
- Hidden buttons and client-side route guards are not authorization; enforcement is server-side only.

## Rate limiting

| Limiter | Max per window | Window | Key |
|---------|---------------|--------|-----|
| Auth (register/login) | 10 | 60s | IP + email |
| Review submission | 30 | 60s | user ID (authenticated) or IP |
| General | 100 | 60s | IP |

## CORS

- Restricted to `FRONTEND_ORIGIN` (no wildcard with credentials).
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Allowed headers: Content-Type, X-CSRF-Token, X-Requested-With, X-Request-Id, Accept.
- `credentials: true`.

## Security headers (helmet)

- CSP: `default-src 'self'`; script/style from `'self'`, cdnjs, jsdelivr; `worker-src 'self' blob:`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`.
- HSTS (`maxAge: 31536000`, include subdomains, preload).
- Referrer policy: `strict-origin-when-cross-origin`.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff` (via helmet defaults).

## Input validation

- Zod schemas at every trust boundary (auth, review creation, review list query).
- Source: non-empty, UTF-8 byte length <= 64 KiB (API), <= 256 KiB (schema cap). Never silently truncated.
- Language: allowlisted against the backend registry.
- Pagination: `page` >= 1, `limit` 1-100.
- Sort/order fields allowlisted.
- Request body size limit: 256 KB (express.json/urlencoded).

## Source-code privacy

- Submitted source may be transmitted to the external Gemini AI provider for analysis. This is disclosed in the product.
- Source is treated as untrusted data in the AI prompt; the system prompt instructs the model not to obey embedded instructions.
- Full source is not logged by default.
- Secrets/credentials detected in source are noted as a caveat; source is never silently modified.
- No arbitrary code execution of submitted source (out of scope, ADR-008).

## AI provider security

- `GEMINI_API_KEY` kept backend-only; never in frontend bundles or logs.
- Provider responses validated against a strict JSON schema before acceptance.
- Malformed/invalid provider output → failed review, never a fabricated report.
- Provider errors mapped to safe codes; raw provider errors not exposed to clients.
- Timeout and retry bounds configured (`GEMINI_TIMEOUT_MS`, `GEMINI_MAX_RETRIES`).

## Logging

- Structured JSON logs with request IDs.
- Passwords, tokens, session IDs, provider keys, database URIs, and full source are redacted before emission.
- Stack traces logged server-side only (status >= 500); clients receive safe messages.
- Session store errors logged to console (JSON).

## Dependency management

- Lockfile (`package-lock.json`) committed; dependencies from npm registry.
- No known abandoned packages in direct dependencies.
- Secret scanning: `.env` excluded via `.gitignore`; `.env.example` contains names/explanations only.

## Residual risks (documented)

- No live `GEMINI_API_KEY` configured by default → reviews return honest provider-unavailable state (not a defect).
- No email verification or password reset flow (requires a real delivery provider).
- No dedicated account deletion endpoint (review deletion exists; account deletion not yet exposed).
- No brute-force lockout beyond rate limiting (recommended for production hardening).
- Sessions stored in MongoDB; TTL index handles expiration.
