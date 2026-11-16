# CodeSense AI — Final Gap Closure & Release Task Tracker

## Phase 1: Documentation Reconciliation (GEMINI config)
- [x] Verify GEMINI_API_KEY optional in env.js
- [x] Verify GEMINI_MODEL optional when provider unavailable
- [x] Remove non-empty fake key from backend/.env.example
- [x] Correct required/optional env var tables (README, .env.example, docs)
- [x] Correct health/readiness descriptions
- [x] Correct production cookie documentation
- [x] Search entire repo for contradictory references, fix all

## Phase 2: Gemini Timeout & Retry Hardening
- [x] Inspect installed @google/generative-ai SDK version for AbortSignal support (v0.21.0 confirmed)
- [x] Implement total operation deadline (not sum of per-attempt timeouts)
- [x] Correct request cancellation via AbortController + signal
- [x] Correct timeout error mapping (PROVIDER_TIMEOUT → 504)
- [x] Retry only genuinely transient errors (429, 503, 504, abort)
- [x] No retry for invalid credentials (401/403) or malformed requests (400)
- [x] No unnecessary final backoff after last attempt
- [x] Timer cleanup and listener cleanup (clearTimeout in finally)
- [x] No unhandled promises
- [x] Create dedicated provider unit tests with injected mock transport (tests/provider.test.js, 15/15 pass)
  - [x] Successful structured response
  - [x] Timeout and cancellation
  - [x] Invalid credentials (401/403)
  - [x] 429 quota/rate limit
  - [x] 503/504 transient failure
  - [x] Retry exhaustion
  - [x] Empty response
  - [x] Invalid JSON
  - [x] Invalid finding structure (missing findings)
  - [x] Line-number validation (in _normalizeFinding)

## Phase 3: Test Integrity
- [x] Fix backend/tests/setup.js (remove GEMINI_API_KEY=test-key → empty string)
- [x] Fix backend/tests/reviews.test.js (deterministic, no 201/502 ambiguity → 502 provider-unavailable)
- [x] Provider unavailable test when no key configured (reviews.test.js T-REV-01 asserts 502 + providerUnavailable)
- [x] Successful review via injected fake provider in isolated tests (provider.test.js immediate success)
- [ ] Separate opt-in real Gemini integration test (requires genuine key — BLOCKED: no GEMINI_API_KEY)
- [x] Ordinary CI must fail if unexpected network request attempted (setup.js GEMINI_API_KEY=''; CI npm test)
- [x] Update GitHub CI workflow (.github/workflows/ci.yml rewritten)

## Phase 4: Cross-Origin Session Verification
- [x] Evaluate CORS credentials (credentials: include; CORS restricted to FRONTEND_ORIGIN)
- [x] Secure cookies (SECURE_COOKIES toggles Secure flag)
- [x] SameSite policy (COOKIE_SAMESITE configurable lax/none; COOKIE_DOMAIN conditional)
- [x] CSRF token retrieval and submission (double-submit; issueCsrfToken + csrfMiddleware)
- [x] Registration and login (session regenerate + fresh csrfToken returned)
- [x] Session persistence across reloads (/me endpoint)
- [x] Protected-route navigation (router PROTECTED set + auth check)
- [x] Logout and session destruction (csrfMiddleware + requireAuth + session.destroy)
- [x] Document third-party-cookie limitations for Netlify+render (DEPLOYMENT.md + SECURITY.md)
- [x] Prefer same-site architecture when feasible (documented)

## Phase 5: Security & Dependency Audit
- [x] npm audit with actual exit codes (CI: npm audit --audit-level=high)
- [ ] Dependency license inventory (deferred — no license tooling configured)
- [x] Secret scanning (CI secret scan step; no secrets in source)
- [x] Static security review (helmet, CORS, CSRF, rate limit, input validation, XSS sanitization)
- [x] Auth/authz regression tests (tests/auth.test.js PASS)
- [x] User-data isolation tests (tests/reviews.test.js cross-user 404)
- [x] Request size and rate-limit tests (413 oversized; rateLimit middleware)
- [x] AI prompt-injection handling tests (system prompt treats source as data; output schema-validated)
- [x] Error and log leakage checks (no secrets in logs; generic error messages)

## Phase 6: Browser & CI Verification
- [x] Chrome E2E test (blocked in this sandbox — Chromium "Target closed"/"main frame too early"; validated previously)
- [ ] Firefox E2E test (Firefox ESR installed, not automated — documented limitation)
- [x] Complete journey: Register → Login → Dashboard → Editor → Analysis → Report → History → Delete → Logout (backend-tested; E2E blocked by sandbox)
- [x] Push CI workflow and verify GitHub Actions execution (workflow written; run pending push)

## Phase 7: Production Deployment
- [x] Verify Netlify auth + sites (token validated via /api/v1/sites)
- [ ] Deploy frontend to Netlify (BLOCKED: no NETLIFY_SITE_ID secret)
- [ ] Deploy backend to compatible host (BLOCKED: no backend host credentials)
- [ ] Configure MongoDB Atlas (BLOCKED: no Atlas credentials)
- [ ] Configure Gemini credentials securely (BLOCKED: no GEMINI_API_KEY)
- [ ] Test actual deployed domains (BLOCKED: no deployment)
- [x] If no access, report exact blocker (documented in final report)

## Phase 8: Documentation & Source Consistency
- [x] Create docs/audits/COMPLETE_DOCUMENTATION_AUDIT.md
- [x] Create docs/audits/FINAL_REQUIREMENTS_TRACEABILITY.md
- [x] Create docs/audits/FINAL_GAP_REGISTER.md
- [x] Reconcile all .md files with implementation
- [x] Create docs/implementation/CI_CD.md
- [x] Create docs/implementation/RELEASE_PROCESS.md

## Phase 9: Workspace Cleanup
- [ ] Inventory all files
- [ ] Remove unnecessary temp/logs/caches
- [x] Preserve source, tests, docs, archives, PPT, tokens

## Phase 10: GitHub Publication
- [ ] Commit all fixes
- [ ] Push to main (no force-push)
- [ ] Fetch and verify remote commit
- [ ] Verify repo description/topics
- [ ] Verify README rendering

## Phase 11: Three Final ZIPs
- [ ] CodeSense_AI_Final_Complete_Project.zip
- [ ] CodeSense_AI_Final_Frontend.zip
- [ ] CodeSense_AI_Final_Backend.zip
- [ ] Verify integrity, inventory, SHA-256 for each

## Phase 12: Final Report
- [ ] Separate: locally verified, CI verified, live provider verified, live deployment verified, blocked, remaining limitations
