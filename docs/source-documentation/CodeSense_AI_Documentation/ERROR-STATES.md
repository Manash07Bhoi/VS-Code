# Error, Loading, Empty, Offline and Recovery States

## 1. Principles

Every state communicates what happened, what data is safe, whether the user must act and what recovery is possible. Never show success after failure, conceal dependency outages with sample data or display indefinite spinners.

## 2. Loading

Use localized skeletons/progress for regions actually loading. Distinguish editor init, session validation, report fetch, history query and AI review. Show AI accepted/processing/completed/failed from backend state. Use indeterminate progress unless backend reports measured progress. Every loading state terminates on success, failure, cancellation or timeout.

## 3. Empty states

- No history: no saved reviews exist; offer New Review.
- No search matches: records exist outside current criteria; offer Clear filters.
- No findings: analysis returned no findings; clarify this is not a correctness/security guarantee.
- No improved code: no defensible replacement was returned.
- No notifications: show only if notification subsystem exists; otherwise omit.
- No saved preferences: use actual defaults without implying remote persistence.

## 4. Form validation

Show field-specific feedback, preserve valid input and move focus appropriately. Server is authoritative. Never echo source or credentials in messages. Distinguish malformed input, unsupported language, empty source, oversized source, duplicate account, rate limit and expired session.

## 5. Network/offline

When offline/API unreachable, state request did not complete. Preserve editor content only according to documented draft policy. Do not claim code was submitted or remotely saved. Retry must be explicit and safe against duplicate review creation. Do not automatically retry expensive requests without idempotency.

## 6. AI provider errors

Handle provider unconfigured, invalid key, unauthorized, rate limited, unavailable, timeout, malformed response, output too large and unsupported model. Map to safe user messages and diagnostic codes. Never expose keys/raw provider responses or return a canned successful report.

## 7. Database errors

Handle DB unavailable, query timeout, write failure, duplicate key and persistence conflict. Do not show completed until durable write succeeds. If analysis succeeds but persistence fails, explain result could not be safely saved; retry persistence only from a securely retained actual result.

## 8. Authorization errors

Distinguish unauthenticated, expired, forbidden and not-found according to security policy. Avoid exposing whether another user's report exists. Client hiding is not authorization.

## 9. Retry policy

Retry only transient safe operations with bounded attempts/backoff/jitter. Do not retry malformed input, invalid credentials or non-idempotent submissions without idempotency. Offer cancellation only if backend supports it.

## 10. Offline support boundary

First release does not promise offline AI review or offline database persistence. Editor may retain in-memory draft during current page lifecycle. Stronger local draft storage requires explicit design/privacy review. Never claim offline review.

## 11. Error wording

State affected action, whether code remains available, whether operation may have completed and next safe step. Never show stack traces, secrets, internal IDs or raw provider payload. Use correlation IDs for support diagnostics.
