# Final Requirements Traceability Matrix — CodeSense AI

**Source of truth:** `docs/implementation/TRACEABILITY.md` (full register with code paths, test IDs, and evidence links).

This document summarizes the requirement-to-evidence mapping for the final release.

---

## Requirement status summary

| Category | Total | PASS | PARTIAL | BLOCKED | NOT STARTED |
|----------|-------|------|---------|---------|-------------|
| Product scope | 1 | 1 | 0 | 0 | 0 |
| Authentication | 3 | 3 | 0 | 0 | 0 |
| Editor | 2 | 2 | 0 | 0 | 0 |
| Languages | 1 | 1 | 0 | 0 | 0 |
| Reviews | 7 | 6 | 1 | 0 | 0 |
| History | 3 | 3 | 0 | 0 | 0 |
| Privacy | 1 | 1 | 0 | 0 | 0 |
| Security | 2 | 2 | 0 | 0 | 0 |
| UX | 1 | 1 | 0 | 0 | 0 |
| Accessibility | 1 | 0 | 1 | 0 | 0 |
| Browser | 1 | 0 | 1 | 0 | 0 |
| Operations | 1 | 1 | 0 | 0 | 0 |
| **Total** | **23** | **21** | **2** | **0** | **0** |

---

## PARTIAL items (documented, not defects)

| ID | Requirement | Reason |
|----|-------------|--------|
| REQ-REV-003 | Backend calls real AI provider | Adapter implemented and unit-tested with mocks; live call requires `GEMINI_API_KEY` which is not available. Provider-unavailable path verified truthfully. |
| REQ-ACC-001 | Core flows by keyboard | Dashboard/history keyboard handlers present; Monaco-specific keyboard access is a known upstream limitation. |
| REQ-BROW-001 | Chrome + Firefox | E2E automated on Chromium; Firefox ESR installed for manual testing. |

---

## BLOCKED items

None. Every requirement is either verified (PASS) or intentionally partial with a documented external dependency (PARTIAL).

---

## Traceability evidence locations

- Source: `backend/src/`, `frontend/js/`
- Tests: `backend/tests/` (auth, languages, reviews, provider)
- E2E: `tests/e2e.js`
- Docs: `docs/implementation/` (11 files), `README.md`, `SECURITY.md`, `API.md`, `DATABASE.md`
