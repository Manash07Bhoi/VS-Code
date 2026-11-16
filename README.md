# CodeSense AI

AI-powered code review and bug detection platform for developers. Submit source code, select a language, and receive structured AI-assisted findings with explanations, impact, and recommendations — plus persistent review history per account.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-red.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-green.svg)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://ai.google.dev/)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-purple.svg)](https://microsoft.github.io/monaco-editor/)

Repository: https://github.com/Manash07Bhoi/VS-Code

---

## Project overview

**CodeSense AI** is a desktop-browser code-review workspace. Developers write or paste source code, choose a supported language, and submit it for AI-assisted analysis. The backend calls the Gemini AI provider (server-side only — the API key never reaches the browser), validates the structured output, and persists every review to the user's account. Users can reopen, search, and delete their review history.

**Intended users:** learners and developers who want a second set of eyes on their code, with explanations written in beginner-friendly plain language.

**Main workflow:**
1. Register or sign in (secure session, password hashed with bcrypt).
2. Open the editor (Monaco Editor with syntax highlighting).
3. Select a language (JavaScript, TypeScript, Python, Java, or C++) and paste source.
4. Click **Analyze code** — the source is sent to the AI provider and returned as categorized findings (bug/correctness, security, performance, code-quality) with severity, confidence, evidence, and source-line references.
5. View the review report, jump to a finding's source line, and save it to your history.
6. Open past reviews from History, delete reviews you no longer need, and sign out.

**AI provider behavior (honest):** The Gemini API key is **optional**. If no key is configured, the backend starts normally and returns a truthful `provider-unavailable` state for review requests — it never fabricates findings. Live AI analysis requires a real `GEMINI_API_KEY`.

---

## Key features (implemented & verified)

- **AI-powered code review** — structured findings via the Gemini provider with strict output validation.
- **Bug, security, performance, and code-quality findings** — each with severity, confidence, title, explanation, impact, recommendation, evidence, and source location.
- **Multi-language editor** — Monaco Editor with syntax highlighting for 5 languages.
- **Supported languages:** JavaScript, TypeScript, Python, Java, C++ (all registered and review-enabled).
- **Review history** — every review is persisted to the signed-in account; owner-scoped (users only see their own reviews).
- **Authentication** — registration, login, logout, session rotation on login (session-fixation resistance), generic credential errors (no account enumeration).
- **Review persistence & deletion** — create, retrieve, and delete your own reviews; cross-user access returns 404 (no data leak).
- **Security controls** — CSRF double-submit token, `HttpOnly`/`Secure`/SameSite cookies, CORS restricted to the configured origin, bcrypt password hashing (work factor 12), request size limits, rate limiting on auth and review endpoints.
- **Error / loading / empty states** — loading spinners, error toasts, empty-state messages, provider-unavailable handling.
- **Health checks** — `GET /api/v1/health/live` (liveness) and `GET /api/v1/health/ready` (database readiness; provider reported separately and does not block readiness).

**Not yet live (credential-dependent):** live Gemini analysis (needs a real `GEMINI_API_KEY`), production cross-origin deployment (needs a backend host and frontend/backend on separate origins), and production browser E2E / Lighthouse (needs a live deployed full-stack app).

---

## Screenshots

Actual application screenshots are captured in `artifacts/screenshots/`:
- Landing page
- Register / Login
- Dashboard
- Code editor (Monaco)
- Review results
- History
- Settings

> Browser-based visual QA (Playwright/Chromium) could not be executed in this sandbox because Chromium cannot launch due to missing system shared libraries and no root access to install them. Screenshots reflect the source-rendered UI; the frontend is deployed at https://codesenseai-review.netlify.app.

---

## Architecture

```mermaid
flowchart TB
    subgraph Browser["Client (Browser)"]
      UI[HTML / CSS / Vanilla JS]
      MON[Monaco Editor]
      API[API Client — fetch + credentials + CSRF token]
    end

    subgraph Netlify["Frontend Hosting — Netlify"]
      FE[Static frontend — index.html, JS, CSS]
    end

    subgraph Backend["Backend — Node.js + Express"]
      SRV[Express server]
      AUTH[Auth — register/login/logout/session]
      CSRF[CSRF double-submit middleware]
      RATE[Rate limiting]
      VAL[Zod validation]
      SVC[Review service]
      PROV[Gemini provider adapter]
    end

    subgraph DB[("MongoDB")]
      USERS[(users)]
      REVS[(reviews)]
    end

    UI --> FE
    FE -->|HTTPS| API
    API -->|/api/v1| SRV
    SRV --> AUTH
    SRV --> CSRF
    SRV --> RATE
    SRV --> VAL
    SRV --> SVC
    SVC --> PROV
    PROV -.->|server-side only| Gemini[(Gemini API)]
    SVC --> USERS
    SVC --> REVS
    AUTH --> USERS
```

- **Frontend:** single-page static site (HTML/CSS/vanilla JS), hash-based routing, deployed to Netlify.
- **Backend:** Express REST API (`/api/v1`), server-side only. Sessions via `express-session` + `connect-mongodb-session` (MongoDB). Passwords hashed with bcrypt.
- **AI provider:** `GeminiAdapter` calls Gemini server-side with a total operation deadline, per-attempt timeout, transient-only retry (429/503/504/abort), no retry on 401/403/400, and timer cleanup in `finally`.
- **Database:** MongoDB with `users` and `reviews` collections; reviews are owner-scoped by `owner` (userId).

---

## Technology stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20+ |
| Backend framework | Express | 4 |
| Database / ODM | MongoDB / Mongoose | 8 |
| Validation | Zod | 3 |
| Password hashing | bcrypt | 5 |
| AI provider | @google/generative-ai | 0.21.0 |
| Frontend editor | Monaco Editor | 0.52.0 (CDN) |
| Frontend language | Vanilla JavaScript (ES modules) | — |
| Styling | CSS (custom design system) | — |
| Testing | node:test + supertest | — |
| Linting | ESLint 9 (flat config) | — |
| Frontend hosting | Netlify | — |

---

## Supported languages

| Language | Monaco ID | API accepted | Editor configured | Live AI analysis |
|----------|-----------|--------------|-------------------|------------------|
| JavaScript | javascript | ✅ | ✅ | Needs `GEMINI_API_KEY` |
| TypeScript | typescript | ✅ | ✅ | Needs `GEMINI_API_KEY` |
| Python | python | ✅ | ✅ | Needs `GEMINI_API_KEY` |
| Java | java | ✅ | ✅ | Needs `GEMINI_API_KEY` |
| C++ | cpp | ✅ | ✅ | Needs `GEMINI_API_KEY` |

All five languages are registered in the backend, accepted by the review API, and configured in the Monaco Editor. **Live AI analysis per language is not verified** because no `GEMINI_API_KEY` is available; when no key is configured, reviews return an honest provider-unavailable state (never fabricated).

---

## Project structure

```
codesense-ai/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── .editorconfig
├── .env.example                  # root environment variable names (placeholders only)
├── .gitignore
├── frontend/                     # static SPA (deployed to Netlify)
│   ├── index.html
│   ├── netlify.toml              # Netlify build + SPA redirect config
│   ├── css/                      # tokens, base, components, pages
│   └── js/
│       ├── app/                  # api, auth, monaco, router, state
│       ├── components/           # modal, navbar, toast
│       ├── pages/                # landing, register, login, dashboard, editor, review, history, settings, 404
│       └── main.js               # entry point
├── backend/                      # Node.js + Express API
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── eslint.config.js
│   ├── scripts/ensure-indexes.js
│   ├── src/
│   │   ├── app.js
│   │   ├── config/               # env, database, languages
│   │   ├── middleware/           # auth, csrf, rateLimit, validation, error, requestId
│   │   ├── modules/              # auth, health, languages, reviews (routes)
│   │   ├── models/               # User, Review
│   │   ├── providers/            # gemini, base
│   │   ├── repositories/         # reviewRepository, userRepository
│   │   ├── services/             # reviewService
│   │   ├── utils/                # crypto, logger
│   │   └── validators/           # schemas
│   └── tests/                    # auth, languages, reviews, provider (mocked)
├── docs/
│   ├── implementation/           # architecture, API, database, security, AI provider, 5 languages, CI/CD, release, traceability, changelog
│   └── audits/                   # complete documentation audit, traceability matrix, gap register
├── tests/
│   └── e2e.js                    # Playwright browser E2E (blocked in this sandbox)
├── presentation.pptx
└── CodeSense_AI_Source_Final.zip # prior source archive
```

---

## Installation and local setup

### Prerequisites
- Node.js >= 20 (LTS)
- MongoDB (accessible via `MONGODB_URI`; a least-privilege database user is recommended)
- A Gemini API key (optional — see below)

### 1. Clone the repository
```bash
git clone https://github.com/Manash07Bhoi/VS-Code.git
cd VS-Code
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI, SESSION_SECRET, etc.
# GEMINI_API_KEY is optional — leave it empty for provider-unavailable behavior.
npm start
```
The backend starts on `http://localhost:3000` (configurable via `PORT`).

### 3. Frontend
The frontend is a static SPA served by the backend in development, or deployed to Netlify in production. No build step is required.

Open `frontend/index.html` directly, or serve it with any static file server pointing at the `frontend/` directory.

### 4. Run the test suite
```bash
cd backend
npm test
```
Expected: 18/18 tests pass, exit code 0 (auth, languages, reviews, and a mocked Gemini provider suite).

### 5. Lint
```bash
cd backend
npm run lint
```
Expected: 0 errors.

---

## Environment variables

All variables are documented with placeholders only — **never commit real credentials.**

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://127.0.0.1:27017/codesense_ai_test` |
| `SESSION_SECRET` | Yes | Session signing secret | long random string, unique per environment |
| `FRONTEND_ORIGIN` | Yes | CORS origin (no trailing slash) | `https://your-frontend.netlify.app` |
| `CSRF_SECRET` | No | CSRF secret (defaults to `SESSION_SECRET`) | long random string |
| `GEMINI_API_KEY` | **No** | Gemini API key (backend-only). Optional — backend starts without it and returns provider-unavailable. | (leave empty to test unavailable path) |
| `GEMINI_MODEL` | No | Gemini model name | `gemini-1.5-flash-latest` |
| `PORT` | No | Backend port | `3000` |
| `HOST` | No | Bind host | `0.0.0.0` |
| `SECURE_COOKIES` | No | Sets `Secure` cookie flag (true in production) | `true` |
| `COOKIE_SAMESITE` | No | Cookie SameSite (`lax` same-site / `none` cross-site) | `lax` |
| `COOKIE_DOMAIN` | No | Cookie domain (conditional) | `your-domain.com` |
| `SESSION_MAX_AGE_MS` | No | Session lifetime | `604800000` (7 days) |
| `REVIEW_SOURCE_SIZE_LIMIT_BYTES` | No | Max source size | `65536` (64 KiB) |
| `GEMINI_TIMEOUT_MS` | No | Per-attempt provider timeout | `60000` |
| `GEMINI_MAX_RETRIES` | No | Max transient retries | `2` |
| `GEMINI_MAX_OUTPUT_CHARS` | No | Max provider output chars | `32768` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate-limit window | `60000` |
| `RATE_LIMIT_MAX_AUTH` | No | Auth rate-limit max | `10` |
| `RATE_LIMIT_MAX_REVIEW` | No | Review rate-limit max | `30` |
| `RATE_LIMIT_MAX_GENERAL` | No | General rate-limit max | `100` |
| `LOG_LEVEL` | No | Log level | `info` |
| `NODE_ENV` | No | Environment | `development` |

See `backend/.env.example` and root `.env.example` for the full commented reference.

---

## API documentation

Base path: `/api/v1`. All mutating endpoints require a valid session cookie and CSRF token (`X-CSRF-Token`).

| Method | Endpoint | Auth | CSRF | Description |
|--------|----------|------|------|-------------|
| `GET` | `/auth/csrf-token` | No | No | Get a CSRF token bound to the session |
| `POST` | `/auth/register` | No | No | Register an account (returns fresh CSRF token) |
| `POST` | `/auth/login` | No | No | Sign in (returns fresh CSRF token) |
| `POST` | `/auth/logout` | Yes | Yes | Sign out and destroy session |
| `GET` | `/auth/me` | Yes | No | Get current user |
| `GET` | `/languages` | No | No | List supported languages |
| `POST` | `/reviews` | Yes | Yes | Create a code review |
| `GET` | `/reviews` | Yes | No | List current user's reviews (owner-scoped) |
| `GET` | `/reviews/:reviewId` | Yes | No | Get a review (owner-scoped) |
| `DELETE` | `/reviews/:reviewId` | Yes | Yes | Delete a review (owner-scoped) |
| `GET` | `/health/live` | No | No | Process liveness |
| `GET` | `/health/ready` | No | No | Database readiness (provider reported separately) |

Review request body: `{ source, language, title?, clientRequestId? }`. Source must be non-empty and within the size limit (default 64 KiB); language must be registered.

---

## Security and privacy

- **Secrets stay server-side:** `GEMINI_API_KEY`, `MONGODB_URI`, `SESSION_SECRET`, `CSRF_SECRET` are backend-only. The frontend contains no keys.
- **Passwords:** hashed with bcrypt (work factor 12); plaintext never stored or logged.
- **Sessions:** rotated on login/logout; destroyed on logout; `HttpOnly`, `Secure` (when `SECURE_COOKIES=true`), SameSite configurable.
- **CSRF:** double-submit token required on all state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`).
- **CORS:** restricted to `FRONTEND_ORIGIN` with credentials enabled.
- **Input validation:** Zod schemas on all request bodies; source size capped at 64 KiB; output from the AI provider is schema-validated and sanitized before being stored or rendered.
- **No code execution:** submitted source code is treated as data for AI analysis only — it is never compiled or executed.
- **Error messages:** generic (no account enumeration, no secret leakage).
- **Access control:** reviews are owner-scoped in the database query itself; cross-user access returns 404.

See `SECURITY.md` for the full security policy.

---

## Testing

| Suite | Command | Result |
|-------|---------|--------|
| Auth | `npm test` (backend) | PASS |
| Languages | `npm test` (backend) | PASS |
| Reviews (CRUD + authz + CSRF) | `npm test` (backend) | PASS |
| Gemini provider (mocked, deterministic) | `npm test` (backend) | PASS (15 tests) |
| Lint | `npm run lint` (backend) | 0 errors |
| Frontend syntax | `node --check` on all JS files | PASS |

**Total:** 18/18 backend tests pass, exit code 0.

**AI tests are deterministic and use a mocked provider** — no real Gemini network call is made, and no API key is required. Live Gemini integration is a separate credential-dependent scenario.

Browser E2E (`tests/e2e.js`, Playwright/Chromium) could not be executed in this sandbox because Chromium cannot launch (missing system shared libraries, no root access to install them).

---

## Deployment

### Frontend (deployed)
The frontend is deployed to Netlify:
- **URL:** https://codesenseai-review.netlify.app
- Configured via `frontend/netlify.toml` (SPA redirect `/* → /index.html`, cache and security headers).
- Deploy command: `netlify deploy --dir=frontend --prod`

### Backend
The backend is a Node.js/Express app (`npm start`) and requires a hosting provider that runs Node.js and can connect to MongoDB. **No backend hosting credentials were available, so backend deployment is blocked.** To run in production you need:
- A Node.js host with `PORT`, `HOST`, `NODE_ENV=production`
- `MONGODB_URI` to a production MongoDB (least-privilege user, TLS)
- `SESSION_SECRET`, `CSRF_SECRET` (per-environment random values)
- `FRONTEND_ORIGIN` set to your deployed frontend URL
- `SECURE_COOKIES=true`
- Optional `GEMINI_API_KEY` / `GEMINI_MODEL` for live AI analysis

### Database
MongoDB (local or Atlas). Connection string via `MONGODB_URI`. Indexes are managed by `backend/scripts/ensure-indexes.js`.

### Cross-origin authentication
When frontend and backend are on separate origins, set `SECURE_COOKIES=true`, `COOKIE_SAMESITE=none`, and `COOKIE_DOMAIN` to your domain. This has not been verified against live deployed domains (blocked: no backend deployment).

---

## Limitations

- **Live Gemini analysis** — requires a real `GEMINI_API_KEY`; not verified. Provider-unavailable behavior is verified instead.
- **Backend deployment** — no Node.js hosting credentials available; backend runs locally only.
- **Production database** — no `MONGODB_URI` / MongoDB Atlas credentials available.
- **Cross-origin auth** — not verified against live domains (needs deployed frontend + backend).
- **Browser E2E / Lighthouse** — Chromium cannot launch in this sandbox (missing system libraries, no root); not executed.
- **Dependabot PRs** — 4 open dependency-update PRs (eslint, mongoose, puppeteer, @google/generative-ai) are deferred; merging them requires regression testing.

---

## Roadmap

- Deploy backend to a Node.js host and connect production MongoDB.
- Configure real `GEMINI_API_KEY` and verify live AI analysis across all 5 languages.
- Verify cross-origin authentication on deployed domains.
- Run Playwright E2E and Lighthouse against the live full-stack app.
- Add email verification / password reset (requires an email provider).
- Add account deletion endpoint.

---

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Install dependencies (`cd backend && npm install`).
3. Make your changes and run the test suite (`npm test`) and linter (`npm run lint`).
4. Ensure no secrets are introduced (`.env` is not tracked).
5. Open a pull request against `main`. CI runs lint, tests, dependency audit, secret scan, and frontend syntax checks.

The `main` branch is protected: force pushes and branch deletion are prevented, and the `CI / lint-and-test` status check is required.

---

## License

This project is licensed under the MIT License. See `LICENSE`.

---

## Acknowledgements and contact

No contributors, partner organizations, or institutional affiliations are claimed. Questions about the project can be raised via GitHub Issues on this repository.
