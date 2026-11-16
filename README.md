# CodeSense AI

AI-assisted code review for desktop browsers. Write or paste source code, select a supported language, receive structured findings with evidence and recommendations, and revisit persisted review history.

**Not a full IDE.** No compiler, runtime, debugger, code execution, billing, or premium tiers.

## Repository

- Repository: `https://github.com/Manash07Bhoi/VS-Code.git`
- Branch: `main`
- Original materials preserved: `presentation.pptx` (product brief), `CodeSense_AI_Arena_Documentation_Pack.zip`, `CodeSense_AI_Gap_Closure_Docs_v2.zip`

## Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no framework) |
| Editor | Monaco Editor (CDN) |
| Backend | Node.js (LTS) + Express.js |
| Database | MongoDB + Mongoose |
| Validation | Zod |
| Authentication | Secure server-managed cookie sessions (`express-session` + `connect-mongodb-session`) |
| Password hashing | bcrypt (work factor 12); Argon2id preferred where deployment permits |
| CSRF | Double-submit token (`X-CSRF-Token`) bound to session |
| AI provider | Gemini (primary, server-side only); OpenAI optional if genuinely configured |
| Rate limiting | express-rate-limit (auth, review, general) |
| Security headers | helmet (CSP, HSTS, referrer policy, frame options, content-type options) |

## Project structure

```
codesense-workspace/
├── README.md                      # this file
├── TASKS.md                       # task register
├── .env.example                   # backend environment variable template (names only)
├── .gitignore                     # excludes secrets, dependencies, runtime artifacts
├── presentation.pptx              # original product brief (preserved, unmodified)
├── CodeSense_AI_Arena_Documentation_Pack.zip   # original docs pack (preserved)
├── CodeSense_AI_Gap_Closure_Docs_v2.zip        # original gap-closure docs (preserved)
├── backend/                       # Node.js/Express application
│   ├── package.json               # backend manifest + scripts
│   ├── .env.example               # env var names (template only)
│   ├── .env                       # local dev values ONLY — never committed
│   ├── server.js                  # entry point (fail-fast env, DB connect, graceful shutdown)
│   ├── src/
│   │   ├── app.js                 # Express composition (security headers, CORS, sessions, routes, static)
│   │   ├── config/                # env validation, database, languages registry
│   │   ├── middleware/            # auth, CSRF, rate limit, validation, error, requestId
│   │   ├── models/                # User, Review (Mongoose schemas + indexes)
│   │   ├── modules/               # route modules (auth, health, languages, reviews)
│   │   ├── providers/             # Gemini adapter, base interface
│   │   ├── repositories/          # userRepository, reviewRepository (owner-scoped queries)
│   │   ├── services/              # reviewService (review orchestration)
│   │   ├── utils/                 # crypto (bcrypt), logger (redacted)
│   │   └── validators/            # Zod schemas
│   ├── scripts/
│   │   └── ensure-indexes.js      # idempotent MongoDB index creation
│   └── tests/                     # backend integration tests (auth, languages, reviews)
│       ├── setup.js
│       ├── auth.test.js
│       ├── languages.test.js
│       └── reviews.test.js
├── frontend/                      # Vanilla JS SPA (served by backend)
│   ├── index.html                 # SPA shell (all views inline)
│   ├── css/                       # tokens, base, components, pages
│   └── js/
│       ├── app/                   # api, auth, state, monaco, router
│       ├── components/            # toast, modal, navbar
│       ├── main.js                # SPA bootstrap entry
│       └── pages/                 # register, login, dashboard, editor, review, history, settings
├── tests/
│   └── e2e.js                     # Puppeteer E2E journey test
└── docs/                          # extracted original documentation (33 + 22 files)
```

## Required environment variables

Copy `backend/.env.example` to `backend/.env` and fill in real values. **Never commit `.env`.**

| Variable | Purpose | Required |
|----------|---------|----------|
| `NODE_ENV` | `development`, `test`, or `production` | Yes |
| `PORT` | HTTP port (default 3000) | No |
| `HOST` | Bind host (default 0.0.0.0) | No |
| `TRUST_PROXY` | Trust proxy headers for rate limiting | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `SESSION_SECRET` | Long random session signing secret | Yes |
| `CSRF_SECRET` | CSRF secret (defaults to SESSION_SECRET) | No |
| `GEMINI_API_KEY` | Gemini API key (backend-only) | Yes |
| `GEMINI_MODEL` | Gemini model name | Yes |
| `FRONTEND_ORIGIN` | CORS origin (no trailing slash) | Yes |
| `SECURE_COOKIES` | `true` in production (sets Secure cookie flag) | No |
| `SESSION_MAX_AGE_MS` | Session cookie lifetime (default 7 days) | No |
| `REVIEW_SOURCE_SIZE_LIMIT_BYTES` | Max source size per review (default 65536) | No |
| `GEMINI_TIMEOUT_MS` | Provider request timeout (default 60000) | No |
| `GEMINI_MAX_RETRIES` | Provider retry count (default 2) | No |
| `GEMINI_MAX_OUTPUT_CHARS` | Max provider output chars (default 32768) | No |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window (default 60000) | No |
| `RATE_LIMIT_MAX_AUTH` | Auth requests per window (default 10) | No |
| `RATE_LIMIT_MAX_REVIEW` | Review requests per window (default 30) | No |
| `RATE_LIMIT_MAX_GENERAL` | General requests per window (default 100) | No |
| `LOG_LEVEL` | `error`, `warn`, `info`, `debug` | No |

## Supported languages

Five languages are supported end to end: **JavaScript, TypeScript, Python, Java, C++**.

Each language has:
- A Monaco editor language mode
- A backend registry entry (`reviewEnabled: true`, `aiReviewSupported: true`)
- Server-side validation against the allowlist
- A language-specific system prompt for the AI provider
- Report rendering with findings, severity, confidence, evidence, recommendations

## Installation and startup

### Prerequisites

- Node.js >= 20
- MongoDB (local or remote) — the backend will not start without `MONGODB_URI`
- A Gemini API key for live AI analysis (optional for UI/testing; provider-unavailable state is shown honestly without one)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI, SESSION_SECRET, GEMINI_API_KEY, etc.
npm start
```

The backend listens on `PORT` (default 3000) and serves both the API (`/api/v1/...`) and the frontend SPA.

### Database indexes (optional, idempotent)

```bash
cd backend
MONGODB_URI=mongodb://127.0.0.1:27017/codesense_ai_dev node scripts/ensure-indexes.js
```

### Frontend

The frontend is served by the backend at the same origin — no separate build step.

### Health checks

- `GET /api/v1/health/live` — process liveness
- `GET /api/v1/health/ready` — dependency readiness (database + provider configured)

## Test suites

### Backend tests

```bash
cd backend
npm test
```

Suites: `auth.test.js`, `languages.test.js`, `reviews.test.js`. All use an isolated test database (`codesense_ai_test`) and require a running MongoDB on `127.0.0.1:27017`.

### E2E browser test

```bash
cd <workspace-root>
NODE_PATH=backend/node_modules node tests/e2e.js
```

Requires Chromium (or set `PUPPETEER_EXECUTABLE_PATH`). Tests the full journey: register → dashboard → editor → analyze → history → logout.

## Security model

- Passwords hashed server-side with bcrypt (work factor 12); plaintext never stored or logged
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` in production, 7-day max age
- Session rotated on login and registration; destroyed on logout
- CSRF double-submit token required on all state-changing requests
- CORS restricted to `FRONTEND_ORIGIN` with credentials
- Rate limiting on auth (10/min), review (30/min), general (100/min)
- All review queries owner-scoped at the database level (no IDOR)
- AI provider key never reaches the browser; source treated as untrusted data in prompts
- No code execution of submitted source
- Structured logging with secret redaction; no stack traces to clients

## AI behavior

- AI analysis is performed only from the backend; the browser never calls the provider
- Provider output is validated against a strict JSON schema before acceptance
- Invalid/malformed provider output results in a failed review — never a fabricated report
- Provider failure (not configured, auth error, rate limit, timeout, invalid response) is reported honestly
- Findings are advisory only; severity is distinct from confidence; no findings does not mean "safe"
- No invented line numbers, vulnerabilities, or execution results

## Limitations

- **No live AI key configured by default.** Without a valid `GEMINI_API_KEY`, reviews return a truthful `provider-unavailable` failure state. This is expected and honest behavior — no canned results are ever substituted.
- **MongoDB must be running** for the backend to start (fail-fast on connection error).
- **Desktop Chrome and Firefox** are the target browsers. Mobile/Android is not in scope.
- **No email verification or password reset** — these require a real delivery provider and are not implemented.
- Source code is sent to the external AI provider for analysis; this is disclosed in the product.

## Original materials

The following original project materials are preserved unmodified in the repository root:
- `presentation.pptx` — product brief / capstone presentation
- `CodeSense_AI_Arena_Documentation_Pack.zip` — 33-file documentation pack
- `CodeSense_AI_Gap_Closure_Docs_v2.zip` — 22-file gap-closure documentation pack

The `docs/` directory contains the extracted contents of both ZIPs for reference.

## License / authorship

See `presentation.pptx` and the documentation pack for original authorship and attribution.
