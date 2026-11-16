# Deployment and Environment Operations

## 1. Deployment architecture

Deploy frontend and backend as separately configured components or artifacts behind a controlled reverse proxy. Frontend calls backend over HTTPS. MongoDB must have restricted network access, authentication, backup and monitoring. AI access is outbound from backend only.

Choose hosting based on actual account access, cost, regional availability, runtime and DB connectivity. Document actual service names after verification. A deployment config file is not proof of deployment.

## 2. Environments

Keep development, test, staging and production separate. Each has its own database, credentials, allowed origins and AI key/quota. Tests never connect to production. Production keys do not belong in local development or untrusted CI.

## 3. Configuration

Document each variable's purpose, component, secret classification, validation and rotation. Categories may include runtime environment, server port, frontend origin, MongoDB URI, session/auth secrets, AI key/model, request limit, timeout, rate limit and log level. `.env.example` contains names/explanations, never real secrets or fake working defaults.

Fail safely at startup when required production configuration is missing. Never expose backend variables through frontend build-time public variables.

## 4. Build/release

Use committed lockfiles and documented runtime. Build from clean commit. Run tests and security scans. Produce immutable artifacts. Verify asset paths, Monaco workers, API base URL, CSP and CORS in production-like environment.

## 5. HTTPS and domain

Configure TLS at hosting edge or reverse proxy, redirect HTTP to HTTPS, use secure cookies, enable HSTS as appropriate and verify certificate renewal. Set CORS to exact frontend origins. Do not use wildcard origins with credentialed requests.

## 6. Database

Provision least-privilege DB account and restrict ingress. Apply indexes/migrations repeatably. Back up before migrations. Verify connectivity and restore readiness before release.

## 7. Health/monitoring

Expose safe liveness/readiness endpoints. Readiness reflects required dependencies. Monitor process restarts, API errors, database state, provider failures, latency, rate limits and queue depth if applicable. Do not expose sensitive diagnostics publicly.

## 8. Rollback/recovery

Retain prior artifacts. Document rollback and schema compatibility. Backups must be encrypted and restore-tested. Provider outage must produce honest failure state, never fabricated output.

## 9. Deployment verification

After deploy, test HTTPS, landing, registration/login, session protection, Monaco loading, supported language, real provider configuration, report persistence, history and ownership. Record commit, environment and exact test results. If credentials/account access prevent deployment, say it is configured or deployable but not actually deployed.
