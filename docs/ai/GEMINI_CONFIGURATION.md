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

## Model name — validated against the live API, not copied from `.env.example`

`.env.example` shipped `gemini-1.5-flash-latest`. A live
`GET https://generativelanguage.googleapis.com/v1beta/models` call (200 OK, 49 models
supporting `generateContent`) does **not** list `gemini-1.5-flash-latest` — the 1.5 family
is retired. Deploying that value would have produced permanent provider errors.

Available flash-tier models observed at validation time include:

| Model | Input tokens | Output tokens |
| --- | --- | --- |
| `gemini-2.5-flash` | 1,048,576 | 65,536 |
| `gemini-2.5-flash-lite` | 1,048,576 | 65,536 |
| `gemini-flash-latest` | 1,048,576 | 65,536 |

**Selected: `gemini-2.5-flash`** — a stable, versioned, free-tier-eligible name (not a
`-latest` alias that can silently move), with a large input window and a 65,536-token
output ceiling that comfortably covers `GEMINI_MAX_OUTPUT_CHARS` (32,768 chars ≈ 8k tokens
for the request's `maxOutputTokens`).

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
   - `GEMINI_MODEL` = `gemini-2.5-flash`.
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
- Model name: verified against the live model list.
- Real generation quality: verified only by an actual request with a real key — see the
  deployment report for the recorded result of that test.
