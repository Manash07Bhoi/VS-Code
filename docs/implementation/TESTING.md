# Testing Guide — CodeSense AI

## Test suites

### Backend integration tests

Location: `backend/tests/`

| Suite | File | What it covers |
|-------|------|---------------|
| Auth | `auth.test.js` | Registration, duplicate registration, login (wrong + valid), `/me`, logout + replay |
| Languages | `languages.test.js` | Five-language registry, public fields |
| Reviews | `reviews.test.js` | Review creation (honest provider failure), empty source, missing source, unknown language, oversized source, CSRF rejection, owner-scoped list/get/delete, cross-user isolation (404), unauthenticated 401 |

### Running backend tests

Requires a running MongoDB on `127.0.0.1:27017`.

```bash
cd backend
npm test
# or individually:
node --test tests/auth.test.js
node --test tests/languages.test.js
node --test tests/reviews.test.js
```

All three suites pass.

### E2E browser test

Location: `tests/e2e.js`

Covers the full journey: register → dashboard → editor → analyze → history → logout.

```bash
cd <workspace-root>
NODE_PATH=backend/node_modules node tests/e2e.js
```

Requires Chromium (sets `executablePath: '/usr/bin/chromium'`). All checks pass.

### Frontend syntax checks

```bash
cd frontend
for f in js/pages/*.js js/app/*.js js/components/*.js js/main.js; do node --check "$f"; done
```

All files pass syntax validation.

## Test environment

- Node.js v20.20.2
- MongoDB 8.0.6 (running on 127.0.0.1:27017)
- Chromium 156.0.8078.79 (for E2E)
- Firefox ESR 153.7.0 (installed, available for manual testing)
- Backend running on port 3000

## Test database

Backend tests use an isolated test database `codesense_ai_test`, which is dropped at the start of each suite (`setup.js`). Tests do not affect development or production data.

## 401/403 investigation

401 responses occur for:
- Unauthenticated `api.me()` during frontend bootstrap (expected — user not yet logged in)
- Protected API access without a session (expected — correct authorization)

403 responses occur for:
- Missing/invalid CSRF tokens on state-changing requests (expected — correct CSRF protection)

These are legitimate security behaviors, not defects. Every explicit E2E check passes.

## Coverage notes

- No code coverage tool is configured. Coverage is assessed via test case inventory, not percentage.
- Live AI provider calls are not exercised in automated tests (no `GEMINI_API_KEY`). The provider failure path is tested with an invalid key.
- No production data is used in tests; test fixtures are isolated.
