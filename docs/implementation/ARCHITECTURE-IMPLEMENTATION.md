# Implementation Architecture — CodeSense AI

This document describes the actual implemented architecture. It matches the source code in `backend/` and `frontend/`.

## Trust boundaries

1. **Browser client** — hosts Monaco, performs usability validation, submits requests. Not trusted for authorization, secrets, quotas, or data ownership.
2. **Backend (Node.js/Express)** — authenticates users, validates requests, applies limits, coordinates review workflows, calls the AI provider, stores results. Owns auth, authorization, persistence, validation, quotas, and provider requests.
3. **External dependencies** — MongoDB and the Gemini AI provider. Availability and response quality are not guaranteed; failures are handled honestly.

## Directory layout

```
backend/
  server.js              # Entry point: fail-fast env validation, DB connect, graceful shutdown
  src/app.js             # Express composition: helmet, CORS, sessions, rate limiting, static, routes
  src/config/env.js      # Environment validation (fail-fast) + typed config
  src/config/database.js # Mongoose connection owner; readiness tracking
  src/config/languages.js# Authoritative five-language capability registry
  src/middleware/auth.js # requireAuth, optionalAuth, alreadyAuthenticated
  src/middleware/csrf.js # Double-submit CSRF token bound to session
  src/middleware/rateLimit.js # authLimiter, reviewLimiter, generalLimiter (module-load hoisted)
  src/middleware/validation.js # Zod schema validation middleware
  src/middleware/error.js # Central error handler (safe envelopes, no stack to client)
  src/middleware/requestId.js # X-Request-Id correlation
  src/models/User.js     # Mongoose schema: email (unique), passwordHash, status, timestamps
  src/models/Review.js   # Mongoose schema: owner, language, source, findings, status, indexes
  src/modules/auth/routes.js   # POST /register, /login, /logout; GET /csrf-token, /me
  src/modules/health/routes.js # GET /live, /ready
  src/modules/languages/routes.js # GET / (public language view)
  src/modules/reviews/routes.js # POST /, GET /, GET /:id, DELETE /:id (all owner-scoped)
  src/providers/gemini.js      # Gemini adapter: prompt, timeout, retry, schema validation, error mapping
  src/providers/base.js        # Provider adapter interface
  src/repositories/userRepository.js # createUser, findByEmail, findById, updateLastAuthenticated
  src/repositories/reviewRepository.js # Owner-scoped create, find, list, delete, update
  src/services/reviewService.js    # submitReview, getReview, providerAdapter (orchestration)
  src/utils/crypto.js      # bcrypt hash/compare (work factor 12)
  src/utils/logger.js      # Redacted structured JSON logging
  src/validators/schemas.js # Zod schemas: register, login, createReview, listReviews
  tests/                  # auth.test.js, languages.test.js, reviews.test.js, setup.js
```

```
frontend/
  index.html          # SPA shell: all views (landing, register, login, dashboard, editor, review, history, settings, 404)
  css/tokens.css      # Design system tokens (dark-first, violet/indigo)
  css/base.css        # Base styles: views, cards, buttons, badges, inputs
  css/components.css  # Component styles: toast, modal, navbar, pagination
  css/pages.css       # Page-specific styles
  js/main.js          # SPA bootstrap: views, navbar, router, auth state, route activation
  js/app/api.js       # API client: credentials, CSRF token, error normalization
  js/app/auth.js      # Client auth state: setUser, getUser, isAuthenticated, subscribe
  js/app/router.js    # Hash-based router; protected routes redirect to /login
  js/app/state.js     # Central app state store
  js/app/monaco.js    # Monaco Editor integration (CDN load, lifecycle, dispose)
  js/components/toast.js  # Toast notifications (+ toast namespace export)
  js/components/modal.js  # Modal dialog (open/close, Escape, overlay click)
  js/components/navbar.js # Navbar: auth-aware render, account dropdown, logout
  js/pages/register.js  # Registration form + double-submit guard
  js/pages/login.js     # Login form; sets auth state on success; return-to
  js/pages/dashboard.js # Dashboard: empty state, New Review, recent reviews
  js/pages/editor.js    # Monaco editor, language selection, Analyze action
  js/pages/review.js    # Review report detail: findings, source, delete, copy
  js/pages/history.js   # History: filters, sort, pagination, deletion
  js/pages/settings.js  # Account settings: email, status, logout
```

## Data flow — review lifecycle

1. User submits source + language from the editor (Monaco).
2. Frontend validates non-empty source and size (<= 64 KiB) client-side.
3. Backend `POST /api/v1/reviews` (requireAuth + reviewLimiter + csrfMiddleware + Zod validation):
   - Authenticates via session (`req.auth.userId`).
   - Validates language against the registry (`isReviewEnabled`).
   - Validates source non-empty and within size cap (never silently truncates).
   - Creates a persisted review record with status `accepted`, source digest (SHA-256), correlation ID.
   - Calls the Gemini adapter from the backend only (API key never in browser).
   - On provider success: validates output against strict schema, normalizes findings, persists `completed` result.
   - On provider failure: persists `failed` status with honest `failureReason`; never fabricates.
4. Frontend navigates to `/review?id=<reviewId>` to view the report.
5. History: `GET /api/v1/reviews` returns owner-scoped, paginated, filterable results.

## Session model

- Server-managed opaque session (`express-session` + `connect-mongodb-session`).
- Cookie name: `cs.sid`; `HttpOnly`, `SameSite=Lax`, `Secure` when `SECURE_COOKIES=true`.
- Session rotated on login and registration (session fixation resistance).
- Destroyed on logout; cookie cleared.
- Client-side `auth.isAuthenticated()` is derived solely from `api.me()` / login success — never from the cookie directly.

## CSRF

- Double-submit token bound to the session.
- `GET /api/v1/auth/csrf-token` issues the token.
- State-changing methods (POST/PUT/PATCH/DELETE) require `X-CSRF-Token` header matching the session token.
- Safe methods (GET/HEAD/OPTIONS) are exempt.

## Rate limiting

Three independent limiters (created once at module load):
- `authLimiter`: 10 requests/window (keyed by IP + email for auth endpoints).
- `reviewLimiter`: 30 requests/window (keyed by user ID when authenticated, IP otherwise).
- `generalLimiter`: 100 requests/window (keyed by IP).

## Security headers (helmet)

- CSP: script/style from self + cdnjs/jsdelivr; connect-src self + frontend origin; object-src none; base-uri self; form-action self.
- HSTS, referrer policy `strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

## Monaco Editor lifecycle

- Lazy-loaded from CDN on first editor initialization.
- `window.MonacoEnvironment.getWorkerUrl` points to the CDN for web workers.
- `automaticLayout: true`; theme `vs-dark`; word wrap on.
- Language set via `monaco.editor.setModelLanguage`.
- Source changes update `state.source` and `unsavedChanges`.
- Editor disposed on teardown; listeners removed.

## Synchronous review model

Reviews are synchronous with a bounded provider timeout (`GEMINI_TIMEOUT_MS`, default 60s). No durable queue or background workers are used. This is a documented MVP decision (ADR-006); provider latency and hosting constraints make a bounded sync request acceptable for this release.
