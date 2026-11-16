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


---

## Second pass — brand integration & security hardening (2026-11-16)

Findings identified by full frontend/backend re-inspection and fixed in this pass:

| ID | Component | Finding | Severity | User impact | Root cause | Fix | Verification |
|---|---|---|---|---|---|---|---|
| BR-01 | Brand | Official Concept 01 assets entirely unintegrated (text-only "CS" mark, no favicon.ico/PWA/OG) | High | No brand identity; broken social previews | Brand ZIP never extracted into the app | Full kit integrated: favicon.ico + PNG favicons, apple-touch-icon, PWA manifest + 192/512 icons, OG/Twitter tags + og-image, logo image in navbar/sidebar/landing/auth/titlebar/welcome/boot splash with srcset | curl 200 on all assets; VLM visual QA; Lighthouse SEO 100 |
| FN-01 | History page | `#history-page` element referenced but never existed -> TypeError on every non-empty history render | High | History list broken for any user with reviews | Element renamed in HTML, JS not updated | Update `history-page-info` text with "Page X of Y" | Puppeteer E2E + manual browser check |
| FN-02 | Router | Unknown hash routes showed a blank screen (no 404 view) | Medium | Dead ends for typos/old links | Route lookup used path slice, not the ROUTES map | `ROUTES[path] \|\| '404'` fallback | Browser check `#/nonexistent` |
| FN-03 | Dashboard/History/Review | `renderError()` used `textContent` on containers that hold Retry buttons, destroying them on first error | Medium | Retry buttons disappeared after an error | Container vs message element confusion | Update only the message `<p>`/span | Code review + E2E |
| FN-04 | Dashboard/History/Review | Data loaded only on first view init; revisits and changed ids (`#/review?id=X`) showed stale content | Medium | Stale data; wrong review shown | Init-once wiring in main.js | Per-activation refresh + `codesense-view:*` events | Browser check with two review ids |
| FN-05 | Dead controls | `history-empty-new-review`, `history-clear-match`, `history-error-retry`, `btn-empty-new-review` buttons unwired; `nav-menu-email`/`nav-menu-role`/`dashboard-count`/`history-page-info` never populated | Medium | Buttons did nothing; empty UI regions | Elements added to HTML without handlers | All wired or populated; dead listeners removed | Code review + E2E |
| FN-06 | Status bar | "Spaces: 4" hardcoded despite changeable indentation | Low | Status lied after changing indentation | No state tracking for tabSize | `editorGroup.getIndentation()` tracks live value; command updates it | E2E status-bar check |
| FN-07 | Dead code | Legacy `js/app/monaco.js` (broken worker URL, imported by nothing), no-op `if` in editorGroup, dead `updateProblemsStatus()`, unused `renderUnauthorized`, debug `console.log`s | Low | Confusion; maintenance risk | Leftovers from the single-file editor era | Removed / wired `renderUnauthorized` for 403 | `node --check` all modules; lint 0 errors |
| SC-01 | Backend CSRF | Token comparison used `!==` (non-constant-time) | Medium | Theoretical timing side channel | Simple string compare | `crypto.timingSafeEqual` with length pre-check | Backend tests 19/19 (CSRF cases included) |
| SC-02 | Backend logout | `clearCookie` hardcoded `sameSite:'lax'` and omitted `COOKIE_DOMAIN` | Medium | Cookie not cleared in cross-site deployments | Cookie-clear attributes didn't mirror session cookie config | Reads `COOKIE_SAMESITE`/`SECURE_COOKIES`/`COOKIE_DOMAIN` from env | Code review; auth suite green |
| SC-03 | Gemini prompts | `String.replace('${SOURCE}', source)` treats `$&`, `` $` ``, `$'` in user source as replacement patterns | Low | Corrupted prompts for sources containing those sequences | Replacement-string semantics | Replacer-function form `() => source` | Provider adapter tests (15/15) |
| SC-04 | Rate limiting | Auth limiter keyed `ip:email` only: one IP spraying many emails got a fresh bucket per email | Medium | Unbounded aggregate credential stuffing | Keying choice | Added per-IP `authIpLimiter` (`RATE_LIMIT_MAX_AUTH_IP`, default 60/min) chained before the per-(ip,email) limiter | Backend tests; e2e suites (limiter raised in test env) |
| SC-05 | Config | `CSRF_SECRET` parsed and documented but never consumed | Low | Misleading configuration surface | Dead knob from an earlier design | Removed from env.js, both `.env.example` files, tests, CI env | Lint + tests + CI config grep |
| SEO-01 | SEO/PWA | No Open Graph/Twitter cards, no PWA manifest, no sitemap, no canonical | Medium | Poor link previews; no installability | Never implemented | OG/Twitter meta + og-image, manifest.webmanifest (paths adjusted from the kit), sitemap.xml (public routes only), robots.txt sitemap line | Lighthouse SEO 100 |
| LH-01 | Images | 24px logo PNG served at 28px CSS size -> `image-size-responsive` BP fail | Low | Flagged best practice | Undersized source | 48px source + `srcset` 128/256px 2x variants | Lighthouse BP 0.93 -> 0.96, audit clean |

**Accepted / documented (not fixed):**
- BP 0.96 `errors-in-console`: anonymous `/auth/me` boot-check legitimately 401s (API contract kept intentionally).
- Monaco tsWorker CDN dependency: in restricted networks (this sandbox) TS diagnostics cannot load; the Problems panel labels its sources and the e2e suite records an honest SKIP. CI with CDN access exercises it fully.
