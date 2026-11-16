# Standard Operating Procedures (SOP) — CodeSense AI Engineering and Operations

## 1. Purpose

This SOP defines repeatable procedures for repository work, local development, incident diagnosis, provider configuration, database operations, testing, release and rollback. Operators must follow `AGENT.md`; no SOP step weakens the no-fake-data and evidence rules.

## 2. Repository intake procedure

1. Confirm repository URL and access.
2. Clone or verify the existing checkout.
3. Record origin, branch, HEAD commit and working-tree state.
4. Inventory source, docs, assets, manifests, lockfiles, environment samples and CI.
5. Read the PowerPoint and extract requirements.
6. Run safe inspection commands before installing dependencies.
7. Record baseline errors and tests before changing code.
8. Build an evidence-based feature matrix.
9. Preserve user changes and sensitive files.

Do not run destructive cleanup commands on an unfamiliar repository. Inspect scripts before running them.

## 3. Local setup procedure

Use the actual final package manifests and README for commands. Operators should install the supported Node.js LTS runtime, use committed lockfiles, configure local environment variables, provision a development MongoDB database, configure a real AI provider credential on the backend only, start frontend and backend independently, verify health/database connectivity and open the application in supported desktop browsers.

Never place provider credentials in frontend source or browser-visible configuration. Never use production credentials in ordinary local testing.

## 4. Environment configuration

Maintain an authoritative variable reference in deployment documentation and `.env.example`. Variables may include application environment, backend port, frontend origin, MongoDB connection, session/auth secrets, AI provider key/model, request limits and logging level. Include only variables read by the implementation. Do not use fake default secrets. Validate required variables at startup and fail safely when production configuration is absent.

## 5. Database operations

- Separate development, test and production databases.
- Restrict database network and credentials to least privilege.
- Create/verify indexes through repeatable initialization or migrations.
- Back up production before schema changes.
- Test restoration, not just backup creation.
- Never seed production with demo users or reviews.
- Verify deletion/retention with controlled test records.
- Do not export real user source code for debugging without explicit authorization and secure handling.

## 6. AI provider operations

- Store keys only in backend secret storage.
- Verify provider account, model availability, rate limits and data-processing terms.
- Apply bounded request/response size and timeouts.
- Record provider/model configuration without exposing secrets.
- Monitor provider failures, throttling and latency.
- Validate every response against current schema.
- Do not silently switch providers unless the fallback is configured, approved and tested.
- Never create a local canned response to imitate an unavailable provider.

## 7. Incident diagnosis

Record time, affected operation, correlation ID, environment and impact. Inspect browser console/network, API logs, database health and provider status. Redact credentials and source. Reproduce with a controlled test account and minimal non-sensitive input. Find root cause, add regression coverage, patch through normal gates and verify recovery. Do not hide incidents by disabling validation or suppressing errors.

## 8. Release procedure

1. Freeze scope and review defects.
2. Confirm docs match code.
3. Run format, lint, unit, integration, E2E, security and dependency checks.
4. Verify Chrome and Firefox flows.
5. Verify indexes/migrations and backup readiness.
6. Build immutable artifacts.
7. Scan artifacts for secrets and unwanted local data.
8. Deploy to staging and run smoke checks.
9. Deploy production using the documented strategy.
10. Verify health, auth, real AI configuration and persistence.
11. Monitor errors and provider failures.
12. Retain rollback artifacts and record release commit.

## 9. Support and data requests

Support staff must never request passwords or API keys. A report ID is not authorization. Verify account identity through the established authentication process. For deletion, follow the documented workflow and confirm database state. Never claim third-party provider deletion unless verified through its supported process.

## 10. Documentation and change control

Every architecture, API, schema, screen, security or deployment change must update the relevant Markdown document. Record material changes in `CHANGELOG.md`. Final state must be reproducible from a clean checkout using documented commands.
