# CI/CD — CodeSense AI

**Workflows:** `.github/workflows/ci.yml` (CI), `.github/workflows/cd.yml` (CD — Netlify frontend deployment).

---

## CI pipeline (`.github/workflows/ci.yml`)

**Triggers:** push to `main`, pull requests targeting `main`, manual dispatch.

### Job: `lint-and-test` (runs on every push/PR)

| Step | Purpose |
|------|---------|
| Checkout | `actions/checkout@v4` |
| Set up Node.js | Node 20, npm cache keyed on `backend/package-lock.json` |
| Install backend dependencies | `npm ci` in `backend/` |
| Backend lint | `npm run lint` (ESLint flat config; must exit 0) |
| Backend tests | `npm test` — auth, languages, reviews, mocked provider (18/18 pass, no real Gemini network) |
| Dependency audit | `npm audit --audit-level=high` |
| Frontend syntax checks | `node --check` on every frontend JS file |
| Secret scan | Grep for secrets in JS/JSON/env (fails if found) |
| Upload artifacts | Test results and E2E logs on completion |

### Job: `frontend-e2e` (runs after CI on push to main)

| Step | Purpose |
|------|---------|
| Checkout + Node setup | As above |
| Install deps + start backend + MongoDB | Backend on port 3000, MongoDB on 27017 |
| Wait for backend health | Poll `/api/v1/health/live` until 200 |
| Browser E2E | Puppeteer + Chromium: register → dashboard → editor → analyze → history → logout |
| Upload artifacts | Backend log |

**Gating:** Any failed lint, test, audit, or secret scan fails the job and blocks merge/deployment. Nothing silently passes.

---

## CD pipeline (`.github/workflows/cd.yml`)

**Trigger:** push to `main` (after CI passes).

### Job: `deploy-frontend`

Runs only when `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` repository secrets are configured.

| Step | Purpose |
|------|---------|
| Checkout | `actions/checkout@v4` |
| Install Netlify CLI | `npm install -g netlify-cli@latest` |
| Deploy frontend | `netlify deploy --dir=frontend --prod` (publish dir `frontend/`, no build step) |
| Record deployment | Logs deployed commit SHA and site ID |

### Job: `deploy-frontend-blocked`

Runs when deployment secrets are absent. Emits a clear BLOCKED message; performs no deployment and exposes no tokens.

---

## Netlify configuration (`frontend/netlify.toml`)

- Publish directory: `.` (the `frontend/` folder)
- Build command: none (static HTML/JS/CSS)
- SPA redirect: `/* → /index.html` (200) for hash-routing and direct URL navigation
- Cache headers: immutable caching for JS/CSS; no-cache for `index.html`
- Security headers: `X-Content-Type-Options: nosniff`

---

## Backend deployment

The backend is a Node.js/Express app (`npm start`) requiring:
- `MONGODB_URI` (production MongoDB, least-privilege user, TLS)
- `SESSION_SECRET` (per-environment random value)
- `RATE_LIMIT_MAX_AUTH_IP` (per-IP auth attempt cap)
- `FRONTEND_ORIGIN` (production frontend URL)
- `SECURE_COOKIES=true`
- Optional `GEMINI_API_KEY` / `GEMINI_MODEL` for live AI analysis

No backend hosting credentials are configured in this repository. Backend deployment is documented as a manual/operator task pending hosting authorization.

---

## Quality gates (nothing silently passes)

- ESLint must exit 0 (warnings permitted; errors fail).
- `npm test` must exit 0 with all suites passing.
- `npm audit --audit-level=high` must not find unpatched high/critical vulnerabilities.
- Secret scan must find no committed secrets.
- Frontend `node --check` must pass on every JS file.
