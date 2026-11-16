# Architecture Decision Records — CodeSense AI

This file records decisions. Proposed choices must be accepted by the project owner and reconciled with repository evidence before implementation.

## ADR-001 — Frontend technology
**Status:** Accepted product constraint.  
**Decision:** HTML, CSS and Vanilla JavaScript, organized under `frontend/`. Use Monaco Editor for code editing.  
**Reason:** Explicit project direction; avoid adding React or a framework not requested.  
**Consequences:** Establish module boundaries, routing/state conventions, API client, component utilities and build strategy without framework-level abstractions.

## ADR-002 — Backend technology
**Status:** Proposed default.  
**Decision:** Node.js + Express under `backend/`.  
**Reason:** Fits the existing project direction and JavaScript ecosystem.  
**Consequences:** Use maintained packages, lockfile, request validation, centralized errors and explicit service/repository boundaries.

## ADR-003 — Database
**Status:** Proposed default.  
**Decision:** MongoDB + Mongoose.  
**Reason:** Fits structured nested review reports and proposed capstone stack.  
**Consequences:** Schema validation, indexes, migration discipline, backup/restore and owner-scoped queries are mandatory.

## ADR-004 — AI provider
**Status:** Not frozen until credentials and current provider capability are verified.  
**Decision:** Gemini is the primary proposed provider; an OpenAI adapter is optional only if separately configured and approved.  
**Reason:** Both were named in the capstone presentation.  
**Consequences:** Keep provider adapter independent. No frontend key. No fake fallback. Provider costs and data transfer must be disclosed.

## ADR-005 — Authentication
**Status:** Decision required before coding.  
**Candidate:** Secure server-managed cookie session for same-site deployment.  
**Alternative:** Short-lived access token plus rotating refresh token, only with explicit secure storage/revocation design.  
**Decision gate:** deployment topology, CSRF/CORS, persistence and session revocation must be considered together.

## ADR-006 — Analysis execution model
**Status:** Decision required based on expected provider latency and hosting constraints.  
**Candidate:** Bounded synchronous request for MVP if provider latency and hosting limits make it reliable.  
**Alternative:** Durable queue/worker only if a real queue is deployed and monitored.  
**Rule:** Never simulate a queue with frontend timers or in-memory pseudo-jobs.

## ADR-007 — Five languages
**Status:** Product requirement.  
**Decision:** JavaScript, TypeScript, Python, Java and C++ as the target set.  
**Rule:** Only enable languages with complete end-to-end tests.

## ADR-008 — No submitted-code execution
**Status:** Accepted security boundary.  
**Decision:** Do not execute user-submitted source code or shell commands in the web request path.  
**Reason:** The product is a review assistant, not an online judge or sandbox.  
**Consequences:** Do not claim runtime output or compile diagnostics unless a separately designed isolated service is later approved.

## ADR-009 — No premium/billing features
**Status:** Accepted scope exclusion.  
**Decision:** No subscription, pricing, upgrade, paid-tier or developer-tier UI.  
**Consequences:** Do not introduce billing models or paywall logic.

## ADR-010 — Desktop browsers
**Status:** Accepted target.  
**Decision:** Support desktop Chrome and Firefox.  
**Consequences:** Test both. Mobile-specific UI is not an MVP requirement.
