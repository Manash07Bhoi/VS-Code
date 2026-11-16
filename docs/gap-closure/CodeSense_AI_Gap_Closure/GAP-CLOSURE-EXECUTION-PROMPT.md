# CodeSense AI — Gap Closure and Actual Application Build Prompt

You are responsible for building and verifying the real CodeSense AI application. Do not stop at documentation, planning, diagrams, mockups or screenshots.

## 1. First action: re-audit the live repository

Clone `https://github.com/Manash07Bhoi/VS-Code.git` into the working environment. Record branch, commit SHA, tracked/untracked files, hidden files and tree. Read every source file, manifest, lockfile, configuration, test, Markdown file and the full `presentation.pptx`. Inspect source file by file and line by line where source exists. Do not infer current state from an earlier audit.

If repository access, clone, credentials or source are unavailable, stop the code-audit claim and report the exact blocker. Do not invent file paths or claim a clone happened.

## 2. Reconcile all documents

Read the original documentation pack and every file in this gap-closure addendum. Build a requirements traceability table. Resolve conflicts through explicit ADRs. Keep the product boundary: desktop browser app, HTML/CSS/Vanilla JS frontend, Node.js/Express backend, MongoDB/Mongoose, Monaco, configured real AI provider, saved review history. No React unless the owner explicitly changes the decision.

## 3. Build the actual application

Create separate `frontend/` and `backend/` directories with non-empty, functional source files. Use modular code with clear boundaries. Implement authentication, editor, five-language capability registry, real provider adapter, structured report, persisted history and deletion. The five-language target is JavaScript, TypeScript, Python, Java and C++.

A language must not be enabled until its entire path passes tests. Do not count syntax highlighting as language review support.

## 4. No fake data, fake logic or fake completion

Never use:
- hardcoded user accounts, fake history, synthetic dashboards or demo activity in production;
- canned AI findings, fixed sample reports or a local array masquerading as API/database data;
- fake progress timers, fabricated success messages or simulated provider responses;
- inert buttons, dead links, no-op handlers or empty catch blocks;
- placeholder business logic or invented metrics;
- fake test output, fake screenshots, fake deployment status or fake benchmark claims.

Test fixtures and provider stubs are allowed only in isolated automated tests. They must be clearly named and must never leak into production runtime. If a real provider key is missing, the review feature must report that configuration is unavailable; it must not show a sample review.

Do not seed production with synthetic users/reviews. Do not create empty files, one-line shells, token files or documentation solely to inflate file counts. Do not leave unresolved TODO/FIXME/TBD/XXX/HACK markers for required work.

## 5. Security boundary

Never execute submitted code or user-controlled shell commands. Treat submitted source and AI output as untrusted. Validate requests and provider output server-side. Enforce owner-scoped access. Keep keys on the backend. Protect auth/session, CSRF/CORS, XSS, rate limits, source size, output size and concurrency. Do not log source or secrets.

## 6. Run and verify

Install from lockfiles. Run format/lint/static checks, unit/integration/contract tests, frontend build, backend startup, database integration and real provider integration where authorized credentials are available. Run Chrome and Firefox E2E for registration, login, code submission, report, history, reload, deletion and logout. Test five languages individually. Test provider outage, invalid response, DB outage, unauthorized report IDs and source-size boundaries.

If any external service is unavailable, mark that test BLOCKED and do not claim complete integration. A local mocked test is not proof of real provider/database integration.

## 7. Final deliverables

- Complete application source tree.
- Updated original documentation and this gap-closure addendum.
- `REQUIREMENTS-TRACEABILITY.md` with evidence.
- `TEST-RESULTS.md` with real outputs.
- `SECURITY-REVIEW.md` and dependency/license inventory.
- `KNOWN-LIMITATIONS.md`.
- `CHANGELOG.md`.
- Complete ZIP that extracts into a clean directory and contains frontend, backend, docs, lockfiles and required assets.
- SHA-256 checksum.
- Exact local setup and run commands verified in the actual environment.

## 8. Final report format

State:
- files inspected and commit SHA;
- exact files created/modified;
- commands actually run and exit codes;
- frontend/backend/database/provider status;
- per-language results;
- Chrome/Firefox results;
- security/performance/accessibility results;
- unresolved defects and blockers;
- whether a real website was started and its verified local URL/port;
- final ZIP path and checksum.

Never say “fully working”, “finished”, “production ready” or “all tests pass” unless every corresponding gate has actual evidence.
