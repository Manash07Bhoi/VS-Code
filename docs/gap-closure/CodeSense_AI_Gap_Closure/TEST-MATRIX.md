# Test Matrix and Release Evidence — CodeSense AI

## 1. Test layers

- Unit: validators, state transitions, language registry, report normalization, pagination and error mapping.
- Integration: auth/session, database repositories, provider adapter, API routes.
- Contract: frontend/backend request/response schemas and provider output schema.
- End-to-end: actual Chrome and Firefox user journeys.
- Security: IDOR, XSS, CSRF, rate limiting, secrets, prompt injection and abuse.
- Accessibility: keyboard, focus, labels, contrast, zoom and status announcements.
- Performance: editor startup, API latency, bounded history queries and concurrent reviews.

## 2. Required scenario matrix

| ID | Scenario | Expected result |
|---|---|---|
| T-AUTH-01 | Register valid user | Durable account created once |
| T-AUTH-02 | Register duplicate email | Safe validation response; no duplicate |
| T-AUTH-03 | Login wrong password | Generic failure; no session |
| T-AUTH-04 | Expired session accesses private API | 401; no data returned |
| T-AUTH-05 | Logout then replay old session | Rejected |
| T-EDIT-01 | Monaco loads | Editable source area available |
| T-EDIT-02 | Monaco CDN/network failure | Clear error; no fake editor |
| T-LANG-01..05 | Each of five languages | Editor, server mapping, review, report and history all work |
| T-LANG-06 | Unknown language submitted manually | Server rejects before provider call |
| T-REV-01 | Valid source and live provider | Schema-valid persisted report |
| T-REV-02 | Empty/oversized source | Server rejects; no provider call |
| T-REV-03 | Provider timeout | Honest failed state |
| T-REV-04 | Invalid provider JSON | Rejected; no completed report |
| T-REV-05 | Duplicate client request | No unintended duplicate report |
| T-REV-06 | Prompt injection in code comment | No tool execution/secrets; output validated |
| T-REPORT-01 | Finding line range outside source | Invalid range removed/rejected, not rendered as valid |
| T-HIST-01 | User A requests User B report ID | Not found/forbidden without data leak |
| T-HIST-02 | Delete own report | Removed per retention policy |
| T-HIST-03 | Search returns zero | No-match state, not first-use state |
| T-UI-01 | API unavailable | Error state and retry if safe |
| T-UI-02 | Keyboard-only full review | All core controls operable |
| T-BROW-01 | Chrome supported version | Core journey passes |
| T-BROW-02 | Firefox supported version | Core journey passes |
| T-OPS-01 | MongoDB unavailable | Readiness fails; safe error |
| T-OPS-02 | Missing provider key | Review unavailable; no canned report |
| T-SEC-01 | XSS payload in source/report | Rendered as inert text |
| T-SEC-02 | Secret scan | No committed credentials |
| T-REL-01 | Clean install from lockfiles | Reproducible dependency install |
| T-REL-02 | Restore backup | Restore drill evidence retained |

## 3. Evidence format

For each run record:
- test ID;
- commit SHA;
- environment and versions;
- exact command or browser steps;
- timestamp;
- result `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`;
- sanitized output/log artifact;
- defect ID for failures.

Do not write a passing result until the test actually ran.

## 4. Exit criteria

All critical flows pass in Chrome and Firefox. All five language paths pass. No open critical security issue. No fake data or inert control in production routes. Database persistence survives restart. Provider failure is honest. All secrets are externalized. Accessibility and privacy gates have evidence. Deployment and rollback are reproducible.
