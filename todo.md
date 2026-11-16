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
- [ ] Inspect installed @google/generative-ai SDK version for AbortSignal support
- [ ] Implement total operation deadline (not sum of per-attempt timeouts)
- [ ] Correct request cancellation via AbortSignal
- [ ] Correct timeout error mapping
- [ ] Retry only genuinely transient errors (429, 503, 504, abort)
- [ ] No retry for invalid credentials (401/403) or malformed requests (400)
- [ ] No unnecessary final backoff after last attempt
- [ ] Timer cleanup and listener cleanup
- [ ] No unhandled promises
- [ ] Create dedicated provider unit tests with injected mock transport:
  - Successful structured response
  - Timeout and cancellation
  - Invalid credentials
  - 429 quota/rate limit
  - 503/504 transient failure
  - Retry exhaustion
  - Empty response
  - Invalid JSON
  - Invalid finding structure
  - Line-number validation

## Phase 3: Test Integrity
- [ ] Fix backend/tests/setup.js (remove GEMINI_API_KEY=test-key)
- [ ] Fix backend/tests/reviews.test.js (deterministic, no 201/502 ambiguity)
- [ ] Provider unavailable test when no key configured
- [ ] Successful review via injected fake provider in isolated tests
- [ ] Separate opt-in real Gemini integration test (requires genuine key)
- [ ] Ordinary CI must fail if unexpected network request attempted
- [ ] Update GitHub CI workflow

## Phase 4: Cross-Origin Session Verification
- [ ] Evaluate CORS credentials
- [ ] Secure cookies
- [ ] SameSite policy (lax vs none)
- [ ] CSRF token retrieval and submission
- [ ] Registration and login
- [ ] Session persistence across reloads
- [ ] Protected-route navigation
- [ ] Logout and session destruction
- [ ] Document third-party-cookie limitations for Netlify+Render
- [ ] Prefer same-site architecture when feasible

## Phase 5: Security & Dependency Audit
- [ ] npm audit with actual exit codes
- [ ] Dependency license inventory
- [ ] Secret scanning
- [ ] Static security review
- [ ] Auth/authz regression tests
- [ ] User-data isolation tests
- [ ] Request size and rate-limit tests
- [ ] AI prompt-injection handling tests
- [ ] Error and log leakage checks

## Phase 6: Browser & CI Verification
- [ ] Chrome E2E test
- [ ] Firefox E2E test
- [ ] Complete journey: Register → Login → Dashboard → Editor → Analysis → Report → History → Delete → Logout
- [ ] Push CI workflow and verify GitHub Actions execution

## Phase 7: Production Deployment
- [ ] Verify Netlify auth + sites
- [ ] Deploy frontend to Netlify
- [ ] Deploy backend to compatible host (Render)
- [ ] Configure MongoDB Atlas
- [ ] Configure Gemini credentials securely
- [ ] Test actual deployed domains
- [ ] If no access, report exact blocker

## Phase 8: Documentation & Source Consistency
- [ ] Create docs/audits/COMPLETE_DOCUMENTATION_AUDIT.md
- [ ] Create docs/audits/FINAL_REQUIREMENTS_TRACEABILITY.md
- [ ] Create docs/audits/FINAL_GAP_REGISTER.md
- [ ] Reconcile all .md files with implementation
- [ ] Create docs/implementation/CI_CD.md
- [ ] Create docs/implementation/RELEASE_PROCESS.md

## Phase 9: Workspace Cleanup
- [ ] Inventory all files
- [ ] Remove unnecessary temp/logs/caches
- [ ] Preserve source, tests, docs, archives, PPT, tokens

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
