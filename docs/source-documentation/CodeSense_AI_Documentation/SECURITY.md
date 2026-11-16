# Security Architecture and Secure Development Requirements

## 1. Security objectives and threat model

Protect accounts, source code, saved reports, provider credentials and infrastructure. Treat browser input, submitted code, AI output, query parameters and external responses as untrusted. Threats include credential stuffing, brute force, session theft, XSS, CSRF, IDOR/BOLA, NoSQL injection, prompt injection, oversized submissions, resource exhaustion, provider abuse, log leakage, dependency compromise and cloud misconfiguration.

## 2. Authentication and sessions

Hash passwords with Argon2id where supported; use bcrypt only as a justified fallback with suitable cost. Never store plaintext passwords. Apply login throttling, generic auth errors and secure session lifecycle.

Prefer secure HttpOnly cookies with Secure in production and SameSite settings, plus CSRF controls for state-changing requests. If JWT is selected, define short access lifetime, refresh rotation/revocation, issuer/audience validation and safe storage. Avoid long-lived tokens in localStorage. Logout and security changes invalidate relevant credentials.

## 3. Authorization and ownership

Every private review operation enforces owner identity in backend/database queries. Hidden buttons and client route guards are not authorization. Test cross-account access using independent users. Do not reveal whether another user's report exists. Account preferences and deletion follow the same ownership model.

## 4. Input/output defenses

Validate content type, size, types, string bounds, language allowlist, pagination and sort keys. Build MongoDB queries from validated allowlisted fields; never pass raw browser query objects. Render AI output as text or safely sanitized structured content. Do not trust model-generated HTML or Markdown. Prevent unsafe DOM insertion and stored/reflected XSS.

Treat source comments and string literals as untrusted content. The AI system prompt must tell the model not to obey source-embedded instructions. Delimit source as data and validate output schema. This reduces prompt injection risk but does not make the model trustworthy.

## 5. Source-code privacy

Disclose that submitted source may be transmitted to an external AI provider. Explain processing and retention only to the degree supported by provider terms. Avoid sending unrelated profile data. Detect likely secrets where practical and warn; never modify source silently. Do not log full source or full prompt/response by default. Define application retention and deletion policy.

## 6. AI provider security

Keep provider keys only in backend secret storage. Use least-privilege keys, rotation, timeouts, output limits and usage caps. Validate schema, category, severity, confidence, locations and suggested code. An AI claim is not security proof. Do not expose raw provider errors or automatically execute suggested code.

## 7. Code execution boundary

Initial release performs static/AI-assisted review. It must not execute arbitrary submitted code on API host, web process, worker or shared deployment environment. Monaco is not a runtime. Future execution requires separate approval and threat model, ephemeral isolation, non-root execution, hardened containers/sandbox, read-only filesystem, no secrets, network disabled by default, CPU/memory/process/time/output limits and teardown verification. Code execution is out of first-release acceptance.

## 8. Transport and browser controls

Use HTTPS in production, HSTS where appropriate, secure headers, restrictive CSP compatible with Monaco workers, explicit CORS origins, MIME sniffing protection, clickjacking protection and secure cookie attributes. Avoid wildcard origins with credentials. Test CSP requirements rather than disabling it broadly.

## 9. Rate and resource protection

Layer limits across login, registration, review submission, concurrent provider calls, source size, output size and history queries. Use user/global limits, bounded timeouts/retries and anomaly monitoring without collecting source content.

## 10. Logging and secrets

Redact passwords, cookies, tokens, provider keys, database URIs and source. Use request IDs and safe error codes. Keep secrets out of Git, logs, screenshots, issues and ZIP. `.env.example` has names/explanations only. Scan history and delivery archive. If a secret was committed, rotate it; deleting the visible file alone is insufficient.

## 11. Supply chain

Use lockfiles, trusted registries, maintained packages and vulnerability scanning. Review transitive findings and license obligations. Avoid abandoned packages and unexplained install scripts.

## 12. Security testing

Test auth throttling, session invalidation, CSRF, XSS, NoSQL injection, IDOR across accounts, oversized payloads, malicious source, prompt injection, key exposure, CORS/CSP, log redaction, deletion and dependency findings. Record residual risk. Do not claim a formal penetration test unless qualified testing actually occurred.

## 13. Incident response

On suspected compromise: preserve evidence, rotate exposed credentials, contain access, assess affected data, patch root cause, verify recovery and document required communications. Never conceal a security failure by suppressing logs or weakening controls.
