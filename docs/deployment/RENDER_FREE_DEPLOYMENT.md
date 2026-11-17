# CodeSense AI — Backend deployment on Render Free (verified)

Status: **live and verified** — 2026-11-17.

This document records the actual deployed configuration, the verification evidence,
and the limits of the Render free tier. Everything below was checked against the
running deployment; nothing is aspirational.

---

## 1. Deployed topology (actual)

```
Browser
  │  https://codesenseai-review.netlify.app            (static frontend, Netlify)
  │      └── /api/*  →  200 proxy rewrite (same origin)
  ▼
https://codesense-ai-backend-9skh.onrender.com          (Node.js web service, Render Free)
  ├── MongoDB Atlas  ac-pndnnwt-shard-00-00.ym9wxlr.mongodb.net / db: codesense_ai
  └── Gemini API     (server-side only — NOT configured in this deployment, see §7)
```

| Component | Value |
| --- | --- |
| Frontend (unchanged app code) | `https://codesenseai-review.netlify.app` |
| Backend (Render) | `https://codesense-ai-backend-9skh.onrender.com` |
| Render service id | `srv-dbtu9ggjo6nc73fldetg` |
| Render plan / region | **free** / Singapore |
| Repository / branch | `Manash07Bhoi/VS-Code` @ `main` (`721b51e`) |
| Root directory | `backend` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` → `node server.js` |
| Node version | 20.20.2 (via `NODE_VERSION=20`) |
| Health check path | `/api/v1/health/live` |
| Database | MongoDB Atlas free cluster, database `codesense_ai` |

There is **no paid component** anywhere in this deployment: Render Free web service,
Atlas free tier, and a static Netlify site.

---

## 2. Why these settings

| Setting | Value | Reason |
| --- | --- | --- |
| `PORT` | *(not set — Render injects `PORT=10000`)* | The app reads `PORT` from the environment (`src/config/env.js`), so it binds whatever port the platform assigns. Confirmed in startup logs. |
| `HOST` | `0.0.0.0` | Required for traffic to reach the container. Matches the app default. |
| `NODE_ENV` | `production` | Enables production cookie defaults and disables `.env` fallbacks. |
| `TRUST_PROXY` | `true` | Render (and the Netlify proxy) terminate TLS and forward the client address in `X-Forwarded-For`. Without this, `req.ip` is the proxy address, which would collapse **every** visitor into one rate-limit bucket and would leave `req.secure` false behind a TLS-terminating proxy. |
| `SECURE_COOKIES` | `true` | `Secure` session cookie; both hops (browser→Netlify, Netlify→Render) are HTTPS. |
| `COOKIE_SAMESITE` | `lax` | The API is same-origin with the frontend thanks to the Netlify proxy, so `Lax` is sufficient and strongest here. **`none` is deliberately not used** — it would require cross-site cookies, which Chrome/Safari block. |
| `COOKIE_DOMAIN` | *(unset)* | Host-only cookie on the Netlify origin. Setting a domain here would be unnecessary and broader than needed. |
| `MONGODB_URI` | Atlas SRV string **+ `/codesense_ai`** | The supplied URI had no database name (the driver would have defaulted to `test`). The explicit database name was appended, plus `retryWrites=true&w=majority`. |
| `SESSION_SECRET` | 64-hex random, generated at deploy time | Never committed; stored only in the Render dashboard env vars. |
| `FRONTEND_ORIGIN` | `https://codesenseai-review.netlify.app` | CORS allow-list (single origin) and CSP `connect-src`. |
| `NODE_VERSION` | `20` | Matches `engines.node >= 20` and CI. |

Security posture was **not** weakened for the deployment: the general limiter, the
per-IP and per-(IP,email) auth limiters, session regeneration on login/register,
session-bound CSRF tokens, `HttpOnly`/`Secure`/`SameSite` cookies, helmet CSP/HSTS,
and owner-scoped database queries are all active in production (verified in §6).

---

## 3. Environment variables

Set through the Render dashboard (Service → Environment). **No secret is committed to
git**; `.env` is git-ignored and `.env.example` lists names only.

### Required — the process refuses to start without these

| Variable | Source |
| --- | --- |
| `MONGODB_URI` | Atlas connection string (with database name) |
| `SESSION_SECRET` | random 32 bytes, hex — generate per environment |
| `FRONTEND_ORIGIN` | exact Netlify origin, no trailing slash |

### Configured for this deployment

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `TRUST_PROXY` | `true` |
| `SECURE_COOKIES` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `SESSION_MAX_AGE_MS` | `604800000` (7 days) |
| `LOG_LEVEL` | `info` |
| `NODE_VERSION` | `20` |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` (validated against the live API) |
| `GEMINI_API_KEY` | set server-side only — never committed, never in the frontend (§7) |

Rate-limit and provider tuning variables (`RATE_LIMIT_*`, `GEMINI_TIMEOUT_MS`,
`GEMINI_MAX_RETRIES`, `GEMINI_MAX_OUTPUT_CHARS`, `REVIEW_SOURCE_SIZE_LIMIT_BYTES`)
were left at their documented defaults in `.env.example`.

To rotate a secret: update the value in the Render dashboard and restart the service.
Rotating `SESSION_SECRET` invalidates all existing sessions (expected).

---

## 4. Frontend ↔ backend wiring (Netlify proxy)

The frontend's API client uses `window.__CODESENSE_API_BASE || '/api/v1'`
(`frontend/js/app/api.js`), i.e. **same-origin relative** requests. The Netlify site
had no `/api` rewrite, so `https://codesenseai-review.netlify.app/api/v1/health/ready`
returned Netlify's SPA fallback (HTTP 404 HTML) — the deployed frontend could not
reach any backend.

Fix (config only, no application-code change): `frontend/_redirects` proxies the API
to Render **before** the SPA fallback, and `frontend/_headers` carries the caching
policy that `netlify.toml` declares (see note below).

```
/api/*  https://codesense-ai-backend-9skh.onrender.com/api/:splat  200
/*      /index.html  200
```

Why a proxy rather than pointing the browser at the Render URL directly:

- The `cs.sid` session cookie stays **first-party** on the Netlify origin, so
  `SameSite=Lax` + `Secure` works and no third-party-cookie exception is needed.
  Verified in a real browser: `domain=codesenseai-review.netlify.app, httpOnly=true,
  secure=true, sameSite=Lax`.
- `X-CSRF-Token` and `Content-Type` pass through unchanged, so CSRF stays enforced.
- No CORS preflight is needed in the browser (though the backend's CORS allow-list
  still correctly answers one if a cross-origin caller appears).

**Note on `netlify.toml`:** the previous manual/CLI deploys did not apply the caching
headers declared in `frontend/netlify.toml` (live responses showed
`max-age=0,must-revalidate` instead of the configured `max-age=300`). Netlify always
honours `_redirects`/`_headers` files inside the published directory, so the policy is
now declared there as well and verified live.

If the Render service is ever recreated with a different URL, update the target in
**both** `frontend/_redirects` and `frontend/netlify.toml`, then redeploy the frontend.

---

## 5. Health checks

The backend exposes two real health endpoints (`backend/src/modules/health/routes.js`):

| Endpoint | Purpose | Live result |
| --- | --- | --- |
| `GET /api/v1/health/live` | process liveness only; used as the Render health check | `200 {"status":"ok","service":"codesense-backend"}` |
| `GET /api/v1/health/ready` | readiness incl. real dependency state | `200 {"status":"ready","checks":{"database":"connected","provider":"not-configured"}}` |

`/ready` reports provider state without disclosing credentials, and readiness does
**not** depend on Gemini being configured (reviews fail honestly instead — §7).

Render's health check uses `/api/v1/health/live` deliberately: with `/ready`, a
database outage would make Render restart the service in a loop. The app already
fails fast at startup if MongoDB is unreachable.

There is no bare `/health` route — any path that is not under `/api` is served by the
server-side SPA fallback, so `/health` returns the frontend HTML, not JSON.

---

## 6. Verification evidence (2026-11-17, live)

Test harness: `deploy/e2e.js` (raw HTTP, real cookie jar), `deploy/browser_test.js`
(real Chromium against the deployed site). No mocks, no stubbed responses.

### Local preflight (before deploying)

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (14 pre-existing warnings) |
| `npm test` (real MongoDB) | **19/19 tests pass** |
| Repository CI on `main` (`721b51e`) | **success** |

### Backend health & database

| Check | Result |
| --- | --- |
| `GET /api/v1/health/live` | 200 `status=ok` (315 ms warm) |
| `GET /api/v1/health/ready` | 200 `database=connected`, `provider=not-configured` |
| Startup log | `port:10000, host:0.0.0.0, nodeEnv:production, database:connected` |
| Atlas authentication | succeeded (user `alberteinstein9485_db_user`) |
| Atlas write/read round-trip | insert + count + drop succeeded |
| Collections created | `users`, `sessions`, `reviews` in db `codesense_ai` |
| User document | persisted with bcrypt `passwordHash`, unique index on `email` |
| Review document | persisted with real lifecycle `status: "failed"` |
| Session document | `_id` = SID from the signed `cs.sid` cookie, with `userId`, `email`, `authenticatedAt`, `csrfToken`, `expires` +7 days |
| Session TTL | `connect-mongodb-session` TTL store (sessions survive instance restarts) |

### Authentication, sessions, CSRF (23/23 checks)

Run twice — directly against Render, and through the Netlify proxy — **23/23 passed**
in both runs:

- `GET /auth/me` unauthenticated → `401 UNAUTHENTICATED`
- Registration → `201 created:true`, session id rotated (fixation resistance), fresh
  session-bound CSRF token (64 hex chars)
- Duplicate registration → `201 created:false` with a non-enumerating message
- Login, wrong password → `401 UNAUTHENTICATED` (no account enumeration)
- Login, correct password → `200`, session rotated, `GET /auth/me` → `200`
- `POST /reviews` **without** `X-CSRF-Token` → `403 CSRF_ERROR`
- Invalid language → `400 VALIDATION_ERROR`
- Logout → `200`, `cs.sid` cleared, `GET /auth/me` → `401`, session removed from Atlas
- Cookie attributes: `HttpOnly; Secure; SameSite=Lax; Path=/`
- CORS: preflight from the Netlify origin → `204` with
  `Access-Control-Allow-Origin: https://codesenseai-review.netlify.app` and
  `Access-Control-Allow-Credentials: true`; an arbitrary origin is **not** echoed.

### Rate limiting (real load)

65 sequential `POST /auth/login` attempts with unique emails from one address:
**60 × `401`, then `429`** with
`{"code":"RATE_LIMITED","message":"Too many attempts from this address..."}` and
`Retry-After: 43`. This matches `RATE_LIMIT_MAX_AUTH_IP=60` and proves per-client
IP keying works through the proxy (`TRUST_PROXY=true`).

### Deployed frontend workflow (real Chromium, 10/10)

| Check | Result |
| --- | --- |
| SPA boots, `__CODESENSE_READY=true` | pass (1.6–2.3 s) |
| Registration through the real UI → dashboard | pass |
| Session cookie first-party on the Netlify origin | pass |
| Full page reload keeps the session (MongoDB-backed) | pass |
| History view renders the real DB result | pass |
| Authenticated workbench shell renders | pass |
| Logout through the UI + `GET /auth/me` → `401` | pass |
| No unexpected API failures / console errors | pass |

Known pre-existing frontend observation (not caused by this deployment): Chromium
blocks `cdnjs.cloudflare.com/.../monaco-editor/0.52.0/.../tsWorker.js` with
`ERR_BLOCKED_BY_ORB`. It affects Monaco's TypeScript worker only; the workbench shell
and API flows are unaffected.

---

## 7. Gemini AI status — NOT configured (honest)

No Gemini API key was provided, so **the AI path is not live-tested**. The backend is
built to degrade honestly, and that behaviour was verified:

| Endpoint | Live result |
| --- | --- |
| `POST /api/v1/reviews` | `502` `{"status":"failed","failureReason":"AI provider is not configured on the server.","providerUnavailable":true}` — and the attempt is persisted with `status:"failed"`, `findings: []` |
| `POST /api/v1/assist` | `503` `{"error":{"code":"PROVIDER_UNAVAILABLE","message":"AI provider is not configured on the server."}}` |
| `GET /api/v1/health/ready` | `checks.provider = "not-configured"` |

No mock findings, dummy reviews, or simulated AI output exist anywhere in the system.

To activate real AI reviews (no code change required) follow
[`docs/ai/GEMINI_CONFIGURATION.md`](../ai/GEMINI_CONFIGURATION.md). Summary:

1. Render dashboard → service `codesense-ai-backend` → Environment.
2. Add `GEMINI_API_KEY` = your key (server-side only; never in the frontend, never in git).
3. Set `GEMINI_MODEL=gemini-3.1-flash-lite`.

   **Model name was validated against the live API**, not copied from `.env.example`.
   Measured on 2026-11-17: `gemini-3.1-flash-lite` and `gemini-3.5-flash-lite` returned
   HTTP 200; `gemini-2.5-flash` and `gemini-2.5-flash-lite` return **404 — no longer
   available to new users**; the `gemini-1.5-*` names in the old example no longer exist.
   The full table is in `docs/ai/GEMINI_CONFIGURATION.md`. The deployed service runs
   `gemini-3.1-flash-lite`.
4. Save (Render redeploys) and verify:
   `curl -s https://codesense-ai-backend-9skh.onrender.com/api/v1/health/ready`
   should report `"provider":"configured"`. Presence is not validity: a wrong key still
   shows `configured` and then fails a real request with `PROVIDER_AUTH_ERROR` (502) —
   that is the honest signal.

Note: `GEMINI_MODEL` is already set but `GEMINI_API_KEY` is empty, so
`providerAdapter()` returns `null` and every AI call fails honestly rather than
silently falling back to fabricated output.

---

## 8. Cold starts and Render Free limitations

Render's free web services **spin down after ~15 minutes without traffic** and take
tens of seconds to wake. Measured on this service (full record:
[`COLD_START_MEASUREMENT.md`](COLD_START_MEASUREMENT.md)):

- 16.0 min idle → **no spin-down** (still warm, 326 ms)
- 20.5 min idle → **real cold start: 22.5 s** for the first request, then 197–725 ms

A session created before the spin-down still authenticated afterwards, so restarts do
not log users out (sessions live in Atlas).

| Limitation | Impact | Mitigation |
| --- | --- | --- |
| Spin-down after 15 min idle | First request after idle is slow (cold start); in-flight requests during spin-down fail | Retry once on the frontend/`curl`; keep-alive ping from an external cron is optional but uses free instance hours |
| 750 free instance-hours/month (account-wide) | One always-on service consumes them all | Keep one free service, accept spin-down |
| No persistent disk | Nothing may be written to local disk | All durable state lives in MongoDB Atlas (sessions, users, reviews) — already the design |
| Ephemeral container filesystem | Redeploys/restarts discard local files | Never store uploads/logs locally |
| No static egress IP | Atlas must allow `0.0.0.0/0` (or a broad range) | Atlas Network Access allows the world; security rests on the DB user's strong password + TLS. For tighter control, move the DB to a platform with static egress. |
| Outbound bandwidth/build minutes limited | Large builds or heavy payloads may be throttled | Builds are ~2 s (`npm ci --omit=dev` only) |
| Single instance, no autoscaling | A sleeping instance serves no requests | Acceptable for a demo/portfolio deployment |

**Important:** because the free tier can spin down mid-session, an authenticated user
may see a one-off slow or failed request after idling. Sessions are unaffected — they
are stored in Atlas, so a full instance restart does not log users out.

---

## 9. Reproducing this deployment

1. Create the service from the repo (Render dashboard → New → Web Service, or a
   Blueprint using `render.yaml` at the repository root):
   - Root Directory: `backend`
   - Build: `npm ci --omit=dev` · Start: `npm start`
   - Plan: **Free** · Health Check Path: `/api/v1/health/live`
2. Add the environment variables from §3 (generate `SESSION_SECRET` with
   `openssl rand -hex 32`; never reuse it across environments).
3. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (`/0` entry) — Render free
   offers no static egress IPs. Use a dedicated DB user with a strong password.
4. Deploy. Confirm the log line `codesense-backend.started` reports
   `database:connected`.
5. Verify: `curl -s https://<service>.onrender.com/api/v1/health/ready`.
6. Point the frontend at the backend: update `frontend/_redirects` and
   `frontend/netlify.toml`, then redeploy the Netlify site.
7. Deploy the frontend (`netlify deploy --dir=frontend --prod`, or the CD workflow).

Rollback: Render dashboard → Deploys → pick the previous successful deploy →
“Redeploy”. For the frontend, Netlify → Deploys → previous deploy → “Publish deploy”.

---

## 10. Secrets handling

- Credentials were supplied out of band and stored **only** in the Render dashboard.
- No secret is present in the repository, in `frontend/`, in build logs, or in this
  document. `GEMINI_API_KEY` is empty by design until an operator provides one.
- The frontend never receives any credential: it talks only to `/api/v1` on its own
  origin. Gemini and MongoDB credentials exist solely in the backend process.
- `.gitignore` already excludes `.env`, `*_token.txt`, `*.pem`, `*.key`.
