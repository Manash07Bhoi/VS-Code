# AI Provider Integration and Operational Contract — CodeSense AI

## 1. Provider boundary

The backend owns provider credentials, model selection, prompts, request shaping, timeouts, retries, response validation and cost/concurrency limits. The browser must never call the paid provider directly or contain provider secrets.

Use a provider adapter interface so the application domain does not depend on a vendor SDK. Provider selection is configuration controlled, not client controlled. Only implement providers that can be configured and tested with real credentials.

## 2. Request lifecycle

1. Authenticate the user.
2. Validate source, language, size and rate limits.
3. Create a durable review record/state if the selected workflow requires it.
4. Build a language-specific, bounded analysis request.
5. Call configured provider with timeout and cancellation behavior.
6. Parse structured output.
7. Validate schema, enum values, output size and line ranges.
8. Normalize and persist result.
9. Return persisted report.
10. On any failure, persist/report failure truthfully and expose a safe error.

## 3. Retry policy

Do not blindly retry non-idempotent calls. Retry only transient failures and only within a strict attempt/time budget. Treat authentication errors, invalid model/configuration, malformed request and quota exhaustion as non-retryable until configuration or quota changes. Avoid retry storms and duplicate persisted reports.

## 4. Response validation

Reject or safely quarantine:
- invalid JSON;
- missing required fields;
- unsupported categories/severities;
- oversized output;
- impossible or out-of-range line numbers;
- malformed snippets;
- unsupported language claims;
- content that attempts to return HTML/script for direct rendering.

Do not coerce malformed provider output into a completed report. Preserve safe diagnostic metadata without raw secrets/source logging.

## 5. Prompt-injection resistance

Submitted source code, comments, string literals, filenames and embedded documentation are untrusted data, not instructions to the analysis system. The system prompt must explicitly separate code-under-review from instructions. The model must not reveal hidden prompts, credentials, environment variables or internal policy. Do not provide tools that execute code, access files, browse arbitrary URLs or mutate infrastructure from the analysis prompt.

A model may still be manipulated. Treat all output as untrusted, validate it, render it as text, and never execute suggested code automatically.

## 6. Cost and abuse controls

Define and enforce:
- maximum source bytes per request;
- maximum output tokens/characters;
- per-user request rate;
- per-user concurrent reviews;
- global provider concurrency;
- provider timeout;
- request budget/quotas;
- retention and cleanup for failed jobs;
- alerts for abnormal cost and provider error rates.

Do not advertise a user quota or usage dashboard unless the underlying accounting is real and reliable.

## 7. Provider fallback

A fallback provider may be used only if explicitly configured, legally/contractually acceptable, and tested with the same schema. Never silently switch providers in a way that violates the user's data disclosure. Never return canned output when all providers fail.

## 8. Evaluation

Maintain a versioned, isolated evaluation corpus with permission to use each sample. Evaluate each language separately for:
- correctness of finding;
- false-positive rate;
- severity calibration;
- line-location accuracy;
- recommendation applicability;
- unsupported claims;
- prompt-injection robustness.

Do not publish accuracy percentages without a reproducible dataset, scoring protocol, sample count and date. Test fixtures must never be served as production user reports.
