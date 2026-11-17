# AI Provider Configuration and Limitations — CodeSense AI

## Provider

Gemini is the primary AI provider, accessed through the `@google/generative-ai` SDK from the backend only. The provider adapter interface (`src/providers/base.js`) decouples the application domain from the vendor SDK. OpenAI is an optional addition only if genuinely implemented, configured, and tested.

## Configuration (backend environment variables)

| Variable | Purpose | Default |
|----------|---------|---------|
| `GEMINI_API_KEY` | Gemini API key (backend-only). Optional — backend starts without it and returns an honest provider-unavailable state. | — |
| `GEMINI_MODEL` | Model name. Optional when no API key is configured. | *(empty)* — use a validated name such as `gemini-3.1-flash-lite` |
| `GEMINI_TIMEOUT_MS` | Request timeout | 60000 |
| `GEMINI_MAX_RETRIES` | Retry count for transient failures | 2 |
| `GEMINI_MAX_OUTPUT_CHARS` | Max output characters | 32768 |

## Request lifecycle

1. Backend authenticates the user (session).
2. Validates source, language, size, and rate limits.
3. Creates a persisted review record (status `accepted`).
4. Builds a language-specific system prompt with strict JSON output contract.
5. Calls Gemini from the backend with timeout and cancellation (`AbortController`).
6. Parses and validates the response against the strict schema.
7. Normalizes findings (categories, severities, confidences, line ranges).
8. Persists the completed result or an honest failure.
9. Returns the report to the client.

## Retry policy

- Transient failures (429, 503, 504, abort/timeout) are retried with bounded backoff (500ms × attempt).
- Non-retryable: 401, 403, 400 (auth/config/invalid request).
- Max attempts = `GEMINI_MAX_RETRIES + 1`.
- Non-idempotent review submission is not blindly retried; provider failures result in a persisted `failed` review.

## Output validation

The provider response must be a JSON object with:
- `findings`: array of finding objects
- `summary`: optional string
- `limitationNotice`: optional string

Each finding is validated against:
- `category`: must be `bug/correctness`, `security`, `performance`, or `code-quality`
- `severity`: `low`/`medium`/`high`/`critical` or null
- `confidence`: `low`/`medium`/`high` or null (independent of severity)
- `lineStart`/`lineEnd`: integers >= 1, or null; `lineEnd >= lineStart` when both present
- Text fields sanitized (HTML stripped, length-bounded to 2000 chars)

Invalid JSON, missing `findings` array, or invalid enum values → `INVALID_PROVIDER_RESPONSE` (502), review marked `failed`.

## Prompt-injection resistance

- Submitted source is delimited as untrusted data (`<<SOURCE_START>>` … `<<SOURCE_END>>`), never concatenated into instructions.
- The system prompt explicitly states that source comments, strings, and embedded text are the object of analysis, not instructions.
- The model is instructed not to reveal system prompts, API keys, or internal configuration.
- The model is not given tools to execute code, access files, or browse URLs.
- All model output is treated as untrusted, schema-validated, and rendered as text (never raw HTML).

## Honest failure behavior

When the provider is not configured, unavailable, rate-limited, timing out, or returning invalid output:
- The review is persisted with status `failed` and an honest `failureReason`.
- The client is shown a truthful error state (e.g., "AI provider is not configured on the server").
- No canned, fabricated, or simulated findings are ever generated.
- `GEMINI_API_KEY` absence is visible via the `/api/v1/health/ready` endpoint (`provider: not-configured`).

## Limitations

- Findings are advisory only; the AI is not a compiler, formal verifier, or penetration-test certification.
- No findings does not mean the code is safe or production-ready.
- Severity and confidence are distinct dimensions; severity is not elevated based on alarming language.
- Line numbers are included only when reliably determinable from the source.
- Without a valid `GEMINI_API_KEY`, all reviews return provider-unavailable failures. This is expected behavior, not a defect.
