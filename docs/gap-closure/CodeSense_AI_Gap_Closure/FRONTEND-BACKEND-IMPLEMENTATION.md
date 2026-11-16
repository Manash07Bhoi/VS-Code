# Frontend and Backend Implementation Contract — CodeSense AI

## 1. Required repository layout

The following is the target layout, not a claim that it exists already:

```text
VS-Code/
├── frontend/
│   ├── index.html
│   ├── assets/
│   ├── css/
│   ├── js/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── state/
│   │   └── utils/
│   └── tests/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── languages/
│   │   │   ├── reviews/
│   │   │   └── users/
│   │   ├── providers/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── app.js
│   ├── tests/
│   └── server.js
├── docs/
├── .gitignore
├── .env.example
├── package.json (only if a root orchestration script is genuinely used)
└── README.md
```

Use separate frontend and backend package manifests if their dependencies/build processes differ. Do not create empty folders or empty files just to match this diagram.

## 2. Frontend responsibilities

- Render semantic accessible HTML.
- Load Monaco and report initialization failure.
- Maintain explicit application state and stale-request protection.
- Fetch capability registry from backend.
- Validate for user experience, never as a replacement for server validation.
- Submit source through API client.
- Render report data as inert text.
- Keep API base URL configurable without embedding secrets.
- Handle auth expiry, errors, empty state, loading state and retry.
- Avoid hardcoded users, reviews, counts or provider results.

## 3. Backend responsibilities

- Load and validate environment configuration at startup.
- Authenticate/authorize every private request.
- Validate all request bodies, params and query strings.
- Enforce source size, language allowlist, rate and concurrency limits.
- Coordinate review lifecycle.
- Call only configured AI providers through adapter.
- Validate/normalize provider response.
- Persist and retrieve reports with owner scoping.
- Return stable error contracts.
- Emit redacted logs and health status.

## 4. Layering

Route/controller → validation/auth middleware → application service → repository/provider adapter. Business rules belong in services/domain modules, not route handlers or frontend event callbacks. Repositories own persistence queries. Provider adapter owns vendor-specific SDK behavior. No UI module imports database/provider SDKs.

## 5. Frontend navigation

Keep route definitions centralized. Protected routes must verify session state with the backend. Unknown routes show a real not-found screen. Back navigation must not discard unsaved source without warning. Avoid client-side route protection as the only authorization control.

## 6. Integration contract

Frontend and backend must agree on:
- API prefix and base URL;
- cookie credentials/CORS policy;
- request and response schemas;
- stable error codes;
- language IDs;
- review status transitions;
- report finding schema;
- pagination semantics;
- date/time format.

Generate or share schemas where practical. Contract tests must fail when either side drifts.

## 7. Build/run requirements

Document actual commands only after manifests/scripts exist and have been executed. A successful static server serving HTML does not prove backend integration. A backend health response does not prove database/provider readiness. Run frontend and backend separately and verify a complete review lifecycle.
