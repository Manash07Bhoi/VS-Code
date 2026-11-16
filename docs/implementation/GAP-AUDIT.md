# Gap Audit Register — CodeSense AI

Evidence-based register of findings from the re-audit of source code, documentation, tests, and infrastructure. Severity: Critical / High / Medium / Low.

## Fixed in this release

| ID | Gap | Severity | Evidence | Correction | Verification |
|----|-----|----------|----------|------------|--------------|
| G-FIX-01 | Page modules called `init()`/`load()` at module level, hijacking the initial hash to `#/login` before the router was ready | Critical | `frontend/js/pages/{editor,review,history,register,login,dashboard,settings}.js` had module-level `init();`/`load();` calls | Removed all module-level `init()`/`load()` calls; pages initialize only via `setOnRouteChange` in `main.js` | E2E: initial load stays on landing (`#/`), not `#/login` |
| G-FIX-02 | `register.js` did not call `auth.setUser()` after signup, so `isAuthenticated()` stayed false and `/dashboard`/`/editor` redirected to `/login` | Critical | `frontend/js/pages/register.js` lacked `auth.setUser()` (unlike `login.js`) | Added `auth.setUser({ id: res.user.id, email: res.user.email })` after successful registration | E2E: register → dashboard (not login) |
| G-FIX-03 | `review.js` parsed the review ID from the hash at module import time (empty hash), and the router discards query strings | Critical | `frontend/js/pages/review.js` line 14: `const reviewId = ...window.location.hash...` at module scope | Moved ID parsing into `load()` via `getReviewId()` re-reading `window.location.hash` at call time | E2E: `/review?id=<id>` loads the correct report |
| G-FIX-04 | Account dropdown menu never became visible (inline `display:none` with no CSS `.open` rule), making logout unreachable | Critical | `frontend/index.html` `#nav-account-menu style="display:none"`; no CSS rule for `.open` | Added `#nav-account-menu.open { display: block !important; }` to `css/components.css` | E2E: logout dropdown opens; logout completes |
| G-FIX-05 | `scripts/ensure-indexes.js` referenced in `package.json` (`seed-indexes` script) but did not exist | High | `backend/package.json` script `seed-indexes: node scripts/ensure-indexes.js`; file missing | Created `backend/scripts/ensure-indexes.js` (idempotent index creation) | Script runs without error; creates all model indexes |

## Remaining (documented limitations, not defects)

| ID | Gap | Severity | Evidence | Reason / Disposition |
|----|-----|----------|----------|----------------------|
| G-LIMIT-01 | No valid `GEMINI_API_KEY` configured; live AI analysis cannot be tested | Critical | `backend/.env` has placeholder key; `tests/setup.js` uses `test-key` | External credential required. Provider-unavailable state is shown truthfully (not fabricated). Documented in README and AI-PROVIDER.md |
| G-LIMIT-02 | MongoDB not available as a system service; must run manually (mongod 8.0.6 binary on 27017) | High | `mongod` not installed system-wide; binary at `/tmp/mongodb-linux-x86_64-ubuntu2204-8.0.6/bin/mongod` | Backend fails fast without `MONGODB_URI`. Documented in README startup instructions |
| G-LIMIT-03 | E2E test run on Chromium only; Firefox not yet automated | Medium | Puppeteer configured for Chromium; Firefox ESR 153 installed | Firefox available for manual testing; E2E automation on Firefox is a future enhancement |
| G-LIMIT-04 | No email verification / password reset flow | Medium | No such routes in `backend/src/modules/auth/routes.js` | Requires a real email delivery provider; explicitly out of scope (PRD non-goals: no fake features) |
| G-LIMIT-05 | No dedicated account deletion endpoint | Medium | Review deletion exists (`DELETE /reviews/:id`); account deletion not implemented | Account deletion would cascade to reviews; deferred as post-MVP |
| G-LIMIT-06 | No brute-force account lockout beyond rate limiting | Medium | `authLimiter` caps at 10/window but no progressive lockout | Rate limiting is implemented; progressive lockout is a production hardening recommendation |
| G-LIMIT-07 | No `scripts/backup-restore.js` or automated backup procedure | Medium | Not implemented | Documented as deployment-time requirement in DATABASE.md |
| G-LIMIT-08 | Keyboard accessibility partially verified (dashboard/history items have tabindex+keydown; Monaco keyboard access noted as limitation) | Low | `frontend/js/pages/dashboard.js`, `history.js` have keyboard handlers | Core flows are keyboard-navigable; Monaco-specific keyboard access is a known Monaco limitation |

## Verification method

Each fix is verified by: (1) source inspection, (2) backend test suites (auth/languages/reviews all PASS), (3) E2E browser journey (all checks pass), (4) direct API verification (all 5 languages accepted, honest provider failure).
