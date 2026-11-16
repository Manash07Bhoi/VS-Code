# Regression Report — CodeSense AI

**Date:** 2026-11-16 (workbench release)
**Baseline:** `22ea434` — historical claim: 18/18 backend tests passing (15 deterministic mocked provider tests + auth/languages/reviews suites).

## Reproduced baseline

- `22ea434` locally (MongoDB 8.0.4, Node 24): **18/18 passing** — the historical claim reproduces on a machine where the four test files happen not to collide.
- On GitHub Actions (all 20 historical CI runs): **backend tests failed** on every run — an intermittent auth 401 that had never been root-caused (see below).

## Root cause of the historical CI failures (proven)

`node --test` runs each test file as a **concurrent** separate process. All files shared ONE database (`codesense_ai_test`) and each called `dropDatabase()` during setup. A concurrently starting sibling file wiped the active file's users/sessions mid-flight.

**Proof of mechanism** (executed against the baseline code): register + login, then drop the shared database, then `GET /api/v1/auth/me` → exactly the CI-observed `401 {"code":"UNAUTHENTICATED","message":"Authentication required."}` within the same millisecond pattern. Fix: each file derives a unique per-file database name (`tests/setup.js`); `stop()` also drops its own database.

This is why the failure was environment-dependent: runner core count/timing decided whether the drop landed inside another file's window.

## Current state after the release changes

| Suite | Result |
|---|---|
| Backend (`npm test`: auth, languages, reviews, provider, assist) | **19 tests across 5 test files / all passing** (a previous revision of this report mislabeled this as "19 files" — the accurate count is 19 tests in 5 files) |
| ESLint | **0 errors** (14 pre-existing style warnings) |
| Frontend syntax (`node --check` all modules incl. workbench) | pass |
| Puppeteer E2E (`tests/e2e.js`, 29 checks, real browser + backend) | **all checks passed** (one environment-SKIP: Monaco tsWorker CDN fetch is sandbox-blocked; CI exercises it) |
| Playwright responsive QA (7 tests, 5 viewports) | **7/7 passed** (evidence in PLAYWRIGHT_REPORT.md) |
| Secret scan | clean |
| `npm audit` | **0 vulnerabilities** |

## Behavior-preserving verifications

- **zod v3 → v4 migration**: missing-field and invalid-field messages verified byte-identical (`"Email is required."`, `"Enter a valid email address."`, …) — the v4 `error` param replaces v3's ignored `required_error`.
- **bcrypt 5 → 6**: hash format `$2b$` cost 12 unchanged; compare round-trip verified; auth suite green.
- **mongoose 8 → 9** (Dependabot #3): the only incompatibility was a no-op `pre('save')` hook using the removed async-callback style; it was removed (it did nothing) and the full suite passes.
- **puppeteer 22 → 25** (Dependabot #4): `headless: 'new'` → `headless: true`, obsolete `--single-process` dropped, browser executable auto-detected; e2e suite green.
- **Session flow restructure**: register/login now write all session fields before one save; the auth suite (register → duplicate → wrong password → login → /me → logout → replay) passes unchanged.

## Defects fixed during this release (all found by evidence, not speculation)

1. Concurrent test-file database race (root cause above) — CI had never been green.
2. Session persistence relied on post-save mutation + implicit auto-save (fragile pattern) — canonical single-save flow.
3. Logout cleared a nonexistent `connect.sid` cookie instead of `cs.sid`.
4. CI frontend syntax step referenced `frontend/tests/e2e.js` (path never existed) — masked by earlier failures.
5. CI secret scan matched variable names (`csrfToken`), test fixtures and lockfile package names — replaced with a real-pattern scanner.
6. CI e2e job used a preinstalled `mongod` that no longer exists on runner images — now a mongo service container.
7. `wb-welcome` CSS `display:flex` overrode the `hidden` attribute, invisibly covering the editor and swallowing clicks.
8. Monaco swallowed workbench shortcuts (Ctrl+Shift+A et al.) — shortcuts now registered in the capture phase.
9. Static assets were rate-limited (broke app boot; see PLAYWRIGHT_REPORT.md).
10. Bottom-panel resizer was positioned against the wrong containing block (fixed via `position: relative`).


---

## Re-verification — brand + security hardening release (2026-11-16, second pass)

All suites re-run locally after the brand integration and security hardening changes
(MongoDB 8.2.6 via in-memory instance, Node 24, backend on 127.0.0.1:3100):

| Suite | Result |
|---|---|
| Backend ESLint | **0 errors** (14 pre-existing style warnings, unchanged) |
| Backend tests (`npm test`) | **19 tests / 5 files, 19 pass / 0 fail** |
| Frontend syntax (`node --check`, all modules incl. workbench) | pass |
| Puppeteer E2E (`tests/e2e.js`, 29 checks) | **28 ok + 1 environment-skip** (Monaco tsWorker CDN fetch sandbox-blocked; same honest skip as before) |
| Playwright responsive QA (7 tests, 5 viewports) | **7/7 passed** (42.7 s; screenshots regenerated with the integrated brand logo) |
| `npm audit` | **0 vulnerabilities** |

Changes covered by this re-verification: official Concept 01 brand assets integrated
(favicon.ico, PNG favicons, apple-touch-icon, PWA manifest + 192/512 icons, OG/Twitter
social preview, logo image in navbar/sidebar/landing/auth/titlebar/welcome/boot splash),
PWA manifest + sitemap.xml + robots.txt sitemap reference, timing-safe CSRF token
comparison, logout cookie-clear attributes now mirror the session cookie config,
`String.replace` replacement-pattern hardening in the Gemini prompt builder, per-IP
auth rate limiter (`RATE_LIMIT_MAX_AUTH_IP`, default 60/min) on top of the per-(ip,email)
limiter, removal of the unused `CSRF_SECRET` config knob, `server.js` PORT/HOST read from
the validated env module, frontend fixes (history pagination null-pointer, 404 route
fallback, `renderError` no longer destroys Retry buttons, dead controls wired or removed,
per-activation data refresh for dashboard/review/history, live indentation in the status
bar, dead legacy `js/app/monaco.js` removed).
