# Environments and Deployment Topology — CodeSense AI

## 1. Environment separation

Define at minimum:
- Local development.
- Automated test.
- Staging (if provisioned).
- Production.

Each environment has separate database and provider credentials. Never reuse production user data in tests. Never commit `.env` files or real secrets. `.env.example` contains variable names and safe explanatory values only.

## 2. Required configuration categories

- `NODE_ENV`
- frontend origin / allowed CORS origins;
- backend port and public base URL;
- MongoDB connection URI;
- session secret or token signing keys;
- AI provider API key and model identifier;
- provider timeout and output budget;
- source size and rate/concurrency limits;
- log level and redaction configuration.

Names above are illustrative configuration categories; actual names must match the implemented code. Do not publish fake working credentials or default secrets.

## 3. Topology decision

Choose a deployment where the frontend is served over HTTPS and the API is reachable over HTTPS. Prefer same-site frontend/API routing when using cookie sessions. If cross-origin is necessary, configure explicit origins, credentials and CSRF protections. Do not use wildcard CORS with credentials.

## 4. Startup validation

Backend startup must fail fast when required secrets/configuration are missing or malformed. It must not start in a misleading degraded mode that accepts reviews but cannot call the provider. Health endpoints must distinguish liveness and readiness.

## 5. Deployment checklist

- lockfile-based install;
- build/lint/test;
- secret scan and dependency audit;
- environment variable validation;
- database migration/index step;
- health/readiness check;
- HTTPS and security headers;
- CORS/CSRF validation;
- real provider integration smoke test using an authorized test account;
- Chrome/Firefox smoke tests;
- rollback procedure.

## 6. Rollback

Define application rollback separately from database rollback. Use backward-compatible schema changes where possible. Never roll back by deleting user records. Document how to disable review submission if the provider is compromised or unavailable.

## 7. No fabricated deployment status

Do not state “deployed”, “live”, “production ready” or provide a live URL unless the deployment actually exists and has been tested. Do not create fake status badges.
