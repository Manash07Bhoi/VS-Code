# Changelog — CodeSense AI

## Unreleased (this release)

### Added
- Complete backend: Express app, auth routes (register/login/logout/me/csrf-token), review routes (create/list/get/delete), languages route, health endpoints
- Complete frontend: SPA shell, all pages (landing/register/login/dashboard/editor/review/history/settings/404), Monaco Editor, router, API client, auth state, components (toast/modal/navbar)
- MongoDB models: User, Review with owner-scoped indexes
- Gemini provider adapter with timeout, retry, schema validation, prompt-injection resistance, honest failure handling
- Zod validation schemas at every trust boundary
- Secure cookie sessions with rotation on login/registration, CSRF double-submit protection
- Rate limiting (auth/review/general), helmet security headers, CORS restricted to frontend origin
- Backend test suites: auth, languages, reviews (all passing)
- E2E browser test: full journey (all checks passing)
- Five-language support: JavaScript, TypeScript, Python, Java, C++ (all verified at API level)
- `scripts/ensure-indexes.js` for idempotent MongoDB index creation
- `.gitignore` excluding secrets, dependencies, logs, caches
- Comprehensive documentation (README, architecture, API, database, security, AI provider, five languages, traceability, gap audit, testing, deployment, changelog)
- Original materials preserved: `presentation.pptx`, both documentation ZIPs

### Fixed
- Page modules no longer call `init()`/`load()` at module level (prevented router hash hijack to `#/login`)
- Registration now calls `auth.setUser()` so the user is authenticated after signup (prevents redirect loop to `/login`)
- Review ID is parsed from the hash at load time (not module import time) so `/review?id=<id>` loads the correct report
- Account dropdown CSS rule added so the logout button is reachable
- E2E logout step opens the dropdown via `element.click()` for headless reliability

### Changed
- `README.md` rewritten from a 2-byte placeholder to a complete project document
- `frontend/js/main.js` imports corrected to `./app/*` and `./components/*` paths
- `frontend/js/auth.js` fixed to valid `export const auth = { ... }` syntax

### Removed
- Module-level `init()`/`load()` calls from all page modules
- Duplicate `authRoutes` mount in `app.js`
- Invalid `export { auth: { ... } }` syntax

### Limitations (documented)
- No valid `GEMINI_API_KEY` configured → provider-unavailable state shown honestly
- MongoDB must be running manually (mongod 8.0.6 on 27017)
- E2E automated on Chromium only; Firefox available for manual testing
- No email verification, password reset, or account deletion endpoint
- No brute-force lockout beyond rate limiting


## 2026-11-16 — Brand integration & security hardening release

### Added
- Official Concept 01 brand kit integrated: favicon.ico + PNG favicons, apple-touch-icon,
  PWA manifest (`manifest.webmanifest`) with 192/512 icons, Open Graph + Twitter social
  preview (og-image-1200x630.jpg), logo images (with `srcset` high-DPI variants) in the
  navbar, sidebar, landing, login/register cards, workbench title bar, welcome screen
  and a branded boot splash.
- `sitemap.xml` (public routes only) and a `Sitemap:` reference in `robots.txt`.
- Per-IP authentication rate limiter (`RATE_LIMIT_MAX_AUTH_IP`, default 60/min) chained
  ahead of the per-(ip,email) limiter to bound credential stuffing.
- This release's QA evidence: 6 Lighthouse reports, regenerated Playwright screenshots,
  updated testing reports and gap register.

### Fixed
- History page: null-pointer on the nonexistent `#history-page` element broke rendering
  for any account with reviews; page info now shows "Page X of Y".
- Router: unknown hash routes now fall back to the 404 view instead of a blank screen.
- Dashboard/History/Review: `renderError()` no longer destroys the Retry buttons;
  data refreshes on every view activation (stale review/dashboard content fixed).
- All previously dead controls wired (empty-state buttons, clear-match, error retry,
  account menu email) and dead DOM regions populated (`dashboard-count`, page info).
- Status bar shows the live indentation value instead of a hardcoded "Spaces: 4".
- Backend: timing-safe CSRF token comparison; logout cookie-clear attributes mirror the
  session cookie configuration; Gemini prompt templating immune to `$&`/`` $` ``/`$'`
  replacement patterns; `server.js` reads PORT/HOST from the validated env module.

### Removed
- Dead legacy module `frontend/js/app/monaco.js`, no-op code paths, debug console logs,
  and the unused `CSRF_SECRET` configuration knob (env, examples, tests, CI).
