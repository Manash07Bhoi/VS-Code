# CodeSense AI — Master Arena Agent Execution Prompt

**Repository:** https://github.com/Manash07Bhoi/VS-Code.git  
**Primary product brief:** `presentation.pptx` in the repository  
**Development environment:** Visual Studio Code  
**Expected final deliverable:** Working full-stack application, complete Markdown engineering documentation, verified tests and a complete source ZIP.

## 1. Mission

Act as the accountable principal engineer and delivery lead for CodeSense AI. Inspect the actual Git repository and every existing artifact before deciding what exists. Treat the PowerPoint as the original product brief, not as proof that described features have been implemented. Deliver the actual application, not a proposal, static mockup, clickable concept, screenshot-only prototype or documentation-only result.

Build a desktop-browser web application combining a Monaco-based code editing workspace with genuine AI-assisted code review. Users must create an account, authenticate, write or paste source code, select a supported language, submit code to a real backend analysis workflow, receive structured and technically justified findings, inspect recommended improvements and revisit persisted review history.

This project is developed using VS Code. It is **not** a recreation of the complete Visual Studio Code desktop product. Monaco Editor is an editor component; it does not by itself provide a full IDE, compiler, runtime, debugger or extension ecosystem.

## 2. Mandatory repository acquisition and inspection

Clone the repository before implementation:

```bash
git clone https://github.com/Manash07Bhoi/VS-Code.git
```

If the repository is already present, verify its origin, branch, commit and working-tree state before reusing it. Preserve existing work. Never force-reset, overwrite uncommitted changes or delete source files without evidence and a documented reason.

Inspect the complete repository recursively, including hidden configuration, manifests, lockfiles, source, assets, tests, scripts, documentation, CI configuration and the PowerPoint. Read all slides and speaker notes where available. Do not rely only on a previous summary or a filename.

A connected GitHub inspection on 15 November 2026 observed `README.md` and `presentation.pptx` at the root of the public `main` branch; the README contained only a short repository label. Recheck this state after cloning because the repository may change. This is a dated baseline, not a reason to skip inspection.

If GitHub access, cloning, PPT parsing, database access, secrets, package installation or deployment credentials are unavailable, report the exact blocker and continue with possible work. Never fabricate successful operations.

## 3. Evidence-based baseline audit

Before implementation, record:

- repository origin, default branch, active branch, starting commit and working-tree state;
- complete file inventory and project structure;
- frontend/backend frameworks, entry points and scripts;
- database technology, models, indexes and migrations, if present;
- authentication and authorization implementation, if present;
- AI providers and real analysis flow, if present;
- screens, routes, controls and user journeys;
- assets, branding and design tokens;
- build, lint, test and deployment commands;
- dependency health and vulnerability findings;
- runtime, browser-console, server, API and database errors;
- existing tests and limitations.

Classify each capability as **verified existing**, **existing but broken**, **existing but incomplete**, **missing requirement**, or **proposed enhancement**. Attach evidence such as file paths, symbols, routes, test names or command output. A visible control is not verified functionality. A database model is not proof of persistence. A route rendering is not proof of its full workflow. An SDK import is not proof of correct AI analysis.

Update `REPOSITORY-AUDIT.md` with findings grounded in the cloned repository. Separate observations from proposed work. Refresh it before release.

## 4. Product scope from the PowerPoint

The presentation establishes five primary modules:

1. Authentication: registration and login.
2. Code submission: online Monaco code editor and language selection.
3. AI analysis: backend-mediated analysis of submitted source code.
4. Review report: bugs, potential security issues, performance suggestions, beginner-friendly explanations and improved-code recommendations.
5. Review history: persisted reports that the authenticated user can revisit.

Core workflow:

**Register / Login → Workspace → Editor → Select Language → Submit Code → Backend Validation → AI Analysis → Persist Result → Review Report → Review History.**

The PPT states that CodeSense AI is not a full IDE replacement and cannot guarantee detection of every vulnerability. GitHub/GitLab integration, collaboration, real-time collaboration and personalized coding assistant capabilities are future scope unless already implemented and specifically approved. Do not add billing, paid tiers, subscriptions, premium/developer-only features, pricing pages, upgrade pages or artificial entitlements. Android is not a target platform.

## 5. Required technology decisions

Use this default stack unless repository evidence or a documented blocker justifies an alternative:

- **Frontend:** semantic HTML5, CSS3 and Vanilla JavaScript. Do not introduce React, Vue or Angular.
- **Editor:** Monaco Editor, integrated as a real component.
- **Backend:** Node.js on an actively supported LTS version and Express.js REST API.
- **Database:** MongoDB with Mongoose.
- **Authentication:** secure server-managed session or carefully designed short-lived token/refresh lifecycle. JWT may be used where justified; do not store long-lived credentials in unsafe browser storage.
- **Password hashing:** Argon2id preferred where deployment permits; bcrypt is an acceptable fallback with an appropriate work factor.
- **Validation:** schema validation at every trust boundary, e.g. Zod.
- **AI:** server-side provider adapter, Gemini as the primary intended provider. OpenAI is optional only if genuinely implemented and tested.
- **Testing:** maintained tools for unit, integration/API and browser E2E testing.

Keep `frontend/` and `backend/` as separately maintained applications with independent package manifests and scripts where appropriate. The browser communicates with the backend through documented HTTP APIs. Frontend code must not contain AI keys, database credentials or server-only modules. The backend owns auth, authorization, persistence, validation, quotas and provider requests.

Verify currently supported versions from official documentation during implementation. Record selected versions accurately; do not invent package versions.

## 6. Absolute prohibition: fake, dummy and placeholder implementation

This rule is mandatory and must also be enforced from `AGENT.md`.

Never introduce or retain:
- fake users, demo accounts, synthetic activity or fabricated dashboard metrics;
- dummy reviews, canned AI findings, hardcoded reports or simulated analysis;
- mock production endpoints or in-memory arrays presented as database persistence;
- fake authentication success, authorization bypasses or hardcoded sessions;
- fake loading completion, success notifications or simulated network responses;
- nonfunctional buttons, dead links, decorative controls represented as functional or routes that lead nowhere;
- placeholder copy, invented logos, random avatars, arbitrary dates or artificial history;
- unimplemented provider fallback presented as operational;
- fabricated test results, benchmark numbers, security assurances, coverage percentages or deployment status;
- empty files, token files, skeleton documentation or tiny files created only to make a directory look complete.

Test fixtures/provider stubs are permitted only inside isolated test code and must never leak into production builds, default screens or production databases. Tests must identify clearly when a stub is used; passing a stub test does not establish live-provider availability.

Do not leave unresolved `TODO`, `FIXME`, `TBD`, `XXX` or `HACK` markers, abandoned stubs, empty handlers, no-op callbacks, empty catch blocks or temporary bypasses in delivered implementation. Resolve them or identify an explicit release blocker. Never claim production readiness with release-blocking gaps.

If a provider key, database, email service or deployment credential is missing, display a truthful actionable configuration/unavailable state. Never fabricate a successful response.

## 7. UI/UX direction

Build a premium, restrained and professional developer workspace. Prioritize clarity, focus, performance, usability and information hierarchy over decoration.

- Dark-first developer workspace, with optional light theme only if complete and tested.
- Deep neutral surfaces with controlled violet/indigo accents.
- Consistent type, spacing, borders, elevation and semantic status colors.
- Purposeful short transitions and reduced-motion support.
- Clear editor hierarchy and predictable panels.
- Polished real loading, empty, error, success and access-denied states.
- No charts unless derived from actual persisted data.
- No fake online status, notifications or recent activity.

Primary target: desktop Chrome and Firefox. Support practical desktop viewport widths and mouse/keyboard input. Do not build or claim Android support. At narrow browser widths, preserve legibility with a compact desktop layout or state the minimum usable workspace width; do not ship a broken desktop layout squeezed onto a phone.

## 8. Required screens

Implement and document the screens justified by the product scope:
- public product introduction, if appropriate;
- registration;
- login;
- authenticated workspace/dashboard;
- code editor workspace;
- review report detail;
- review history with search, filters and sorting;
- account/profile and security settings;
- application/editor preferences only where genuinely implemented;
- notification panel only for real persisted events;
- not-found and access-denied states.

Do not create premium/developer subscription, billing, pricing or upgrade screens. Do not create an admin page without a verified and necessary role requirement.

Specify every screen in `SCREENS.md`, every flow in `UX-FLOWS.md` and `WEBSITE-FLOW.md`, conditional behavior in `CONDITIONAL-LOGIC.md`, and controls in design/testing docs.

## 9. Editor and analysis behavior

Monaco must initialize and operate genuinely. Language selection must update editor mode and backend analysis metadata. Distinguish syntax highlighting support from static-analysis tool support and AI review support. Do not imply that a language receives deterministic static analysis merely because Monaco highlights it.

For each review:
1. Authenticate the user and verify authorization.
2. Validate language, source size, content type, request limits and rate limits.
3. Create a traceable review lifecycle record.
4. Apply secret-detection/redaction safeguards where feasible and disclose third-party AI processing.
5. Construct a bounded, versioned analysis request.
6. Call the provider from backend only.
7. Apply timeout, retry, concurrency and error policy.
8. Validate response against a strict schema.
9. Reject malformed output; never convert it to fabricated findings.
10. Persist the actual report and safe analysis metadata.
11. Return the report only to its owner.
12. Allow reopening from history.

Separate categories: bug/correctness, potential security, performance, maintainability/code quality, improved code. A finding should include stable identifier, category, severity when meaningful, confidence/evidence strength, title, explanation, impact, source location only when determinable, recommendation and supporting evidence. Do not invent line numbers. Distinguish deterministic tool output from AI suggestions. Explain uncertainty and false-positive risk.

Do not execute submitted code on the web server, API process, ordinary worker or development host. Initial scope is static/AI-assisted review, not code execution. Future execution would require a separately approved threat model and isolated sandbox with strict CPU, memory, time, filesystem, network and process controls.

## 10. History, search, filters, sorting and notifications

History must use real backend queries and owner scoping. Support search over safe indexed metadata, language/status/date filters and category/severity filters where actual fields exist. Sorting must use allowlisted fields and stable tie-breakers. Pagination must be bounded. Changing filters resets pagination. Never expose another user's data.

Notifications must correspond to real persisted state changes. If analysis is synchronous, inline status feedback may be sufficient; do not display a fake background-job notification center. If async processing is implemented, use a genuine queue/lifecycle and persisted notification model.

## 11. Backend and database integrity

Document collections, ownership, indexes, validation, retention and deletion in `DATABASE.md`. Document actual REST routes and schemas in `API.md`. Use consistent error envelopes, status codes, request IDs and authorization checks. At minimum support current user, review submission, list/search/filter/sort, report retrieval and deletion. Do not document endpoints that do not exist.

Persist lifecycle transitions. Handle duplicate submissions, retries and interrupted provider calls deliberately. Never store plaintext passwords, API keys or unnecessary full provider payloads. Define source retention and user deletion.

## 12. Security and privacy

Implement HTTPS at deployment boundaries, secure headers, strict CORS, CSRF controls where cookie auth is used, secure session/token lifecycle, password hashing, login throttling, request validation, safe output rendering, least privilege, secret management, dependency scanning and redacted logging.

Treat source code as confidential. Disclose when code is sent to an external AI provider. Do not log source, passwords, tokens, session identifiers or keys. Rate-limit and bound requests. Enforce owner scope in every review query. Treat submitted comments and source as untrusted data, never as instructions to the AI. Do not claim a compliance certification without evidence.

## 13. Browser, accessibility and performance

Test current stable desktop Chrome and Firefox and record actual versions. Do not claim untested browser support. Target WCAG 2.2 AA practices: keyboard access, visible focus, contrast, semantic structure, labels, status announcements, non-color cues and reduced motion. Document any real Monaco accessibility limitation.

Measure page load, Monaco initialization, API latency, provider duration and history queries. Use lazy loading, bounded pagination, safe caching and relevant indexes. Do not invent performance benchmarks.

## 14. Debugging and testing

Test clean installs/builds, frontend/backend lint, unit tests, schema validation, DB integration, auth and ownership, API contracts, provider adapters, malformed AI output, timeouts/rate limits/outages, Chrome/Firefox E2E, desktop responsiveness, keyboard/accessibility, security, persistence across restart, deletion, links and nonfunctional controls.

Inspect browser console/network, backend logs and database behavior. Fix root causes, add regression tests and rerun relevant suites. A skipped test is not passed. Record exact commands, environment, outcomes and limitations.

## 15. CI/CD and deployment

Create reproducible install, formatting/lint, unit/integration, build, security/dependency and artifact stages. Protect secrets. Include environment validation, health checks, index/migration setup, staging smoke tests and rollback. Distinguish configured deployment from actual deployed and verified deployment.

## 16. Required Markdown documentation suite

Create meaningful, nonempty and substantive Markdown files:
- `README.md`
- `MASTER-ARENA-PROMPT.md`
- `PRD.md`
- `PRD2.md`
- `AGENT.md`
- `SOP.md`
- `REPOSITORY-AUDIT.md`
- `SCREENS.md`
- `UX-FLOWS.md`
- `CONDITIONAL-LOGIC.md`
- `GESTURES.md`
- `DESIGN-SYSTEM.md`
- `WIREFRAMES.md`
- `WEBSITE-FLOW.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `API.md`
- `SECURITY.md`
- `PERFORMANCE.md`
- `SEO.md`
- `ACCESSIBILITY.md`
- `TESTING.md`
- `CI-CD.md`
- `ERROR-STATES.md`
- `NOTIFICATIONS.md`
- `DEPLOYMENT.md`
- `PRE-RELEASE.md`
- `ASSETS-AND-BRANDING.md`
- `CONTENT-AND-COPY.md`
- `CHANGELOG.md`
- `docs/DOCUMENTATION-INDEX.md`

Each document must provide meaningful requirements or operational instructions, not just a title or outline. Keep documents synchronized with actual implementation. Separate normative requirements, observed implementation and proposed work.

## 17. Execution phases and exit gates

**Phase A — Discovery:** clone, inventory, read PPT, audit and map requirements to evidence.  
**Phase B — Design:** finalize scope, language capability, navigation, DB, API, AI schema, threat model and design system.  
**Phase C — Foundation:** establish separate frontend/backend, config, DB, health checks, auth and contracts.  
**Phase D — Core product:** Monaco, language selection, submission, real AI integration, report and persistence.  
**Phase E — Product quality:** real search/filter/sort, appropriate preferences/status events, error states, accessibility, animation and browser compatibility.  
**Phase F — Verification:** full test, debug, security and persistence checks; repeat after fixes.  
**Phase G — Delivery:** update docs, pre-release gate, create and verify complete source ZIP.

## 18. Final application ZIP

Include application source, frontend, backend, assets and license notices, docs, tests, CI configuration, safe deployment configuration, `.env.example` with variable names/explanations only, and lockfiles. Exclude `.env`, keys, credentials, certificates, keystores, node_modules, caches, temporary files, local databases containing real user data and unrelated personal files.

Verify archive listing, required content, no empty files, secret scan and ZIP integrity. Generate SHA-256. Do not call it complete while required files are missing.

## 19. Final delivery report

Report repository origin and starting commit, implemented features, selected architecture/versions, documentation inventory, exact test pass/fail/skip outcomes, actual browser versions, security/dependency outcomes, known limitations, deployment status and ZIP size/checksum/integrity. Never claim unverified work as complete. Completion means implementation, docs and evidence agree.
