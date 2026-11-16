# AI Review Architecture — CodeSense AI

**Updated:** 2026-11-16

## Two provider operations

| Operation | Endpoint | Persistence | Purpose |
|---|---|---|---|
| `analyze()` | `POST /api/v1/reviews` | Persisted (Review document, owner-scoped) | Structured findings: category, severity, confidence, title, explanation, impact, recommendation, evidence, line range, snippet, caveats |
| `assist()` | `POST /api/v1/assist` | **Ephemeral** (never stored) | `explain`: plain-language explanation + key points; `improve`: complete improved source + change list |

Both share one generation loop in `GeminiAdapter._generate()`: per-attempt timeout bounded by a total deadline, transient-only retries with backoff, non-retryable mapping for auth/config/malformed responses, and strict JSON output contracts with sanitization (HTML/script-like content stripped, lengths bounded).

## Review flow (persisted)

1. Client submits `{ source, language, title?, clientRequestId?, focus? }` (auth + CSRF + rate-limited; zod-validated; language registry enforced; 64 KiB cap).
2. Service creates a lifecycle record (`accepted`) with SHA-256 source digest.
3. Provider adapter is built **only** from server env (`GEMINI_API_KEY`/`GEMINI_MODEL`); when absent, the record is marked `failed` with `"AI provider is not configured on the server."` and the client shows the honest unavailable state — never canned output.
4. Findings are normalized (allow-listed categories/severities/confidences, line ranges validated) and persisted (`completed`).
5. `focus: "security"` adds a prioritized-security instruction block to the prompt and is stored on the review.

## Assist flow (ephemeral)

1. Client submits `{ action: 'explain' | 'improve', source, language, hasSelection? }` (same middleware chain).
2. Provider returns a strict-JSON result; explain results are sanitized text, improve results carry the complete proposed source (bounded to 128 KiB).
3. Nothing is persisted — assist is workspace help, not a record.

## Workbench integration

- **AI Review panel** actions map to: Review Current File, Review Selection (line offsets are corrected when navigating findings), Security-Focused Review, Explain Code, Generate Fix Suggestions.
- **Staleness**: each review captures a SHA-256 digest of the reviewed source; if the file changes afterwards, findings are marked stale, line navigation is refused, and the user is told to re-run — findings never claim accuracy they no longer have.
- **Diff viewer**: `improve` results open side-by-side (original vs proposed). *Accept* applies the proposal and marks the file dirty (explicit save still required); selection-scoped proposals replace only the selection. *Reject* closes without touching the file.
- **Problems panel**: AI findings appear alongside editor diagnostics, labeled `[AI Review]`, filterable by source — never presented as compiler errors.
- **Review reports**: persisted reviews remain browsable (dashboard/history/report pages); "Jump to location" opens the reviewed source as a scratch file in the workbench at the finding's line.

## Prompt-injection resistance

Every prompt declares the source as untrusted DATA (not instructions), forbids obeying embedded comments/strings, forbids revealing prompts/keys, and forbids claiming execution results. Outputs are parsed as strict JSON and sanitized before use.

## Failure honesty

- Provider not configured → `503 PROVIDER_UNAVAILABLE` (assist) / persisted `failed` review with `providerUnavailable: true` (reviews).
- Rate limited → 429 surfaced to the user.
- Malformed provider output → `INVALID_PROVIDER_RESPONSE`, never a guessed fallback.
