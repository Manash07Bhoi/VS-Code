# Dependency & pull-request review (open Dependabot PRs)

Reviewed: 2026-11-17. Production dependencies (`npm audit --omit=dev`): **0 vulnerabilities**
(low/moderate/high/critical = 0).

## Inventory

| PR | Package | Change | State | Outcome |
| --- | --- | --- | --- | --- |
| #10 | *(own work)* deployment config/docs | — | open | merged |
| #13 | `express-rate-limit` + fix | `7.5.1 → 8.7.4` (major) | merged (`930e775`) | **merged** — with the IPv6-safe key generators #9 needed |
| #9 | `express-rate-limit` | `7.5.1 → 8.7.4` (major) | closed | superseded by #13 |
| #8 | `express` | `4.22.3 → 5.3.0` (major) | merged (`2fb63a1`) | **merged** — verified compatible |
| #7 | `@google/generative-ai` | `0.21.0 → 0.24.1` | merged | already in `main` |
| #4 | `puppeteer` (dev) | `22.6.0 → 25.17.0` | merged | already in `main` |
| #3 | `mongoose` | `8.24.9 → 9.12.1` | merged | already in `main` |
| #2 | `eslint` (dev) | `9.39.5 → 10.14.0` | merged | already in `main` |
| #1, #5, #6 | duplicate/obsolete security-update groups | — | closed, not merged | superseded by #3/#4/#7 |

No PR is a security advisory response for a currently-unfixed vulnerability: `npm audit`
reports none at any severity, so no merge below is forced by a CVE.

## Resolution (2026-11-17) — both major bumps landed

Both bumps are now merged, and neither was merged on the strength of a green tick.

### express 5.3.0 — merged (#8, `2fb63a1`)

Evidence on the exact commit: backend suite `19/19 pass`, and `browser-qa: success`, which
drives a real browser through register/login/review (so express-session, cookie handling and
CSRF all work under v5). Source audit found no `app.del()`, `res.sendfile()`, `req.param()`,
`res.redirect('back')` or string-wildcard routes; the SPA fallback is a regex route
(`app.get(/^\/((?!api).)*$/)`), which v5 still supports. Express 5 additionally forwards
rejected promises from async handlers to the error middleware. Re-verified live after deploy:
`/health/ready` 200, review 201, explain/improve 200.

### express-rate-limit 8.7.4 — merged as #13 (`930e775`), #9 closed

The deferral reason was real and turned into a code fix rather than a merged regression:

| config | `ERR_ERL_KEY_GEN_IPV6` occurrences (real express app) |
| --- | --- |
| old key generators (bare `req.ip`) | **4** |
| fixed (`ipKeyGenerator`) | **0** |

All address-derived keys now pass through the bundled `ipKeyGenerator` helper, which
collapses IPv6 to its subnet and leaves IPv4 untouched. Six regression tests were added in
`backend/tests/rateLimit.test.js`; the two bypass tests fail against the previous generators.
The suite was also wired into the `test` script — `package.json` lists test files explicitly,
so the new file had been silently skipped (CI reported 21 tests instead of 27).

Post-deploy check on the live service: 13 wrong-password logins returned `401 ×10` then
`429 ×3`, with `RateLimit-Policy: 10;w=60` — the limiter still enforces with the new keys.

---

## Original deferred analysis (retained for the record)

## PR #9 — express-rate-limit 8.7.4 (deferred, with evidence)

Tested on a copy of `backend/` with the bumped lockfile, against a real MongoDB:

- Unit/integration suite: **19/19 pass** — so the bump is not silently broken.
- Production-shaped boot (`NODE_ENV=production TRUST_PROXY=true`): the service **starts
  and serves traffic**, but v8 emits one validation error per limiter:

```
ValidationError: Custom keyGenerator appears to use request IP without calling the
ipKeyGenerator helper function for IPv6 addresses. This could allow IPv6 users to
bypass limits.  (code: ERR_ERL_KEY_GEN_IPV6)
```

**Why it is deferred rather than merged as-is:** `backend/src/middleware/rateLimit.js`
keys three limiters on the raw `req.ip`. In v8 the supported way is
`ipKeyGenerator(req.ip)`, which normalises IPv6 to its /64 network so an attacker cannot
rotate addresses inside their own /64 to get fresh buckets. Merging the bump without that
change would (a) log validation errors on every boot, and (b) keep the IPv6 weakness while
appearing fixed. The correct change is:

```js
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
keyGenerator: (req) => ipKeyGenerator(req.ip)                       // per-IP limiter
keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.body?.email ?? 'unknown'}`  // per-(IP,email)
```

That is a security-behaviour change to authentication throttling, so it gets its own
change with a live 429 re-verification (the current limit of 60 requests/min/IP is
verified working — see `RENDER_FREE_DEPLOYMENT.md` §6).

**Known limitation carried forward:** with `express-rate-limit@7.5.1` the three IP-keyed
limiters do not normalise IPv6 /64 prefixes (`ipKeyGenerator` is not even exported by
v7.5.1 — verified). IPv4 keying is exact and verified; IPv6 clients could in principle
rotate within their /64 to obtain additional quota. Fixing this requires the v8 upgrade
above.

## PR #8 — Express 5.3.0 (deferred, verified compatible)

Tested the same way (bumped lockfile, real MongoDB, real frontend present):

| Check | Result |
| --- | --- |
| Backend suite | **19/19 pass** |
| Boot in production shape | OK, DB connected |
| `GET /api/v1/health/ready` | 200 JSON |
| SPA fallback `GET /dashboard` (regex route) | **200 text/html** — regex routes still work |
| `GET /js/main.js` (static) | 200 |
| `POST /auth/register` + `GET /auth/me` + session cookie | 201 / 200, cookie set |

So this is **not** an incompatibility. It is deferred because it is a major runtime
migration (path-to-regexp v8, `req.query` parser default change, error-handling semantics,
`res.clearCookie` option handling) landing immediately before a release, with no security
patch forcing it. Recommendation: merge in a dedicated change and re-run the full
deployed-environment verification (`deploy/e2e.js` + `deploy/browser_test.js`) against it,
because those suites exercise exactly the behaviours Express 5 alters.

## Method

For each candidate: apply only that PR's `package.json` + `package-lock.json`, install with
`--ignore-scripts` (browser downloads are irrelevant to the server), run `npm test` against
a real `mongod`, then boot in production shape and probe the routes the change could
affect. Lockfiles were taken verbatim from the PR branches, so the tested tree is the tree
that would be merged.
