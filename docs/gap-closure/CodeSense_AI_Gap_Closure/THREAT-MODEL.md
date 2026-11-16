# Threat Model and Abuse Cases — CodeSense AI

## 1. Assets

User accounts and sessions; submitted source code; review reports; provider credentials; database credentials; provider spend/quota; application integrity; deployment secrets; logs and operational metadata.

## 2. Trust boundaries

1. Browser to application API.
2. Application API to MongoDB.
3. Application backend to AI provider.
4. Build/CI system to deployment.
5. Untrusted submitted code/comments/strings to AI prompt.
6. User-owned report IDs to object-level authorization.

## 3. Threat register

| Threat | Impact | Required mitigation | Verification |
|---|---|---|---|
| Credential stuffing/brute force | Account takeover | Password hashing, rate limits, generic errors, monitoring | Auth abuse tests |
| Session theft/replay | Account takeover | HttpOnly Secure cookies or reviewed token lifecycle, rotation/revocation | Session tests |
| CSRF | Unauthorized state change | CSRF token/same-site controls | CSRF tests |
| XSS from code/report rendering | Script execution | Render source/findings as text, escape HTML, strict CSP | XSS payload tests |
| IDOR | Read/delete another user's code | Owner-scoped DB queries | Cross-user tests |
| Prompt injection in code comments | Model manipulation/data disclosure | Treat source as untrusted data; no tools/secrets in model context | Adversarial corpus |
| Provider output injection | Stored/reflected XSS or unsafe actions | Schema validation, text rendering, never execute output | Malformed-output tests |
| Provider key exposure | Cost and account compromise | Server-side secrets, secret scanning, no client embedding | Bundle and repo scan |
| Denial of wallet | Unexpected provider cost | Rate/concurrency/source/output caps, budgets and alerts | Load/abuse tests |
| Malicious source execution | Server compromise | Never execute user code; no shell/compile execution in request path | Architecture review |
| MongoDB injection | Data exposure/corruption | Schema validation, safe query construction, no user-built operators | API security tests |
| Dependency compromise | Supply-chain risk | Lockfiles, review, audit, SBOM/license checks | CI scans |
| Data leak via logs | Source/privacy breach | Redaction, no raw source/password/token logs | Log inspection |
| CORS misconfiguration | Cross-origin abuse | Explicit allowlist | Browser/API tests |

## 4. Security invariants

- User source is never executed by the service.
- Provider credentials are never sent to the browser.
- Every private resource lookup is owner-scoped.
- Model output is never trusted as executable HTML, JavaScript, SQL, shell or configuration.
- Logs never include passwords, tokens, provider keys or full source code by default.
- A provider outage never triggers fake success.
- No feature may bypass server-side validation by manipulating frontend state.

## 5. Residual risk

AI output may be inaccurate, incomplete or manipulated. These risks cannot be eliminated by prompt wording alone. The app must communicate that findings are advisory and require human validation. Do not claim security certification or guaranteed vulnerability coverage.

## 6. Review cadence

Revisit the threat model after auth, provider, storage, deployment or feature changes and before release. Record threat, owner, severity, mitigation, evidence and accepted residual risk.
