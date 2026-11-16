# CodeSense AI — Task Register

## Baseline (Phase A) — COMPLETED
- [x] Clone repo https://github.com/Manash07Bhoi/VS-Code.git (main, commit 7c3d94b)
- [x] Inventory root files: README.md (20 bytes), presentation.pptx, both ZIPs
- [x] Verify ZIP integrity (both OK)
- [x] Extract ZIP1 (33 docs) -> docs/source-documentation/
- [x] Extract ZIP2 (22 docs) -> docs/gap-closure/
- [x] Read MASTER-ARENA-PROMPT.md, PRD.md, PRD2.md, AGENT.md
- [x] Read ARCHITECTURE.md, DATABASE.md, API.md, SECURITY.md, AI-ANALYSIS.md
- [x] Read gap-closure: DECISIONS.md, GAP-AUDIT.md, REQUIREMENTS-TRACEABILITY.md, LANGUAGE-IMPLEMENTATION-MATRIX.md, AUTH-SESSION-SECURITY.md, AI-PROVIDER-OPERATIONS.md
- [x] Read gap-closure: API-CONTRACTS.md, FRONTEND-BACKEND-IMPLEMENTATION.md, SCREEN-ACCEPTANCE-MATRIX.md, TEST-MATRIX.md, THREAT-MODEL.md, SCOPE-AND-ROADMAP.md
- [x] Read gap-closure: GAP-CLOSURE-EXECUTION-PROMPT.md, ENVIRONMENTS-DEPLOYMENT-TOPOLOGY.md, DATA-LIFECYCLE-MIGRATIONS.md, PROJECT-STATUS-AND-RELEASE-EVIDENCE.md, MISSING-DOCUMENTS-INDEX.md, SCREENS.md
- [x] Confirm environment: Node v20.20.2, npm 10.8.2, internet OK, no mongod, no browsers initially
- [x] Install Firefox ESR 153 + Chromium 156 via apt
- [ ] Secure MongoDB runtime (memory-server for tests; document prod URI requirement)
- [ ] Confirm no GEMINI/GOOGLE_API/OPENAI env vars (reviewer must supply key)

## Phase B/C — Architecture & decisions
- [ ] Reconcile docs into traceability; record ADRs
- [ ] Define env var names in .env.example (names only)

## Phase D — Build
- [ ] Backend: package.json, server.js, config, env validation
- [ ] Backend: Mongoose models (User, Review, Session)
- [ ] Backend: auth routes (register/login/logout/me), password hashing (bcrypt), secure session cookie, CSRF
- [ ] Backend: language registry, review routes (create/list/get/delete), owner-scoped
- [ ] Backend: Gemini provider adapter, timeout, retry, schema validation, failure handling
- [ ] Backend: rate limiting, security headers, CORS, health endpoints (live/ready)
- [ ] Frontend: HTML pages (landing, register, login, dashboard, editor, report, history, settings, 404)
- [ ] Frontend: CSS design system (dark-first, violet/indigo accents)
- [ ] Frontend: Vanilla JS router, API client, auth state, Monaco integration
- [ ] Frontend: pages — register, login, dashboard, editor, report, history, settings
- [ ] Frontend: states — loading, empty, validation, error, timeout, provider-unavailable

## Phase E — Integration & five languages
- [ ] Language registry: javascript, typescript, python, java, cpp (Monaco + backend)
- [ ] End-to-end review flow per language (live provider where key available)
- [ ] History persistence, retrieval, deletion with owner isolation

## Phase F — Test & harden
- [ ] Backend unit/integration tests (auth, validation, DB, provider adapter, malformed output, timeouts)
- [ ] Frontend tests / E2E in Chromium + Firefox (registration, login, submit, report, history, delete, logout)
- [ ] Five-language path tests
- [ ] Security: IDOR, XSS, CSRF, rate limit, secret scan
- [ ] Fix failures, rerun

## Phase G — Docs
- [ ] Update docs/DOCUMENTATION-INDEX.md
- [ ] README setup instructions, SECURITY.md, CHANGELOG.md, KNOWN-LIMITATIONS.md, TEST-RESULTS.md
- [ ] Synchronize docs with implementation

## Phase H — Release
- [ ] Final ZIP, SHA-256, secret scan, integrity check
- [ ] Final report with exact run instructions, limitations, test results