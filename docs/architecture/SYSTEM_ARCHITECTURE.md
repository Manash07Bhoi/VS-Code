# System Architecture — CodeSense AI

**Updated:** 2026-11-16 (workbench release)
**Product framing:** A VS Code-inspired AI-powered browser-based developer workbench.

## Topology

```
┌────────────────────────────────────────────┐         ┌──────────────────────┐
│ Browser (any modern desktop/mobile browser)│         │  Backend (Express)   │
│                                            │  HTTP/S │  Node.js ≥ 20        │
│  Vanilla-JS SPA (hash routing)             │────────▶│  /api/v1/*           │
│  ├─ Landing / auth / dashboard / history   │  JSON   │  ├─ auth (sessions)  │
│  ├─ Review report viewer                   │  cookies│  ├─ languages        │
│  └─ WORKBENCH (VS Code-inspired IDE)       │  CSRF   │  ├─ reviews (persist)│
│      ├─ Monaco editor (CDN, CSP allow-list)│         │  ├─ assist (ephemeral)│
│      └─ Browser-local workspace (localStorage)      │  └─ health            │
└────────────────────────────────────────────┘         │          │           │
                                                       │     MongoDB (Mongoose)│
                                                       │     sessions + users  │
                                                       │     + reviews         │
                                                       └──────────┬───────────┘
                                                                  │
                                                       ┌──────────▼───────────┐
                                                       │ Gemini AI provider   │
                                                       │ (server-side only;   │
                                                       │  API key never in    │
                                                       │  browser)            │
                                                       └──────────────────────┘
```

## Components

### Frontend (`frontend/`, dependency-free)
- **Shell** — `index.html` + `js/main.js`: SPA with hash routing (`js/app/router.js`), session-aware navbar, toasts/modals.
- **API client** — `js/app/api.js`: JSON over `fetch`, credentials cookies, CSRF token lifecycle with centralized single-retry on stale token.
- **Workbench** — `js/workbench/*`: the VS Code-inspired IDE (see `IDE_WORKBENCH_ARCHITECTURE.md`).
- **Review pages** — dashboard, history, review report: persisted review browsing.

### Backend (`backend/`, Express + MongoDB)
- **Module layout** — `src/modules/{auth,health,languages,reviews,assist}/routes.js` composed in `src/app.js`.
- **Middleware chain** — Helmet CSP (script/style/worker/connect-src allow-lists), CORS (credentials, explicit origin), JSON body caps (256 KiB), cookie-parser, request IDs, sessions (MongoDB store, `cs.sid` cookie, regenerate-on-login), general rate limiter (API routes only — static assets are deliberately served before the limiter), per-route auth/CSRF/validation/rate-limit middleware.
- **Validation** — zod v4 schemas at every trust boundary (`src/validators/schemas.js`), field-level error responses that never echo source.
- **Provider layer** — `src/providers/gemini.js` (GeminiAdapter) behind `src/providers/base.js`; strict JSON output contracts, sanitization, bounded output; shared retry/deadline/abort loop for `analyze()` and `assist()`.
- **Persistence** — Mongoose models `User`, `Review` (owner-scoped, source retention disclosed); repositories isolate queries.

## Trust boundaries

1. **Browser → backend**: session cookie (httpOnly, SameSite=Lax, Secure in prod) + CSRF token on every mutating request; CORS restricts to the configured frontend origin.
2. **Backend → AI provider**: submitted source travels as data inside prompts with explicit prompt-injection resistance instructions; provider responses are parsed and sanitized before storage/return.
3. **Workbench → browser storage**: the workspace is browser-local (localStorage, 2 MiB / 200-file caps) and is never presented as server persistence or version control.

## Deployment reality

- The **frontend is deployed to Netlify** (static; `netlify.toml` SPA redirect + cache headers). See `release/FINAL_VERIFICATION_REPORT.md` for its current verified status.
- The **backend IS deployed** on Render's free tier: <https://codesense-ai-backend-9skh.onrender.com>
  (`rootDir: backend`, `npm ci --omit=dev` / `npm start`), backed by MongoDB Atlas (`codesense_ai`)
  with sessions persisted in the `sessions` collection and Gemini called server-side only.
- The frontend reaches the API through a **same-origin proxy** (`frontend/_redirects`:
  `/api/*` → the Render service, declared before the SPA fallback), so the `cs.sid` session
  cookie stays first-party with `SameSite=Lax`.
- Operational record, environment variables, verification evidence and free-tier limits:
  `docs/deployment/RENDER_FREE_DEPLOYMENT.md`. This is a **free-tier deployment**, not
  production-grade infrastructure (no static egress IPs, no persistent disk, ~15 min
  idle spin-down with a measured ~22 s cold start).

## Key invariants

- The Gemini API key never leaves the backend.
- No user-submitted code is ever executed (no terminal, no run/debug runtime — see KNOWN_LIMITATIONS.md).
- Every AI action surfaces an honest provider-unavailable state when the provider is not configured; nothing is simulated.
- Rate limits apply to API routes; static assets are exempt so ES-module page loads behind shared proxies cannot self-DoS the app.
