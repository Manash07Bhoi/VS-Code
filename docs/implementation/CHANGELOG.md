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
