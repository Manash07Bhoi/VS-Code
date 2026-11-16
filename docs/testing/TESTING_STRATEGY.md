# Testing Strategy — CodeSense AI

**Updated:** 2026-11-16

## Layers

| Layer | Tooling | Where | What it proves |
|---|---|---|---|
| Unit (provider) | `node:test` + injected fake `genAI` transport | `backend/tests/provider.test.js` (15 tests) | Retry/deadline/abort semantics, response validation, error mapping — deterministic, no network, no key |
| Unit (assist) | same pattern | `backend/tests/assist.test.js` (11 tests) | explain/improve parsing, sanitization, route auth/validation/CSRF/provider-unavailable |
| Integration (API) | `node:test` + supertest + real MongoDB | `auth/languages/reviews` test files | Full HTTP behavior: registration/login/logout flows, session persistence, CSRF enforcement, owner-scoped review CRUD, honest provider-unavailable path |
| Static analysis | ESLint 9 flat config | `npm run lint` | 0 errors (style warnings are pre-existing and tracked) |
| Syntax gates | `node --check` | CI over every frontend JS module | No syntax regressions ship |
| E2E (puppeteer) | `tests/e2e.js` (29 checks) | CI `frontend-e2e` job | Real browser against the real backend: register → dashboard → workbench (activity bar, tabs, status bar, Monaco typing, save semantics, palette execution, problems panel, honest AI/terminal states) → history → logout |
| E2E (Playwright) | `tests/responsive.spec.js` (7 tests) | CI `browser-qa` job | The five required viewports (360×800, 390×844, 768×1024, 1366×768, 1920×1080): workbench usability, no horizontal overflow on mobile, palette, honest terminal state, theme toggle, auth boundaries, generic invalid-credential error |
| Secret scan | `scripts/secret-scan.sh` | CI | Real credential value patterns + hardcoded credential assignments |

## Test isolation (fixed this release)

`node --test` executes each test file as a separate concurrent process. Each file now derives a **unique database name** from its own path — previously all files shared one database and dropped it during setup, so a concurrently starting sibling could wipe another file's users/sessions mid-flight. That race was the long-undiagnosed cause of CI-only intermittent auth 401s (proven by targeted reproduction: dropping the shared DB between login and `/me` yields exactly the observed failure).

## Determinism rules

- No test ever talks to Gemini (no key in test env → honest provider-unavailable path is asserted instead).
- No timing-based assertions; readiness is gated on the `__CODESENSE_READY` bootstrap marker.
- Fresh registered accounts per browser test run; localStorage isolated per Playwright context.

## CI composition (`.github/workflows/ci.yml`)

1. `lint-and-test` — backend deps → lint → tests (mongo service) → audit (reported) → frontend syntax checks → secret scan.
2. `browser-qa` — Playwright Chromium with deps, real backend, 5-viewport suite, evidence upload (screenshots + HTML report, 14-day retention).
3. `frontend-e2e` — puppeteer flow on push to main (mongo service; auto-detected browser executable).

Failures at any step fail the workflow. Evidence artifacts are uploaded on every run.

## What is deliberately NOT claimed

- No Lighthouse audit has been executed in this environment (see `LIGHTHOUSE_REPORT.md` for the blocker and how to run it) — no invented scores.
- The Monaco TS-worker diagnostics path is exercised in CI (unrestricted network); in the release sandbox the CDN worker fetch is network-blocked and the check honestly reports SKIP.
