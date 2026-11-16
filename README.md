# CodeSense AI

**A VS Code-inspired AI-powered browser-based developer workbench.** Multi-file Monaco editing, an AI code-review studio, honest local change tracking, a command palette, and a live status bar — built on a secure Express/MongoDB backend with Gemini-powered review (server-side only; the API key never reaches the browser).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-red.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-green.svg)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://ai.google.dev/)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-purple.svg)](https://microsoft.github.io/monaco-editor/)

Repository: https://github.com/Manash07Bhoi/VS-Code

---

## Project overview

**CodeSense AI** combines three things in one browser application:

1. **A VS Code-like AI IDE** — activity bar, explorer with a real file tree, multi-file tabs with dirty state, command palette (`Ctrl+Shift+P`) and quick open (`Ctrl+P`), status bar reflecting live editor state, Problems/Output/Terminal panels, dark and light themes.
2. **A premium AI Code Review Studio** — review the current file, a selection, or with a security focus; every review is persisted to your account with severity, confidence, evidence and line references; findings navigate to real source lines and refuse to when they have gone stale; "generate fix suggestions" proposes improved code in a side-by-side diff that is only applied when you approve it.
3. **A developer workbench** — workspace-wide search & replace, honest local change tracking with checkpoints (clearly **not** Git), and truthful unavailable states for terminal/run/debug that document exactly what a safe implementation would require instead of faking it.

**Intended users:** learners and developers who want a second set of eyes on their code, with explanations written in beginner-friendly plain language.

**Honesty policy:** if the Gemini API key is not configured, every AI action returns a truthful provider-unavailable state — nothing is simulated. No user-submitted code is ever executed. The browser-local workspace is labeled as browser-local, never as server storage or version control.

---

## Screenshots (actual application)

All screenshots below are captured by the automated browser tests from the real application (committed under `tests/artifacts/screenshots/`):

| Workbench — desktop 1920×1080 | Workbench — mobile 360×800 |
|---|---|
| ![Workbench desktop](tests/artifacts/screenshots/workbench-desktop-1920.png) | ![Workbench mobile](tests/artifacts/screenshots/workbench-mobile-360.png) |

| Workbench + panels — laptop 1366×768 | Workbench + panels — tablet 768×1024 |
|---|---|
| ![Workbench laptop panels](tests/artifacts/screenshots/workbench-laptop-1366-panels.png) | ![Workbench tablet panels](tests/artifacts/screenshots/workbench-tablet-768-panels.png) |

Additional evidence: Playwright HTML report (`tests/artifacts/html-report/`) and Lighthouse audits (`tests/artifacts/lighthouse/`).

---

## Key features (implemented & verified)

### The workbench
- **Activity bar & panels** — Explorer (file tree, folders, context menu, create/rename/delete with confirmations), Search (case/regex, match navigation, guarded replace-all), Source Control (local changes + checkpoints, honestly not Git), Run/Debug and Terminal (truthful unavailable states with the architecture they would require), Supported Integrations (live language registry + provider status), AI Review, Problems with a live count badge.
- **Multi-file editor** — Monaco with one model per file, tabs (dirty dots, close/close-others, middle-click), unsaved-change protection, persisted open editors, find/replace, folding, minimap, multi-cursor, JS/TS syntax diagnostics in the Problems panel.
- **Command palette** — 28 working commands (save, save all, new file, open file, find, replace, panel toggles, theme, language, AI actions…) with keybinding hints. No dead commands.
- **Status bar** — live language, cursor position and selection, indentation, encoding, line endings, unsaved count, problems.
- **Diff viewer** — Monaco diff for local changes and AI proposals with explicit Accept/Reject; accepting only marks the file dirty — you still save.
- **Themes** — dark and light, persisted.
- **Responsive** — verified by automated tests at 360×800, 390×844, 768×1024, 1366×768 and 1920×1080.

### AI review
- **Review current file / selection / security focus** — persisted findings (bug/correctness, security, performance, code-quality) with severity, confidence, explanation, impact, recommendation, evidence, line references, caveats.
- **Explain code** and **Generate fix suggestions** — ephemeral assist results (never persisted server-side) with the diff-review workflow.
- **Review history** — owner-scoped persistence, filters, pagination, deletion.

### Platform
- **Authentication** — registration, login, logout, session rotation on login, generic credential errors (no account enumeration), bcrypt (work factor 12).
- **Security controls** — CSRF double-submit, HttpOnly/Secure/SameSite cookies, CORS allow-list, request size limits, rate limiting on API routes, CSP with CDN allow-lists, secret scanning in CI.
- **Health checks** — liveness and readiness endpoints.

### Verified quality (this release)
- Backend test suite: **19 files, all passing** (deterministic mocked provider tests included).
- Browser QA: **Playwright 7/7** across five viewports (evidence committed) and **puppeteer e2e 29/29 checks**.
- Lighthouse (mobile emulation, real backend+frontend): performance 0.90–0.99, **accessibility 1.00**, **SEO 1.00**, CLS 0.
- Dependency audit: **0 vulnerabilities** (from 15 reproduced at baseline, incl. 1 critical — see `docs/security/VULNERABILITY_REGISTER.md`).

**Not implemented (by design):** terminal, code execution, debugging, real Git integration — each has a truthful unavailable state and documented architecture; see `docs/implementation/KNOWN_LIMITATIONS.md`. **Credential-dependent:** live Gemini analysis needs a real `GEMINI_API_KEY`.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES modules), HTML, CSS — no framework; Monaco Editor 0.52 via CDN (CSP allow-listed) |
| Backend | Node.js ≥ 20, Express 4, Zod v4 validation |
| Database | MongoDB 8 with Mongoose |
| AI | Google Gemini (`@google/generative-ai`), server-side only |
| Auth | Session cookies + CSRF (connect-mongodb-session store) |
| Browser QA | Playwright + Puppeteer (devDependencies only) |
| CI | GitHub Actions (lint, tests, secret scan, browser QA, e2e) |

---

## Architecture

See `docs/architecture/`:
- `SYSTEM_ARCHITECTURE.md` — topology, trust boundaries, deployment reality
- `IDE_WORKBENCH_ARCHITECTURE.md` — the workbench module map and behaviors
- `AI_REVIEW_ARCHITECTURE.md` — review/assist flows, prompt-injection resistance
- `SECURITY_ARCHITECTURE.md` — auth/session/CSRF/rate-limit/execution policy
- `DATA_FLOW.md` — end-to-end data flows

```
Browser (SPA + workbench + browser-local workspace)
   │  JSON + session cookie + CSRF
   ▼
Express API (/api/v1: auth, languages, reviews, assist, health)
   │
   ├── MongoDB (users, sessions, reviews)
   └── Gemini provider (server-side key)
```

---

## Installation (local development)

Prerequisites: Node.js ≥ 20, MongoDB running on `127.0.0.1:27017`.

```bash
git clone https://github.com/Manash07Bhoi/VS-Code.git
cd VS-Code/backend
npm ci
cp .env.example .env    # fill in the required variables (never commit .env)
npm run dev             # serves frontend + API on http://localhost:3000
```

Configuration (all variables documented in `backend/.env.example`):
- Required: `MONGODB_URI`, `SESSION_SECRET`, `FRONTEND_ORIGIN`
- Optional: `GEMINI_API_KEY` + `GEMINI_MODEL` (without them the app runs and shows honest provider-unavailable states), rate-limit tuning, cookie/CSRF settings

---

## Testing

```bash
cd backend
npm run lint            # ESLint (0 errors)
npm test                # 19 test files (needs MongoDB on 127.0.0.1:27017)

# Browser QA (backend running on :3000)
node tests/e2e.js                                    # puppeteer e2e (29 checks)
node backend/node_modules/@playwright/test/cli.js test --config playwright.config.js
```

Evidence and details: `docs/testing/` (strategy, Playwright report, regression report, Lighthouse report).

---

## Security notes

- The Gemini API key never leaves the backend.
- No user-submitted code is executed anywhere (no terminal/execution/debugging — see KNOWN_LIMITATIONS.md).
- Dependency audit: **0 vulnerabilities** (register: `docs/security/VULNERABILITY_REGISTER.md`).
- Report vulnerabilities via GitHub issues; see `SECURITY.md`.

---

## Deployment status (honest)

- **Frontend:** static deployment on Netlify (SPA redirect + cache headers via `netlify.toml`). The deployed frontend requires a running backend for authenticated features — it is **not** a complete production application by itself.
- **Backend:** **not deployed** — no production database, API host, or provider credentials exist for this project. Running the backend is a documented local-development workflow (above). The CD workflow reports an explicit BLOCKED state rather than pretending to deploy when its secrets are absent.

---

## Known limitations & roadmap

Direct list in `docs/implementation/KNOWN_LIMITATIONS.md` (execution/debugging, language servers for Python/Java/C++, browser-local workspace, advisory-only AI findings, and more).

Future roadmap (planned, not implemented): authenticated backend Git service, sandboxed execution runtime (container architecture documented), server-persisted workspaces, real IntelliSense via language servers, authenticated Lighthouse gatherer for the workbench pages.

---

## License

MIT — see `LICENSE`.
