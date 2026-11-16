# Testing, Debugging and End-to-End Verification Plan

## 1. Principles

Test behavior at the correct boundary. Unit tests do not prove a complete journey. A build does not prove the browser can authenticate, call the API, persist a report and retrieve it after restart. Never fabricate test output or use canned production data.

## 2. Test layers

**Static checks:** formatting, lint, dependency integrity, secret scan, prohibited-marker scan, HTML/CSS checks and build.

**Unit tests:** validators, state transitions, language allowlist, report normalization, provider error mapping, ownership query construction, sort allowlist, pagination and UI state helpers.

**Backend integration:** isolated test DB; registration uniqueness, password verification, throttling, session lifecycle, review creation, schema validation, provider adapter, persistence, search/filter/sort, deletion, limits and dependency outage.

**Frontend tests:** route guards, form validation, error states, Monaco init/failure, submission state, duplicate prevention, report rendering, copy behavior, history filters/sort/pagination, delete confirmation and keyboard interaction.

**End-to-end:** automate desktop Chrome and Firefox through browser/backend/test database. Use provider stubs only for deterministic contract tests where live provider is unsuitable; clearly label. Run a separate real-provider smoke test when credentials and policy permit. A passing stub test does not prove live provider availability.

## 3. Critical E2E scenarios

1. Register test user and authenticate.
2. Open workspace and verify truthful no-history state.
3. Open editor and verify Monaco.
4. Select supported language and enter code.
5. Submit valid code through configured provider boundary.
6. Verify backend request, lifecycle and schema validation.
7. Verify report persistence.
8. Reload and reopen report.
9. Search, filter, sort and paginate history.
10. Delete report and verify it is inaccessible.
11. Sign out and verify protected routes fail.
12. Attempt cross-user report access and verify denial.
13. Submit empty, unsupported and oversized input.
14. Simulate provider timeout, rate limit, invalid JSON and outage.
15. Simulate DB outage and verify no fake completion.
16. Test browser back/forward and unsaved editor behavior.
17. Verify every link and visible control.

## 4. Debugging workflow

Capture environment, route, action and time; record request ID; inspect browser console/network; inspect frontend state/event handler; inspect API route/controller/validator; inspect service/provider mapping; inspect DB query/state; identify root cause; add regression test; repair; run focused and full relevant suites; verify no security regression.

Do not suppress console errors, catch-and-ignore or disable failing assertions as a repair.

## 5. Browser matrix

Target current stable desktop Chrome and Firefox. Record exact versions/environment when executed. Run registration/login, editor, language selection, submission, report, history filtering/deletion, keyboard and responsive desktop flows in both. Other browsers are best-effort unless separately approved.

## 6. Test data governance

Use dedicated test accounts and isolated databases. Fixtures exist only in tests. Never seed production/default UI with dummy reviews. Do not use real user source as a fixture without authorization and secure handling.

## 7. AI testing

Test request construction, timeout, 429, 5xx, malformed output, unexpected categories, missing locations, unsupported language, output truncation, prompt-injection attempts in source comments and schema validation. Evaluate with reviewed test cases; one successful response does not prove broad accuracy.

## 8. Security testing

Test sessions, CSRF, XSS rendering, NoSQL injection, IDOR, limits, body sizes, secret exposure, CORS/CSP, log redaction, deletion and dependency findings. Separate automated checks from manual review and professional penetration testing.

## 9. Exit criteria

Release-critical tests pass. A skipped test names its external blocker. Failure must be fixed or explicitly block release. Record commands, outcomes and commit. Never invent coverage or benchmark figures.
