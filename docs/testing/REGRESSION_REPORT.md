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
| Backend (`npm test`: auth, languages, reviews, provider, assist) | **19 files / all passing** (18 historical tests + 11 new assist tests) |
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
