# AI Review Engine — Analysis Contract, Prompt Safety and Result Quality

## 1. Purpose and limitations

The AI review engine converts submitted source into structured, evidence-oriented feedback. It is an advisory component, not a compiler, formal verifier, penetration-test certification or guarantee of correctness. It can miss defects, misunderstand context and produce false positives. The interface and reports must communicate this limitation.

## 2. Processing boundary

The browser submits source and canonical language identifier to the backend. The backend validates the user, input size, language capability, limits and request state. Only the backend contacts the configured provider. The AI key never enters frontend assets. Provider responses are treated as untrusted external data until schema validation and normalization finish.

## 3. Analysis stages

1. Validate input and supported language.
2. Preserve source revision identity.
3. Run deterministic static analysis only where a real language-specific tool is installed, configured and tested.
4. Build the provider request with explicit system instructions and bounded context.
5. Call the configured provider with timeout and concurrency controls.
6. Parse structured output.
7. Validate strict schema and semantic invariants.
8. Cross-check returned locations against submitted source when feasible.
9. Normalize severity, confidence, categories and safe display fields.
10. Persist valid result and metadata.
11. Expose the report to the owner.

Do not add a deterministic analyzer claim when the implementation only calls a language model. When a linter/parser is integrated, label the source of each finding so users can distinguish deterministic diagnostics from AI suggestions.

## 4. Prompt-injection resistance

Submitted source is untrusted data. Source comments, strings, README text, embedded prompts or code blocks may contain instructions. The system prompt must explicitly state that all submitted material is the object of analysis and cannot override the system task. Delimit the source and metadata structurally. Do not concatenate untrusted source into instructions without boundaries.

Prompt-injection resistance is defense-in-depth, not a guarantee. Do not expose system prompts, provider credentials, internal server configuration or other users' data to the model. Do not allow the model to select arbitrary tools, URLs, files or server commands.

## 5. Required finding fields

A normalized finding should use a versioned schema containing:
- stable finding ID;
- category: bug/correctness, security, performance or code quality;
- title;
- concise explanation;
- impact/consequence;
- evidence excerpt or precise explanation of the source construct;
- location: line/range only when reliably determinable;
- severity, when meaningful;
- confidence/evidence strength, independently from severity;
- recommendation;
- optional improved code or scoped patch;
- caveats/context needed to interpret the finding.

Validation must reject unknown categories, oversized text, invalid line ranges, unsafe markup and inconsistent values. Missing optional values remain absent/null according to schema; they are not filled with invented defaults. A finding that references a line outside the source must be downgraded to location-unavailable or rejected according to the normalizer's tested policy.

## 6. Severity and confidence

Severity estimates potential impact if a finding is valid. Confidence estimates how strongly the provided source supports the claim. They are different dimensions. Do not elevate a finding to critical only because the model used alarming language. Define a consistent severity guide and calibrate it with reviewed examples. Unknown severity is preferable to invented certainty.

## 7. Improved-code behavior

A suggestion should be narrow enough to explain and review. Include assumptions, behavior changes and tests the user should run. Preserve original source. Applying suggested code requires explicit user action, with a diff/compare view where feasible. Do not execute generated code automatically. Do not claim a suggested patch compiles or passes tests unless those tests were actually run in a safe, approved environment.

## 8. No-findings behavior

A valid empty findings array is a legitimate result. The report must state that the configured review returned no findings for the submitted content, while noting limits of analysis. It must not state that source is secure, bug-free or production-ready.

## 9. Provider failures and fallback

Classify provider failures: not configured, authentication failure, rate limited, unavailable, timeout, invalid response, unsupported model and output limit. Do not generate a canned response, substitute a different provider without configured permission or mark the review complete without validated output. A retry must be bounded and safe against duplicate creation/provider charges.

## 10. Privacy and telemetry

Minimize code sent to provider, avoid logging source/prompt/full response, and disclose provider processing. Retain provider/model ID, schema/prompt version, latency, token usage and request ID only when available and safe. Never fabricate missing telemetry. Redact any secret patterns where feasible and notify the user if source appears to contain credentials; do not alter source silently.

## 11. Quality evaluation

Build a reviewed evaluation set inside test-only assets with permission-cleared source samples. Include true defects, benign patterns, ambiguous examples, security contexts, performance cases, syntax errors and malicious prompt-injection strings. Track precision/false positives and recall where reliable ground truth exists. Human review is necessary for ambiguous security findings. Test every supported language and document the scope. Do not publish model accuracy claims without a statistically and methodologically defensible evaluation.

## 12. Acceptance gates

- Provider call originates only from backend.
- Submitted source is isolated as data in prompt.
- Response validates against strict versioned schema.
- No invented line numbers or findings.
- Severity and confidence remain distinct.
- Invalid model output cannot become success.
- Provider failure remains visible as failure.
- Report is persisted before completion status is returned.
- Suggested code is not executed automatically.
- A live provider smoke test is recorded separately from deterministic adapter tests.
