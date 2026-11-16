# Repository Baseline and Evidence Audit — CodeSense AI

## 1. Purpose

This document separates verified repository facts from product requirements and future implementation decisions. Arena must refresh it after cloning and again before release. The PowerPoint's description of a proposed system is not proof that the system exists in code.

## 2. Known repository observation

A connected GitHub repository inspection was performed on **15 November 2026**.

- Repository: `Manash07Bhoi/VS-Code`
- Clone URL: `https://github.com/Manash07Bhoi/VS-Code.git`
- Visibility: public
- Default branch observed: `main`
- Root entries observed: `README.md` and `presentation.pptx`
- README content observed: repository heading and short attribution only.
- PPT observed size: 4,860,855 bytes.

This is a dated baseline. Re-clone/re-inspect and update if the live repository differs. The inspection did not establish a frontend source tree, backend, database, API, tests, deployment configuration or application implementation. Do not claim those components exist because they appear in the presentation.

## 3. Original presentation requirements

The PowerPoint describes CodeSense AI as a web platform for AI-assisted code review and bug detection. Its ten-slide narrative covers:

1. Product identity: CodeSense AI — AI-Powered Code Review and Bug Detection Platform.
2. Problem: manual review takes time, beginners struggle to learn from errors, security/performance/quality coverage can be inconsistent.
3. Response: analyze code, detect issues, explain them and recommend improvements.
4. Scope: web-based code submission, AI review reports and saved history; not a full IDE replacement or a guarantee of complete vulnerability detection.
5. Product view: login/registration, Monaco editor, language selection, AI review, recommendations and history.
6. Proposed technology: HTML/CSS/JavaScript or React, Node.js/Express, REST, MongoDB, Gemini/OpenAI API, JWT and Monaco.
7. Architecture: user, frontend/editor, backend API and AI analysis engine; validate, forward, store and return report.
8. Journey: input, processing, analysis and report output.
9. Illustrative report: bug, security concern, performance suggestion and improved code; slide explicitly labels this output illustrative, not a benchmark.
10. Modules/future scope: authentication, code submission, AI analysis, report, history; future language expansion, real-time analysis, Git integrations, collaboration and personalized assistance.

The slide 9 example is illustrative. It must not be copied into production as a canned report or treated as proof of detection accuracy.

## 4. Feature classification at baseline

| Capability | Baseline classification | Evidence / interpretation |
|---|---|---|
| Product brief | Verified existing | `presentation.pptx` in repository |
| Brief README | Verified existing | Root `README.md` |
| Frontend implementation | Not established | No frontend source entry in inspected root listing |
| Backend implementation | Not established | No backend source entry in inspected root listing |
| MongoDB integration | Not established | Proposed stack in PPT only |
| Authentication | Not established | Described in PPT only |
| Monaco integration | Not established | Described in PPT only |
| AI provider integration | Not established | Gemini/OpenAI listed as proposed options |
| Review persistence/history | Not established | Required by PPT; no baseline code evidence |
| Automated tests | Not established | No test files shown in inspected root listing |
| CI/CD | Not established | No baseline workflow evidence |
| Deployment | Not established | No deployment evidence in baseline |

“Not established” means the inspected evidence did not establish implementation; it is not a permanent claim that a feature cannot exist.

## 5. Mandatory post-clone audit

Arena must:
1. Clone repository and record commit, branch and clean/dirty state.
2. Inventory tracked and relevant untracked files, including hidden files.
3. Inspect nested directories and entry points.
4. Read all docs, manifests and lockfiles.
5. Parse the full PPT, slides, visuals and notes where possible.
6. Identify real startup/build/test commands and run safe checks.
7. Inspect every route, control, handler and API path.
8. Inspect models, indexes, validation, auth, provider calls and errors.
9. Run application screens and real workflows where possible.
10. Record evidence for every status classification.

## 6. Required audit record

For every feature, record name, status, evidence path/symbol/route, verification method, observed defect, user impact, severity, corrective action and regression test. A screenshot does not prove controls work; a successful build does not prove runtime behavior.

## 7. Defect register

Investigate install/build/lint failures, broken routes, dead controls, conditional/validation gaps, browser console errors, failed network calls, API status errors, authentication/session flaws, IDOR, database/index/persistence problems, provider configuration/parsing/timeout/retry behavior, unbounded requests, accessibility/responsive desktop issues, broken links, tracked secrets, dependency/license concerns, missing tests and unreproducible deployment.

## 8. Updating this document

After implementation, add a dated current-state audit with evidence. Keep the original baseline for traceability. Do not invent values to complete tables. Record unavailable checks and why. The final release report must disclose remaining issues.
