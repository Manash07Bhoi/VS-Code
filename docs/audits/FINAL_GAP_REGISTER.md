# Final Gap Register — CodeSense AI

**Evidence-based register of findings and limitations.** Severity: Critical / High / Medium / Low.
**Source of truth:** `docs/implementation/GAP-AUDIT.md` (detailed fix history).

---

## Fixed in this release

| ID | Gap | Severity | Correction | Verification |
|----|-----|----------|------------|--------------|
| G-FIX-01 | Page modules called `init()`/`load()` at module level, hijacking the initial hash | Critical | Removed module-level calls; pages initialize via `setOnRouteChange` in `main.js` | E2E: initial load stays on landing |
| G-FIX-02 | `register.js` did not call `auth.setUser()` after signup | Critical | Added `auth.setUser()` after successful registration | E2E: register → dashboard |
| G-FIX-03 | `review.js` parsed review ID at module import time (empty hash) | Critical | Moved ID parsing into `load()` via `getReviewId()` | E2E: `/review?id=<id>` loads correctly |
| G-FIX-04 | Account dropdown never visible (no `.open` CSS rule) | Critical | Added `#nav-account-menu.open { display: block }` to CSS | E2E: logout dropdown opens; logout completes |
| G-FIX-05 | `scripts/ensure-indexes.js` referenced but missing | High | Created idempotent index creation script | Script runs without error |
| G-FIX-06 (this release) | CSRF token invalidated by session regeneration on login/register | Critical | Backend: issue + return fresh `csrfToken` after regenerate. Frontend: apply returned token + centralized 403 retry | `tests/reviews.test.js`: stale token → 403, fresh token → accepted |
| G-FIX-07 (this release) | Gemini retry/deadline had dead code + final-attempt backoff | Critical | Restructured retry: final attempt throws immediately, no backoff; transient-only retry; timer cleanup | `tests/provider.test.js`: 15/15 pass |
| G-FIX-08 (this release) | Tests hit real Gemini network with fake `test-key` | Critical | Removed fake key from `tests/setup.js`; deterministic mocked provider tests | `npm test`: 18/18 pass, no network |
| G-FIX-09 (this release) | Jump-to-source showed toast instead of navigating | High | review.js carries source+line to editor; editor.js highlights/jumps to line | Syntax-verified; logic traced |
| G-FIX-10 (this release) | Password visibility toggles had no JS handler | Medium | Added show/hide toggle with aria-label to register and login | Syntax-verified |

---

## Remaining limitations (documented, not defects)

| ID | Gap | Severity | Disposition |
|----|-----|----------|-------------|
| G-LIMIT-01 | No valid `GEMINI_API_KEY`; live AI analysis cannot be tested | Critical | External credential. Provider-unavailable state shown truthfully. Documented in README + AI-PROVIDER.md |
| G-LIMIT-02 | MongoDB not a system service; run `mongod` manually | High | Backend fails fast without `MONGODB_URI`. Documented in README |
| G-LIMIT-03 | E2E automated on Chromium only; Firefox not automated | Medium | Firefox ESR installed for manual testing |
| G-LIMIT-04 | No email verification / password reset | Medium | Requires real email provider; out of scope (no fake features) |
| G-LIMIT-05 | No account deletion endpoint | Medium | Deferred as post-MVP; cascades to reviews |
| G-LIMIT-06 | No progressive lockout beyond rate limiting | Medium | Rate limiting implemented; lockout is production hardening |
| G-LIMIT-07 | No backup-restore script | Medium | Documented as deployment-time requirement in DATABASE.md |
| G-LIMIT-08 | Keyboard accessibility partially verified | Low | Core flows keyboard-navigable; Monaco limitation noted |
| G-LIMIT-09 (this release) | Live cross-origin deployment not performed | High | Blocked: no Netlify site ID / backend host. Cookie architecture code-verified. |
| G-LIMIT-10 (this release) | Lighthouse / production E2E not run | Medium | Blocked: requires live deployment + working browser in CI |

---

## Verification method

Each fix verified by: source inspection, backend test suites (18/18 pass), direct API verification (all 5 languages accepted, honest provider failure), and frontend syntax checks. Browser E2E is blocked in this sandbox (Chromium cannot launch reliably) but was previously validated end-to-end.
