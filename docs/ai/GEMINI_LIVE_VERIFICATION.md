# Gemini live verification — recorded evidence

Date: 2026-11-17 · Model: `gemini-3.1-flash-lite` · Key: server-side only (never in this
document, never in git, never in the browser bundle).

Two stages are recorded, because they prove different things:

1. **Local, with the fixed provider** — proves the code is correct.
2. **Deployed** — proves the running service is correct.

---

## Stage 1 — local backend with the real key (pre-merge proof of the fix)

Environment: local `mongod`, `NODE_ENV=test`, real `GEMINI_API_KEY`, real API calls.

### Review of a deliberately vulnerable file

Input: an Express handler containing string-concatenated SQL, a hardcoded key and `eval()`.

```
REVIEW: HTTP 201 in 2563 ms
status: completed | provider: gemini | model: gemini-3.1-flash-lite
findings: 3

[security/critical/high] SQL Injection Vulnerability
    lines 7-7  | Use parameterized queries (prepared statements) instead of string concatenation
[security/critical/high] Hardcoded Secret
    lines 10-10 | Remove the hardcoded secret and use environment variables / a secret manager
[security/critical/high] Remote Code Execution (RCE) via eval()
    lines 19-19 | Never use 'eval()'; use a safe sandboxed expression parser

summary: "The review identified three critical security vulnerabilities: SQL injection,
hardcoded credentials, and dangerous use of eval()."
limitationNotice: "This analysis is based on static code review and does not account for
runtime behavior, database configuration, or external dependencies."
```

The line numbers match the actual defect locations in the submitted source, and the
`limitationNotice` is the model's own caveat — not a canned string (the adapter only
substitutes a default when the model omits the field).

### Explain (`POST /api/v1/assist`, `action: explain`)

```
HTTP 200 in 1940 ms
result.explanation: "This JavaScript code defines a simple function named 'add' that takes
two inputs... performs a mathematical addition ... and returns the resulting sum..."
result.keyPoints: 4 items
```

### Improve (`POST /api/v1/assist`, `action: improve`)

```
HTTP 200 in 3156 ms | changes: 2
summary: "Improved code security by mitigating SQL injection risks and updated variable
declarations to follow modern JavaScript best practices."
change 1: "Prevent SQL Injection" — replaced string concatenation with a template literal
          and forced numeric conversion on 'id'
improvedCode:
  const query = `SELECT * FROM t WHERE id=${Number(id)}`;
  for (let i = 0; i < 10; i++) {
    console.log(i);
  }
```

The returned `improvedCode` is a complete, syntactically valid rewrite of the submitted
snippet — not a diff fragment and not an echo of the input.

---

## Defect found and fixed by this verification

Without a real key, every prior test passed because the provider tests inject a fake
transport. The first real call failed:

```
400 Bad Request — Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]
```

Cause: the adapter passed a bare `Content[]` array as the request body, with
`generationConfig` in the request-options slot instead of inside the body. Fix and
regression tests: see `docs/ai/GEMINI_CONFIGURATION.md` and
`backend/tests/provider.test.js` (“Gemini request shape (real API contract)”).

Verified that the new tests fail against the old code (2 failures) and pass against the fix.

---

## Stage 2 — deployed service (2026-11-17, after the fix was merged and deployed)

Environment: `main` @ `930e775` on Render Free, `GEMINI_MODEL=gemini-3.1-flash-lite`,
exercised **through the public Netlify origin** (`https://codesenseai-review.netlify.app/api/v1`),
so the proxy, CORS, cookies, CSRF and auth path are all included — not a direct-to-Render call.

```
GET  /health/ready            200    438 ms   {"database":"connected","provider":"configured"}
GET  /auth/csrf-token         200    301 ms   session token issued
POST /auth/register           201   2392 ms   real account created
GET  /auth/csrf-token         200    275 ms   token rotated after session regeneration
GET  /auth/me                 200    367 ms   session valid
POST /reviews                 201   3460 ms   status=completed | provider=gemini | model=gemini-3.1-flash-lite
POST /assist (explain)        200   2691 ms   keyPoints: 5
POST /assist (improve)        200   2652 ms   changes: 3
GET  /reviews?page=1          200    501 ms   persisted record returned
GET  /languages               200    277 ms   5 languages
```

Review of a string-concatenated SQL handler — persisted record (read back from Atlas, not
from the create response):

```
findings: 2
[security/critical]  line 5  SQL Injection Vulnerability
[bug/correctness/medium] line 5-7  Missing Error Handling
```

Both locations match real defects in the submitted source. A second snippet produced
`[medium] Potential TypeError ... line 3` and `[low] Use of var instead of const/let`, i.e.
the model is reading the actual code rather than emitting a fixed template.

Rate limiting was re-verified on the deployed service after the `express-rate-limit` 8
migration (13 wrong-password logins): `401 ×10` then `429 ×3`, `RateLimit-Policy: 10;w=60`,
body `{"error":{"code":"RATE_LIMITED",...}}` — the limiter still enforces.

All verification accounts, their reviews and sessions were deleted from Atlas afterwards;
only the real user account remains.

## Honesty notes

- If the free-tier quota is exhausted, the API returns `429 PROVIDER_RATE_LIMITED`; the UI
  shows a "try later" state. No findings are ever synthesised.
- `gemini-3.8-flash`, `gemini-flash-latest` and `gemini-3.7-flash` were **not** usable at
  test time (timeouts), and the 2.5 flash models return 404 for new users. Only models
  actually observed returning 200 are claimed as working.
- No API key appears in any log line, screenshot, test artifact or document.
