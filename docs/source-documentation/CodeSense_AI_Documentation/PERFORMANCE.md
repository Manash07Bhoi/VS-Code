# Performance and Reliability Requirements

## 1. Philosophy

Optimize the real workflow: open workspace, initialize Monaco, edit source, submit bounded review, receive result and search history. Do not publish performance claims without measurement.

## 2. Frontend performance

- Load app shell efficiently and defer nonessential modules.
- Load Monaco only where needed.
- Configure editor workers correctly and verify production build.
- Dispose editor instances, observers and listeners on teardown.
- Avoid duplicate global initialization and oversized dependencies.
- Keep CSS modular; avoid expensive continuous effects.
- Use skeletons only for genuinely loading regions and prevent layout shift.
- Paginate history; never render unbounded records.
- Avoid placing large source in route state or local storage without an explicit requirement.

## 3. Backend performance

- Bound source and response size.
- Use DB connection pooling and owner-scoped indexes.
- Set API/provider timeouts.
- Limit concurrent provider requests.
- Avoid blocking CPU-heavy work in event loop.
- Add async workers only when workload justifies durable queue.
- Apply backpressure and rate limits to expensive operations.
- Avoid logging large request/response bodies.

## 4. AI latency and cost

Latency varies by provider/model/prompt/source/load. Measure real distributions. Use source caps, token budgets, bounded outputs, concise prompts and concurrency limits. Retry only retryable failures and prevent duplicate requests where idempotency is possible. Do not claim faster models or response targets without measurement.

## 5. Database performance

Index observed query patterns: owner plus created time, owner plus status/date where used and unique normalized email. Use projections, bounded page sizes and stable sort. Inspect query plans. Avoid unbounded regex search. Assess privacy before full-text indexing submitted source.

## 6. Caching

Cache only with clear invalidation/privacy rules. Public static assets may use immutable caching with content hashes. Private reports must not enter shared caches. Do not present stale reports as current after mutations.

## 7. Resilience

Handle provider timeout, DB outage, network interruption, refresh and backend restart. Retry transient safe failures with bounded backoff/jitter. Do not retry validation, authentication or non-idempotent requests blindly. Provide cancellation only if backend cancellation exists.

## 8. Measurement plan

Measure public/authenticated shell load, Monaco init, typing responsiveness at representative source sizes, review API acceptance/completion, provider latency/failure, history query latency, concurrent resource use and production bundle size. Report percentiles only with sample size, environment and method. Targets are objectives until measured.

## 9. Regression gates

Use repeatable checks for editor startup, history pagination and API limits. Investigate regressions rather than disabling checks. Instrumentation must not collect source or secrets.
