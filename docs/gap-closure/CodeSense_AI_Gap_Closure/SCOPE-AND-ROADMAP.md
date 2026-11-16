# Scope, MVP Boundaries and Delivery Roadmap — CodeSense AI

## 1. Product boundary

CodeSense AI is a browser-based code review and learning aid. It lets a registered user submit source code, receive AI-assisted findings and suggested improvements, and revisit saved reports. It is not a general-purpose IDE, compiler service, CI platform, penetration-testing product or guarantee of secure code.

## 2. MVP scope

- Registration, login, logout and secure session handling.
- Desktop web UI for Chrome and Firefox.
- Monaco editor with write/paste, language selection and source-size feedback.
- Five end-to-end review languages: JavaScript, TypeScript, Python, Java and C++.
- Server-side validation and configured real AI provider integration.
- Structured findings: category, severity, confidence/qualification, explanation, impact, evidence location and recommendation.
- Improved-code suggestion with clear separation from original source.
- Persisted review report and user-owned review history.
- History search/filter/sort/pagination only where implemented and indexed.
- Real loading, empty, failure, retry and deletion states.
- Security, privacy, accessibility, tests and deployment documentation.

## 3. Explicitly out of scope

- Billing, pricing pages, subscriptions, upgrade prompts, premium/developer tiers.
- Full IDE features such as terminal, debugger, file-system project explorer or arbitrary package installation.
- Executing submitted code on the application server.
- Arbitrary shell commands or user-controlled compiler flags.
- Automatic GitHub/GitLab repository access in MVP.
- Team collaboration, shared workspaces and comments.
- Public leaderboards, fake analytics, demo activity or synthetic sample reports.
- Guaranteed vulnerability detection, compliance certification or guaranteed bug-free output.
- Push notifications unless a real user-beneficial event channel is implemented and approved.
- Mobile-first/touch-specific application behavior; desktop browser is the target.

## 4. Five-language requirement

The MVP target is JavaScript, TypeScript, Python, Java and C++. Each language must have:
- a canonical server-side identifier;
- Monaco mode mapping;
- request validation and source limits;
- a tested analysis prompt/schema path;
- reliable line-number validation against original source;
- report rendering and persistence;
- negative tests for unsupported/disabled language;
- a documented static analyzer only if one is actually installed and safely integrated.

A language is not counted as supported merely because Monaco highlights it. If the environment cannot safely provide equivalent language support, the team must report the limitation and not silently label the language complete.

## 5. Delivery phases

### Phase 0 — Source and requirements reconciliation
Clone the live repo, record commit/tree, inventory files, inspect PPT and all docs, identify existing vs missing, establish ADRs and traceability. Exit: reproducible baseline audit.

### Phase 1 — Application foundation
Create separated `frontend/` and `backend/` directories, package manifests/lockfiles, config validation, health endpoints, error contracts and local setup. Exit: both services start and communicate in local environment.

### Phase 2 — Authentication and persistence
Implement registration/login/logout, password hashing, secure session, user model, review model, indexes and owner-scoped access. Exit: auth and persistence integration tests pass.

### Phase 3 — Editor and language registry
Integrate Monaco, source controls, five-language registry and validation. Exit: five language selections submit canonical IDs; unsupported language rejected server-side.

### Phase 4 — Real AI analysis
Implement provider adapter, secrets, request budgets, timeouts, structured output, schema validation, safe failure behavior and prompt-injection defenses. Exit: live configured provider integration test passes; provider failure never becomes a fake success.

### Phase 5 — Reports and history
Implement report screen, finding navigation, copy/apply confirmation, persisted history, filters and deletion. Exit: owner isolation and persistence E2E tests pass.

### Phase 6 — Hardening
Security tests, privacy/deletion, accessibility, Chrome/Firefox, performance, observability, backup/restore and dependency audit. Exit: no unresolved critical/high issue without explicit risk acceptance.

### Phase 7 — Release
CI, production environment, secrets, migrations, health checks, rollback, smoke test, source ZIP and evidence report. Exit: reproducible production deployment and truthful release report.

## 6. Do not fake milestones

A phase is complete only when its exit criteria are met with retained evidence. A UI that looks finished while API/database/provider integration is absent is not a completed phase.
