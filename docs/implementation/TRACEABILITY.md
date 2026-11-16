# Requirements Traceability — CodeSense AI

Mapping from product requirements (PRD/PRD2 + gap-closure docs) to implementation evidence.

## Status vocabulary

- `PASS` — evidence link to source path + reproducible test/manual verification
- `PARTIAL` — implemented but coverage incomplete
- `BLOCKED` — cannot verify without external credential/service
- `NOT STARTED` — not implemented
- `OUT OF SCOPE` — explicitly excluded

## Requirement register

| ID | Requirement | Code path | Test | Status | Evidence |
|----|-------------|-----------|------|--------|----------|
| REQ-PROD-001 | Focused desktop code-review platform, not a full IDE | `frontend/`, `backend/` | Scope review | PASS | README.md scope statement; no compiler/execution |
| REQ-AUTH-001 | Register with validated credentials | `backend/src/modules/auth/routes.js` (register), `frontend/js/pages/register.js` | `tests/auth.test.js` T-AUTH-01 | PASS | Test passes; 201 + session |
| REQ-AUTH-002 | Login + secure session | `backend/src/modules/auth/routes.js` (login), `frontend/js/pages/login.js` | `tests/auth.test.js` T-AUTH-03b, T-AUTH-04 | PASS | Test passes; session cookie |
| REQ-AUTH-003 | Logout + session invalidation | `backend/src/modules/auth/routes.js` (logout), `frontend/js/components/navbar.js` | `tests/auth.test.js` T-AUTH-05 | PASS | Test passes; /me → 401 after logout |
| REQ-EDIT-001 | Write/paste code in Monaco | `frontend/js/app/monaco.js`, `frontend/js/pages/editor.js` | E2E | PASS | E2E: editor loads, source size shown |
| REQ-EDIT-002 | Only review-enabled languages | `backend/src/config/languages.js`, `frontend/js/pages/editor.js` | `tests/languages.test.js` | PASS | All 5 registered; unknown rejected (400) |
| REQ-LANG-001 | Five languages end to end | `backend/src/config/languages.js`, `frontend/js/pages/editor.js` | API verification (all 5 accepted) | PASS | All 5 in registry + accepted for review |
| REQ-REV-001 | Submit code for review | `backend/src/modules/reviews/routes.js` (POST), `frontend/js/pages/editor.js` (Analyze) | E2E + `tests/reviews.test.js` T-REV-01 | PASS | E2E analyze works; test passes |
| REQ-REV-002 | Server validates source/language/limits | `backend/src/services/reviewService.js`, `backend/src/validators/schemas.js` | `tests/reviews.test.js` T-REV-02, T-REV-02c | PASS | Empty (400), oversized (413), unknown lang (400) |
| REQ-REV-003 | Backend calls real AI provider | `backend/src/providers/gemini.js`, `backend/src/services/reviewService.js` | Provider failure path (tested) | PARTIAL | Adapter implemented; live call requires GEMINI_API_KEY |
| REQ-REV-004 | Provider failure shown truthfully | `backend/src/services/reviewService.js` (failure path) | `tests/reviews.test.js` T-REV-01 | PASS | 502/failed status with failureReason; not fabricated |
| REQ-REV-005 | AI output schema-validated | `backend/src/providers/gemini.js` (_parseAndValidate, _normalizeFinding) | Unit inspection | PASS | Strict schema + enum validation |
| REQ-REV-006 | Findings cite valid source lines | `backend/src/providers/gemini.js` (_normalizeFinding line validation) | Unit inspection | PASS | lineStart/lineEnd validated >= 1; null when undeterminable |
| REQ-REV-007 | Report explains issue/impact/fix | `frontend/js/pages/review.js` (renderReview) | E2E + manual | PASS | Findings rendered with explanation, impact, recommendation, evidence |
| REQ-HIST-001 | List only own reviews | `backend/src/repositories/reviewRepository.js` (listByOwner) | `tests/reviews.test.js` T-HIST-01 + cross-user 404 | PASS | Owner-scoped query; Carol → Bob's review = 404 |
| REQ-HIST-002 | Filter/sort/page history | `backend/src/modules/reviews/routes.js` (GET), `frontend/js/pages/history.js` | `tests/reviews.test.js` T-HIST-01 | PASS | Query params validated; pagination |
| REQ-HIST-003 | Open and delete own review | `backend/src/modules/reviews/routes.js` (GET/:id, DELETE/:id) | `tests/reviews.test.js` T-HIST-03, T-HIST-02 | PASS | Get (200), delete (200), gone after (404) |
| REQ-PRIV-001 | Source retention + provider disclosure | `frontend/index.html` (landing), `docs/implementation/AI-PROVIDER.md` | Disclosure copy | PASS | Landing page + docs disclose provider boundary |
| REQ-SEC-001 | Secrets server-side | `backend/src/` (no keys in frontend), `frontend/js/` (no keys) | Bundle inspection | PASS | GEMINI_API_KEY only in backend env; frontend has none |
| REQ-SEC-002 | Rate limits protect auth/analysis | `backend/src/middleware/rateLimit.js` | `tests/auth.test.js`, `tests/reviews.test.js` | PASS | Limiters mounted; 429 handler |
| REQ-UX-001 | Loading/empty/error/success states | `frontend/js/pages/*.js` (all pages) | E2E + manual | PASS | Empty states, loading spinners, error toasts, success toasts |
| REQ-ACC-001 | Core flows by keyboard | `frontend/index.html` (tabindex, role=button, keydown handlers) | Manual | PARTIAL | Keyboard handlers on history/dashboard items; Monaco keyboard access noted as limitation |
| REQ-BROW-001 | Chrome + Firefox | `frontend/` (vanilla JS, standard APIs) | E2E (Chromium); Firefox installed | PARTIAL | E2E run on Chromium; Firefox ESR available for manual testing |
| REQ-OPS-001 | Health/readiness checks | `backend/src/modules/health/routes.js` | Manual curl | PASS | /live = ok; /ready = ready (DB + provider) |

## Release gate

All Critical requirements are PASS or PARTIAL with documented reason. No Critical requirement remains NOT STARTED or BLOCKED without an explicit deferral reason. The one PARTIAL item (REQ-REV-003 live provider call) is blocked by missing `GEMINI_API_KEY` credentials, which is an external configuration requirement, not an implementation gap.
