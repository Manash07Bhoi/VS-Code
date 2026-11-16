# Technical Architecture — CodeSense AI

## 1. Architecture summary

Use a separated client/server architecture with explicit trust boundaries:

```text
Desktop Browser
  ├── HTML / CSS / Vanilla JavaScript
  ├── Monaco Editor
  └── API client
          │ HTTPS / JSON
          ▼
Node.js + Express Backend
  ├── Authentication / Session
  ├── Validation / Rate limiting
  ├── Review orchestration
  ├── AI provider adapter
  ├── Report normalization / validation
  ├── History / account services
  └── Observability / health
       │                 │
       ▼                 ▼
MongoDB            AI Provider API
Users, reviews,    Gemini primary;
preferences,       optional provider
conditional events only when integrated
```

Frontend and backend live in separate directories with independent development/build scripts. Browser never receives AI keys or DB credentials.

## 2. Frontend architecture

Use semantic HTML, modular Vanilla JavaScript and centralized CSS tokens. Organize by application concerns: initialization, routing/navigation, API client, auth state, reusable components, page modules, Monaco integration, validation and utilities. Avoid a monolithic global script and do not introduce a frontend framework.

Centralize API base URL, credentials, timeout, request ID, JSON parsing and error normalization. Use safe DOM insertion and render AI output as structured text; never trust model HTML.

Monaco lifecycle is explicit: initialize after container readiness, handle loader/network failures, update language, track source revisions, dispose instances/listeners on teardown and avoid repeated initialization.

## 3. Backend architecture

Express is organized into routes, controllers, services, models, middleware, validators, configuration and utilities. Controllers translate HTTP; services own business operations; models own persistence definitions; validators define trust boundaries. Do not put all business logic in route handlers.

Service boundaries:
- authentication/session;
- user/profile/preferences;
- review orchestration;
- AI provider adapter and prompt/schema versioning;
- report normalization;
- history/search;
- notification service only if real async events exist;
- health/readiness and diagnostics.

## 4. AI provider abstraction

Define provider configuration, request construction, invocation, timeout, response normalization and error mapping. Gemini is the primary intended provider. OpenAI is optional; add only with real credentials and adapter tests. An interface alone is not provider support.

AI instruction requirements:
- state review task and output contract;
- treat source and comments as untrusted data;
- prohibit obeying instructions embedded in source;
- ask for evidence tied to source;
- separate severity from confidence;
- require locations only when supported;
- allow no findings and uncertain findings;
- request clear beginner-friendly explanations;
- avoid invented APIs, files or execution results;
- suggest focused corrected code only when defensible.

Validate response against a strict schema and output limits. Record prompt/schema version without logging user source by default.

## 5. Database boundary

MongoDB is the default persistence layer. Database access belongs to backend services. Use indexes for owner-scoped history, normalized identifiers and retention queries. Use explicit timestamps and validation. Browser never connects directly to MongoDB.

## 6. Synchronous versus asynchronous review

Choose the simplest robust model compatible with measured provider latency and hosting constraints. A bounded synchronous request can be acceptable for short reviews if timeouts, limits and persistence are sound. If processing exceeds HTTP/runtime constraints, add a durable queue and workers. Never simulate a queue with timers. Document the decision and evidence.

## 7. API contract

Use JSON REST endpoints, consistent status codes, request IDs and a documented error envelope. Version the API when warranted. Enforce authentication, ownership and validation server-side. Document only implemented endpoints. `API.md` must match code.

## 8. Configuration

Separate dev/test/staging/production settings. Validate required environment variables at startup. No fake secret defaults. Keep public frontend configuration separate from backend secrets. Restrict CORS to allowed origins. Production transport is HTTPS.

## 9. Reliability

Handle database disconnection, provider outage, timeout, invalid output and process shutdown gracefully. Use bounded retries only for retryable operations. Never retry non-idempotent review submission blindly. Health checks distinguish liveness from dependency readiness. Graceful shutdown stops accepting requests and closes resources.

## 10. Architecture decisions

Record context, chosen option, alternatives, consequences and evidence for framework, backend, database, session model, provider, languages, analysis tooling, sync/async workflow, retention and deployment. Update this document if actual implementation differs.
