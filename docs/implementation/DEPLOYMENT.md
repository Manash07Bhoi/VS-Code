# Deployment Guide — CodeSense AI

## Production requirements

1. **Node.js** >= 20 (LTS)
2. **MongoDB** — accessible via `MONGODB_URI`; use a least-privilege database user; enable encrypted transport where supported
3. **Gemini API key** — set `GEMINI_API_KEY` and `GEMINI_MODEL` in the backend environment; key is backend-only
4. **Reverse proxy / TLS** — terminate HTTPS in front of the backend; set `SECURE_COOKIES=true` so session cookies get the `Secure` flag
5. **Session secret** — set `SESSION_SECRET` to a long random value (different per environment)
6. **CSRF secret** — set `CSRF_SECRET` (or it defaults to `SESSION_SECRET`)
7. **Frontend origin** — set `FRONTEND_ORIGIN` to the production URL (no trailing slash) for CORS
8. **Trust proxy** — set `TRUST_PROXY=true` only if behind a trusted reverse proxy; rate limiting uses `req.ip`

## Environment variables (production)

| Variable | Production value |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (or your chosen port) |
| `HOST` | `0.0.0.0` |
| `TRUST_PROXY` | `true` (if behind a proxy) |
| `MONGODB_URI` | Production MongoDB connection string |
| `SESSION_SECRET` | Long random string (generate per deploy) |
| `CSRF_SECRET` | Long random string (or reuse SESSION_SECRET) |
| `GEMINI_API_KEY` | Real Gemini API key |
| `GEMINI_MODEL` | `gemini-1.5-flash-latest` |
| `FRONTEND_ORIGIN` | `https://your-domain.com` |
| `SECURE_COOKIES` | `true` |
| `SESSION_MAX_AGE_MS` | `604800000` (7 days) |
| `REVIEW_SOURCE_SIZE_LIMIT_BYTES` | `65536` (64 KiB) |
| `GEMINI_TIMEOUT_MS` | `60000` |
| `GEMINI_MAX_RETRIES` | `2` |
| `LOG_LEVEL` | `info` or `error` |

## Startup

```bash
cd backend
npm install --production
# Set all production environment variables
npm start
```

The backend performs fail-fast environment validation: if `MONGODB_URI`, `SESSION_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, or `FRONTEND_ORIGIN` is missing, the process exits with an error.

## Health checks

- `GET /api/v1/health/live` — use for load balancer liveness
- `GET /api/v1/health/ready` — use for readiness (checks database + provider configuration)

## Database indexes

Run before or after deployment (idempotent):

```bash
MONGODB_URI=<production-uri> node scripts/ensure-indexes.js
```

## Graceful shutdown

The backend handles `SIGTERM` and `SIGINT`: stops accepting HTTP requests, closes the database connection, then exits. Use a process manager (systemd, Docker, etc.) that sends `SIGTERM` on stop.

## Security checklist for deployment

- [ ] `SECURE_COOKIES=true` (HTTPS in production)
- [ ] `SESSION_SECRET` is a strong random value, not the example
- [ ] `GEMINI_API_KEY` is set and not committed to version control
- [ ] `.env` is excluded via `.gitignore`
- [ ] `FRONTEND_ORIGIN` matches the production domain exactly
- [ ] TLS terminates before the backend (or the backend serves HTTPS directly)
- [ ] MongoDB access is restricted to the backend (network-level)
- [ ] Rate limits are appropriate for expected traffic
- [ ] `node_modules` and `.env` are not in the deployed artifact

## Known deployment limitations

- No automated backup/restore procedure is included; configure MongoDB backups separately.
- No account deletion endpoint; account lifecycle management is deferred.
- No email delivery provider; registration is immediate without verification.
- No live `GEMINI_API_KEY` is provided by default; configure one for AI analysis.
