# CI/CD Pipeline and Release Automation

## 1. Goals

Provide reproducible quality gates for frontend/backend changes, traceable artifacts and deployment from reviewed commits. CI must not expose secrets or run destructive operations against production data.

## 2. Pipeline stages

1. Checkout pinned commit and record commit identity.
2. Install from lockfiles using supported package manager.
3. Run formatting and lint checks.
4. Run frontend unit tests.
5. Run backend unit tests.
6. Provision isolated test services where available.
7. Run API/database integration tests.
8. Build frontend and backend.
9. Run secret and prohibited-marker scans.
10. Run dependency vulnerability and license checks.
11. Run browser E2E smoke tests in Chrome/Firefox where runners support them.
12. Publish test/build artifacts with checksums.
13. Deploy staging after required branch/review gates.
14. Run staging smoke tests.
15. Deploy production only through a protected environment.
16. Verify health/release and retain rollback artifact.

## 3. Secret management

Use encrypted CI secret store and least-privilege credentials. Never print secrets or expose them to untrusted pull requests. Use restricted test credentials or deterministic provider stubs in CI. Real-provider checks run only in trusted context with spending limits. Never store `.env` in repository.

## 4. Branch and review policy

Protect production branch with required checks/review where available. Use short-lived feature branches. Do not rewrite shared history. Review auth, provider adapter/prompt, data retention and deployment changes carefully.

## 5. Reproducible build

Use lockfiles, documented runtime version and deterministic scripts. Build from clean checkout. Keep environment configuration out of browser bundles. Record runtime/dependency versions with each artifact.

## 6. Deployment gates

Staging requires tests, indexes/migrations, environment validation and security scans. Production requires staging smoke tests, health checks, backup/rollback readiness and approval. Do not deploy with failed critical tests or known critical vulnerabilities.

## 7. Rollback

Document application artifact rollback and schema compatibility. Prefer backward-compatible migrations. Rollback must not destroy newly written user data. Test rollback outside production.

## 8. Failure behavior

A failed required job blocks deployment. Never mark a job successful by swallowing failure, unconditional continuation or disabling assertions. Skips must be explicit and justified. CI logs redact credentials and source code.

## 9. Documentation

Update workflows, runners, secrets, artifact names and environments in this document when changed. Do not claim CI is operational until a workflow has actually run successfully.
