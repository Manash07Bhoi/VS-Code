# Authentication, Session and Authorization Design — CodeSense AI

## 1. Decision required before coding

Choose one session architecture and document it in `DECISIONS.md`. For a same-site web frontend and API, an opaque server-managed session in a secure cookie is a strong default. Do not mix cookie and bearer-token patterns without a documented reason.

## 2. Password lifecycle

- Hash passwords with a modern password-hashing function such as Argon2id or bcrypt using a maintained library and reviewed parameters.
- Never encrypt passwords for later recovery.
- Never log passwords, password hashes, reset tokens or authentication payloads.
- Normalize email consistently; do not apply unsafe transformations to the local part.
- Use generic login failure messaging.
- Rate-limit registration, login and any future recovery endpoint.
- Do not claim email verification or password reset unless a real delivery and token lifecycle exists.

## 3. Cookie session requirements

If cookie sessions are selected:
- `HttpOnly` always.
- `Secure` in production.
- `SameSite=Lax` or stricter where compatible with the app's navigation.
- Explicit path and expiry/max-age.
- Rotate session identifier after login and privilege changes.
- Revoke on logout and account security events.
- Protect state-changing requests with CSRF tokens or a rigorously validated same-site strategy.
- Do not store session secrets in localStorage/sessionStorage.
- Configure proxy trust carefully; do not infer HTTPS from arbitrary forwarded headers.

## 4. Authorization

Every review belongs to exactly one authenticated user. Query by both record ID and authenticated owner ID. Never fetch by ID and then rely only on frontend hiding. Never trust owner ID, role or admin flags from the request body.

MVP has no administrator console unless separately approved. Do not invent admin roles or expose unneeded privilege levels.

## 5. Session state transitions

`ANONYMOUS → AUTHENTICATED → EXPIRED/REVOKED → ANONYMOUS`.

On protected API `401`, clear stale client auth state and route to login with a safe internal return path. Do not retry protected operations indefinitely. Do not show a success state when session persistence fails.

## 6. Required tests

- valid/invalid login;
- duplicate registration;
- password hash not equal to plaintext;
- session fixation resistance/rotation;
- expiry and revocation;
- logout followed by replay;
- CSRF for cookie auth;
- CORS origin rejection;
- IDOR attempts on review read/delete;
- brute-force/rate-limit behavior;
- no secret leakage in client bundle or logs.
