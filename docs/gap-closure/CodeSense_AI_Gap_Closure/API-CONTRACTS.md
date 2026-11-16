# API Contracts and Endpoint Acceptance — CodeSense AI

## 1. Contract rules

This document is a target contract. Before implementation, reconcile it with actual routes and record any approved differences. Do not expose endpoints as available until implemented and tested.

Use one versioned prefix, e.g. `/api/v1`. JSON request/response. Require HTTPS in production. Every response should include a request/correlation ID. Never return stack traces, provider keys, database errors or raw upstream response bodies to clients.

## 2. Endpoint inventory

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/health/live` | No | Process liveness only |
| GET | `/api/v1/health/ready` | No | Readiness; disclose only safe dependency state |
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Establish session |
| POST | `/api/v1/auth/logout` | Yes | Revoke session |
| GET | `/api/v1/auth/me` | Yes | Current identity |
| GET | `/api/v1/languages` | Yes or public by decision | Enabled capability registry |
| POST | `/api/v1/reviews` | Yes | Submit source for review |
| GET | `/api/v1/reviews` | Yes | Owner-scoped history list |
| GET | `/api/v1/reviews/:reviewId` | Yes | Owner-scoped report detail |
| DELETE | `/api/v1/reviews/:reviewId` | Yes | Delete own review |
| GET | `/api/v1/preferences` | Yes, if needed | Read persisted preferences |
| PATCH | `/api/v1/preferences` | Yes, if needed | Update allowed preferences |

Do not create preference endpoints if no actual user preference is part of the MVP.

## 3. Review submission request

```json
{
  "source": "string",
  "language": "javascript",
  "clientRequestId": "opaque-id"
}
```

Rules:
- `source` must be a non-empty string within the configured byte/character limit.
- `language` must match an enabled canonical registry identifier.
- `clientRequestId` is optional unless idempotency is implemented; if used, scope uniqueness to the authenticated user.
- Never trust user-supplied `userId`, role, provider, model, cost, status or ownership.
- Do not accept arbitrary provider/model names from clients.

## 4. Review response

The response must reflect the actual persisted lifecycle. If processing is asynchronous, return `202 Accepted` with a review ID and real processing state; provide a status retrieval route or polling contract. If synchronous, return only after bounded processing and persistence. Do not invent a processing state that is not backed by a worker/job.

A completed report includes:
- review ID, created/completed timestamps;
- canonical language;
- submitted source revision identity or retained source according to privacy policy;
- status;
- findings array;
- summary and limitation notice;
- provider/model metadata only if safe and useful.

Each finding includes:
- stable finding ID;
- category from allowlist;
- severity from allowlist;
- title;
- explanation;
- impact;
- recommendation;
- evidence line start/end and snippet only when validated;
- confidence/uncertainty qualifier where meaningful.

## 5. Error contract

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted request is invalid.",
    "requestId": "opaque-correlation-id",
    "fieldErrors": {
      "language": "This language is not enabled for review."
    }
  }
}
```

Use stable codes such as `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `INVALID_PROVIDER_RESPONSE`, `DATABASE_UNAVAILABLE` and `INTERNAL_ERROR`. Do not leak whether another user's review exists; return a consistent not-found response for non-owned IDs.

## 6. Pagination/filtering

Use bounded page size and stable ordering with a unique tie-breaker. Allowlist sort fields and directions. Validate date ranges and filters. Changing filters resets pagination on the client. Use cursor pagination if records can grow substantially; document cursor integrity and ownership.

## 7. Security requirements

- Authenticate every private route.
- Derive user identity from verified server-side session only.
- Enforce object-level ownership in the database query itself.
- Validate request body, params and query server-side.
- Apply rate and concurrency limits to review endpoints.
- Apply CSRF protection when cookie authentication is used.
- Restrict CORS to configured frontend origins.
- Redact source, credentials and tokens from logs.
- Return safe error messages with correlation IDs.
