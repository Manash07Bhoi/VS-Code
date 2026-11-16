# Observability, Diagnostics and Incident Response — CodeSense AI

## 1. Objectives

Operations must be able to distinguish application failure, database outage, provider outage, invalid model output, authentication abuse and user input errors without logging sensitive source code or credentials.

## 2. Structured logs

Use structured logs with:
- timestamp;
- severity;
- service/environment;
- request/correlation ID;
- route/method;
- response status;
- duration;
- safe error code;
- review ID where safe;
- provider/model identifier where safe.

Never log passwords, session cookies, bearer tokens, API keys, full submitted source, raw provider response containing source, or private report content. Redact query/body values by default.

## 3. Metrics

Track only real measurements:
- request count and error rate by route;
- API latency distributions;
- database operation failures/latency;
- provider latency, timeout and error rate;
- review completion/failure counts;
- active review concurrency;
- rate-limit rejections;
- output schema validation failures;
- process memory/CPU where available.

Do not show fabricated product analytics in the UI. Operational metrics belong in secured operator tooling, not a fake user dashboard.

## 4. Health endpoints

Liveness answers whether the process is alive. Readiness answers whether required dependencies are available for serving traffic. Do not expose secrets, connection strings or detailed infrastructure topology in public health responses. If provider health is not cheaply and safely probeable, report configuration/readiness status rather than making a paid test request on every probe.

## 5. Alerts

Define thresholds only after observing baseline traffic and service limits. Alert on sustained elevated API errors, database unavailable, provider timeout/error spike, unusual spend, authentication abuse, failed deployment and backup/restore failure. Document alert owner and response steps.

## 6. Incident procedure

1. Detect and classify impact.
2. Preserve safe logs and correlation IDs.
3. Stop ongoing abuse or disable expensive functionality if necessary.
4. Protect user data and rotate compromised secrets.
5. Restore service or roll back.
6. Validate core user journeys.
7. Communicate user impact honestly.
8. Record root cause, contributing factors and corrective actions.

## 7. Incident classes

- P0: confirmed credential/provider secret exposure or cross-user data exposure.
- P1: complete service outage or widespread inability to authenticate/review.
- P2: partial feature outage, elevated provider failures or degraded history.
- P3: minor UI defect with workaround.

Severity definitions must be reconciled with the actual operational team; do not claim an on-call team exists if it does not.
