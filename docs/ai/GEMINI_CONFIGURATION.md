# Gemini integration — configuration, validated model, activation runbook

Status: **provider wired and verified end-to-end; key intentionally not stored in the repo.**
The backend is the only component that ever holds the key.

## Where the integration lives

| Concern | Code |
| --- | --- |
| Adapter (prompting, JSON contract, retries, timeouts) | `backend/src/providers/gemini.js` |
| Instantiation + "is it configured?" decision | `backend/src/services/reviewService.js` (`providerAdapter()`) |
| Credentials | `GEMINI_API_KEY`, `GEMINI_MODEL` — read from `process.env` only, never passed to the client |
| Honest degradation | reviews → `502 {status:"failed", providerUnavailable:true}`; assist → `503 PROVIDER_UNAVAILABLE` |

The SDK (`@google/generative-ai`) is server-side only; the browser bundle contains no
Model/API-key reference (`git grep` for `AIza`/`GEMINI_API_KEY` in `frontend/` → 0 hits).

## Model name — validated by a real generateContent call, not by the model list

Two traps were hit while activating this, both now documented and tested:

**Trap 1 — `models.list` is not an availability check.** A `models.list` call returns 49
`generateContent`-capable models, but several of them answer a real request with
`404 ... is no longer available to new users`. Presence in the list proves nothing.

**Trap 2 — the request body shape was wrong.** The adapter sent a bare `Content[]` array as
the request body and put `generationConfig` in the *request options* slot. The unit tests
injected a fake transport, so no body was ever serialised and the suite passed while every
real call failed with:

```
400 Invalid JSON payload received. Unknown name "role" at 'contents[0].parts[0]'
```

Fixed in `backend/src/providers/gemini.js` (body is now
`{ contents: [{role, parts}], generationConfig }`, with the AbortSignal in request options)
and pinned by two regression tests in `backend/tests/provider.test.js` that assert the
serialised contract and fail against the old code.

### Measured availability (same key, one session, 2026-11-17)

| Model | Result of a real `generateContent` call |
| --- | --- |
| `gemini-3.1-flash-lite` | **HTTP 200**, ~2–8 s, valid JSON ✅ |
| `gemini-3.5-flash-lite` | **HTTP 200**, ~8 s, valid JSON ✅ |
| `gemini-2.5-flash` | 404 — no longer available to new users |
| `gemini-2.5-flash-lite` | 404 — no longer available to new users |
| `gemini-3.5-flash` | 503 — high demand |
| `gemini-3.6-flash` | 503 — high demand |
| `gemini-3.8-flash` | timeout (>45 s) at time of testing |
| `gemini-flash-latest` | timeout (>45 s) at time of testing |
| `gemini-3.7-flash` | timeout (>15 s) at time of testing |

**Selected: `gemini-3.1-flash-lite`** — a stable, versioned, non-preview name that answered
real requests reliably, with a 1M-token input window and a 65,536-token output ceiling
(the adapter caps output at `GEMINI_MAX_OUTPUT_CHARS=32768`).

`gemini-1.5-flash-latest` from the old `.env.example` does not exist at all any more.

The higher flash tiers are currently overloaded rather than access-denied (503/timeout, not
403/404), so they can be selected later by changing one environment variable — no code
change. The adapter already retries 429/503/504 with backoff, which is what rides out those
transient 503s.

## Cost control (budget stays zero)

| Control | Value |
| --- | --- |
| Retries | `GEMINI_MAX_RETRIES=2` with per-attempt timeout `GEMINI_TIMEOUT_MS=60000` and a hard total deadline (`timeout × (retries+1)`) |
| Output cap | `GEMINI_MAX_OUTPUT_CHARS=32768`, sent as `maxOutputTokens = ceil(chars/4)` |
| Input cap | `REVIEW_SOURCE_SIZE_LIMIT_BYTES=65536` (64 KiB) rejected with `413` before any provider call |
| Abuse control | review/assist: 30/min per user (or per IP when anonymous); auth: 10/min/(IP+email) and 60/min/IP |
| Billing | none — no paid tier, no billing account link, no `usage`-based upgrade |

If the free quota is exhausted, the adapter maps 429 to
`PROVIDER_RATE_LIMITED` and the UI shows an honest "try later" state. It never fabricates
findings.

## Activation runbook

1. Render dashboard → service `codesense-ai-backend` → **Environment**:
   - `GEMINI_API_KEY` = your key (secret; never in git, never in the frontend).
   - `GEMINI_MODEL` = `gemini-3.1-flash-lite` (verified working; see the table above).
2. Save — Render redeploys automatically.
3. Verify configuration is visible **without** disclosing it:
   ```bash
   curl -s https://codesense-ai-backend-9skh.onrender.com/api/v1/health/ready
   # → {"checks":{"database":"connected","provider":"configured"}}
   ```
4. Verify a **real** generation (requires an authenticated session + CSRF token; see
   `deploy/e2e.js` for the full flow):
   ```bash
   # after login, with $CSRF and cookie jar $JAR:
   curl -s -b $JAR -X POST https://codesense-ai-backend-9skh.onrender.com/api/v1/reviews \
     -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
     -d '{"source":"function f(a){return eval(a)}","language":"javascript","title":"smoke"}'
   # → 201 with real findings, or an honest error status. Never mock data.
   ```
5. If the key is invalid, `/health/ready` still reports `configured` (it checks presence,
   not validity) — a real request then returns `PROVIDER_AUTH_ERROR` (502). That is the
   honest signal to look for.

## What "verified" means here

- Wiring, degradation, and status codes: verified live without a key.
- Model name: verified by real `generateContent` calls, not by the model list.
- Real generation quality: verified with an actual key — see
  [`GEMINI_LIVE_VERIFICATION.md`](GEMINI_LIVE_VERIFICATION.md) for recorded output,
  latencies and status codes.
