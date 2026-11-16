# Definition of Done and Release Gate — CodeSense AI

## 1. Feature-level definition of done

A feature is done only when:
- requirement ID exists;
- behavior and edge cases are documented;
- UI, API, service and persistence layers are integrated where required;
- validation and authorization are enforced server-side;
- loading/empty/error/success states are real;
- keyboard and accessibility behavior are tested;
- unit/integration/contract/E2E tests are added at appropriate boundaries;
- no production fake data, canned response or inert control remains;
- documentation and changelog are updated;
- test evidence records commit, environment and result.

## 2. Application-level release gate

- Clean clone can install and start from documented instructions.
- Frontend and backend are separate and communicate through the documented API.
- Authentication persists and revokes correctly.
- MongoDB persistence works across restart.
- Five languages pass complete end-to-end tests.
- Real configured provider produces schema-valid reports.
- Provider unavailable/invalid output produces honest failure.
- Reports and history are owner-scoped.
- No user code is executed by the server.
- Chrome and Firefox core journeys pass.
- Keyboard and accessibility checks pass.
- Security and dependency scans are reviewed.
- Backup and restore procedure has evidence.
- Deployment and rollback have been tested.
- No unresolved critical/high issue without explicit acceptance.
- Final ZIP extracts cleanly and contains all required source files.

## 3. Prohibited release claims

Do not claim “bug-free”, “100% secure”, “all vulnerabilities detected”, “world-class accuracy”, “fully production-ready” or “tested on all browsers”. State the exact verified scope, versions, dates and known limitations.
