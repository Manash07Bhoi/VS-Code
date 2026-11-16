# Requirements Traceability — CodeSense AI

## 1. Purpose

This document is the authoritative mapping from the product brief to implementation evidence. Every requirement receives a stable ID. The implementation team must maintain this file as code changes. Do not mark a requirement verified because a document describes it.

## 2. Status vocabulary

`PROPOSED`, `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `PASS`, `FAIL`, `DEFERRED`, `OUT OF SCOPE`.

`PASS` requires an evidence link to a source path and a reproducible test or manual verification record. If the evidence is missing, use `BLOCKED` or `NOT STARTED`.

## 3. Requirement register

| ID | Requirement | User-visible area | Backend/data dependency | Required test | Baseline |
|---|---|---|---|---|---|
| REQ-PROD-001 | Product is a focused desktop web code-review platform, not a full IDE | Global | N/A | Scope review | PROPOSED |
| REQ-AUTH-001 | User can register with validated credentials | Register | User model, password hash | Registration integration/E2E | NOT ESTABLISHED |
| REQ-AUTH-002 | User can log in and obtain a secure session | Login | Session/token store | Login, expiry and replay tests | NOT ESTABLISHED |
| REQ-AUTH-003 | User can log out and invalidate session | Global navigation | Session revocation | Logout/reuse test | NOT ESTABLISHED |
| REQ-EDIT-001 | User can write/paste code in Monaco | Workspace | None | Browser editor test | NOT ESTABLISHED |
| REQ-EDIT-002 | User selects only review-enabled languages | Workspace | Authoritative language registry | Allowlist/API contract test | NOT ESTABLISHED |
| REQ-LANG-001 | Five languages are supported end to end | Workspace | Registry, provider adapter, analysis | Per-language E2E | NOT ESTABLISHED |
| REQ-REV-001 | User submits code for review | Workspace | Review API | Request validation test | NOT ESTABLISHED |
| REQ-REV-002 | Server validates source, language, ownership and limits | API | Validation layer | Negative/boundary tests | NOT ESTABLISHED |
| REQ-REV-003 | Backend calls configured real AI provider | Processing/report | Provider adapter | Provider integration test | NOT ESTABLISHED |
| REQ-REV-004 | Provider failure is shown as failure, not fabricated report | Processing/report | Error mapping | Timeout/invalid-key/provider-down tests | NOT ESTABLISHED |
| REQ-REV-005 | AI output is schema-validated and normalized | Report | Result schema | Invalid JSON/schema tests | NOT ESTABLISHED |
| REQ-REV-006 | Findings cite valid source lines/snippets | Report/editor | Source mapping | Range validation tests | NOT ESTABLISHED |
| REQ-REV-007 | Report explains issue, impact and recommended fix | Report | AI result schema | Quality rubric/manual review | NOT ESTABLISHED |
| REQ-HIST-001 | User can list only their own saved reviews | History | Owner-scoped query | IDOR test | NOT ESTABLISHED |
| REQ-HIST-002 | User can filter/sort/page review history | History | Indexed query | API and E2E tests | NOT ESTABLISHED |
| REQ-HIST-003 | User can open and delete own review | History/report | Ownership and deletion policy | E2E/deletion tests | NOT ESTABLISHED |
| REQ-PRIV-001 | Source retention and provider disclosure are clear | Consent/report | Retention/deletion | Privacy acceptance tests | NOT ESTABLISHED |
| REQ-SEC-001 | Secrets remain server-side | Global | Deployment secret store | Bundle/secret scan | NOT ESTABLISHED |
| REQ-SEC-002 | Rate limits protect auth and expensive analysis | Login/API | Rate limiter | Load/abuse tests | NOT ESTABLISHED |
| REQ-UX-001 | Loading, empty, error and success states are truthful | All screens | API state | State-transition E2E | NOT ESTABLISHED |
| REQ-ACC-001 | Core flows work by keyboard | All screens | UI | Keyboard-only test | NOT ESTABLISHED |
| REQ-BROW-001 | Supported desktop browsers are Chrome and Firefox | Global | N/A | Browser matrix | NOT ESTABLISHED |
| REQ-OPS-001 | Health/readiness checks reflect actual dependencies | Operations | DB/provider | Deployment smoke test | NOT ESTABLISHED |
| REQ-REL-001 | Release is reproducible and rollback documented | Release | CI/CD, DB migration | Release rehearsal | NOT ESTABLISHED |

## 4. Traceability row template

Add one row per atomic requirement:

| ID | Requirement | PRD section | Screen | UI control/state | API route | Data entity | Security control | Code path | Test ID | Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|

Do not put multiple independently testable requirements into one row.

## 5. Change control

A requirement change must record: requester, date, reason, old behavior, new behavior, affected screens/API/data/security/tests, migration impact and approval. Update PRD, API, database, screen docs, tests and changelog together.

## 6. Release gate

No Critical requirement may remain `NOT STARTED`, `BLOCKED`, `FAIL` or undocumented. Any approved deferral must include a reason, owner, risk acceptance and removal from the release claim. Do not call the release complete if any required journey lacks end-to-end evidence.
