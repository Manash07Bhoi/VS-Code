# Pre-Release Quality Gates and Go/No-Go Checklist

A release candidate proceeds only when applicable critical gates have evidence. A checkbox is not complete because a heading exists.

## 1. Repository and integrity

- Source repository and starting commit recorded.
- Git state/diffs reviewed.
- Intended source, configuration, tests and docs included.
- No accidental credentials, local databases or private data tracked.
- Lockfiles committed and clean install passes.
- Required Markdown documents substantive and consistent.

## 2. Product functionality

- Registration, login, logout and session expiry work.
- Protected routes/APIs enforce authorization.
- Monaco loads in target browsers.
- Language choices match genuine review capabilities.
- Empty, invalid and oversized submissions are handled.
- Real provider integration is configured/tested or limitation is disclosed.
- Invalid provider output cannot become success.
- Findings, explanations, locations and recommendations render correctly.
- History persists, searches, filters, sorts, paginates and deletes.
- Every visible control/link works.
- No premium/developer subscription, billing or upgrade functions exist.

## 3. Data and security

- Ownership isolation tests pass.
- Password and session handling are secure.
- Secrets absent from frontend, logs and ZIP.
- Retention and provider disclosure implemented.
- HTTPS, CORS, headers, CSRF if applicable and limits configured.
- Request/response sizes bounded.
- No arbitrary user-code execution in normal backend.
- Dependency/security findings reviewed.

## 4. UX and accessibility

- Applicable screens have loading, empty, success and error states.
- No fake data, fake success or inert controls.
- Keyboard navigation and focus work.
- Contrast and labels checked.
- Reduced motion respected.
- Desktop layouts tested in Chrome and Firefox.
- Monaco limitations disclosed accurately.

## 5. Quality and operations

- Frontend/backend clean builds pass.
- Unit/integration/E2E tests pass.
- DB persistence survives restart.
- Provider timeout/outage/malformed-output paths tested.
- Logs structured and redacted.
- Health/readiness works.
- CI required jobs pass.
- Backup/restore and rollback documented and rehearsed when possible.

## 6. Documentation

- PRDs match approved product.
- Architecture/database/API match implementation.
- Screen/navigation/conditional docs match actual UI.
- Security/performance/accessibility/SEO claims have evidence.
- Test doc contains actual commands/results.
- Deployment distinguishes configured from live.
- Changelog is factual.
- Index links to every included document.

## 7. ZIP delivery

- Archive contains required application source and documentation.
- No `.env`, credentials, certificates, keystores or private keys.
- No `node_modules`, cache, temporary export or unrelated personal file.
- No unintended zero-byte files.
- ZIP integrity verified.
- Archive inventory reviewed.
- SHA-256 generated.

## 8. Go/no-go

Do not release with critical auth/authorization flaws, cross-user data access, secret leakage, false review success, unsafe code execution, corrupted persistence, failed critical browser flows or unverified deployment claims. Disclose noncritical limitations. An unavailable external service means its live test was not passed.
