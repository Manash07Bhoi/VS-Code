# Security Architecture — CodeSense AI

**Updated:** 2026-11-16
**Baseline docs preserved:** `docs/implementation/SECURITY.md`, `docs/gap-closure/CodeSense_AI_Gap_Closure/THREAT-MODEL.md`, `AUTH-SESSION-SECURITY.md`, `PRIVACY-DATA-PROTECTION.md` remain valid; this document records the architecture **as of the workbench release** and the changes made during it.

## Authentication & sessions

- Session-cookie auth (`cs.sid`, httpOnly, SameSite=Lax, Secure in production, 7-day cap) backed by a MongoDB session store.
- Session IDs regenerate on register and login (fixation resistance); the canonical flow writes **all** session fields (including the CSRF token) before a single save and only responds after the store write confirms — no reliance on implicit end-of-response auto-saves (fixed in this release; see REGRESSION_REPORT.md).
- Logout destroys the server session and clears the actual `cs.sid` cookie (previously cleared a nonexistent `connect.sid` cookie — a real defect fixed in this release).
- Generic credential errors everywhere (no account enumeration); duplicate registration returns the same shape as success.

## CSRF

- Token bound to the session (`/api/v1/auth/csrf-token`), required on all mutating endpoints; the API client refreshes the token once and retries on stale-token rejection.

## Rate limiting

- Auth limiter, review/assist limiter, general API limiter (all server-side, per-IP windows).
- **Static assets are served before the general limiter** (this release): a page load fetches ~35 ES modules; rate-limiting cacheable public assets broke app boot behind shared proxies and in browser test suites. All `/api/*` routes remain fully limited.

## Input validation & output handling

- zod v4 schemas at every trust boundary; field-level errors that never echo submitted source.
- Body caps (256 KiB JSON; 64 KiB review/assist source; 128 KiB improved-code output bound).
- Frontend renders user/AI text via `textContent`/`escapeHtml` — no `innerHTML` of untrusted strings.
- CSP (Helmet): script/style sources restricted to self + Monaco CDN allow-lists, `worker-src blob:` for the Monaco worker proxy, `object-src 'none'`, HSTS, `X-Frame-Options: deny`, `nosniff` on static assets (netlify.toml).

## AI provider security

- Gemini API key exists only in backend env; never sent to the browser.
- Submitted source is framed as untrusted data with explicit prompt-injection resistance instructions.
- Provider responses are strict-JSON parsed, allow-list validated, sanitized (script-like content stripped, sizes bounded) before persistence or return.

## Code execution policy

**No user-submitted code executes. Ever.** There is no terminal, no run/debug runtime, and no shell bridge. The Run/Debug and Terminal panels present truthful unavailable states and document the isolation architecture required before any such feature could exist (per-session container sandbox, CPU/memory/timeout/output caps, deny-by-default networking, ephemeral filesystems, authenticated audited gateway, guaranteed teardown). See `KNOWN_LIMITATIONS.md`.

## Secrets

- `.env` git-ignored; `.env.example` documents variables without values.
- CI secret scan (`scripts/secret-scan.sh`) fails on real credential value patterns (Google/GitHub/Netlify/OpenAI/AWS formats, private key headers) and hardcoded ≥16-char credential assignments in production source; verified zero false positives on the tree and a true positive on an injected fake key.
- No secrets are committed; tokens used for release automation live only in this session's workflow, never in the repository.

## Dependency security

See `../security/DEPENDENCY_AUDIT.md` and `VULNERABILITY_REGISTER.md`: 15 reproduced findings (1 critical, 14 high) at baseline → **0 findings** at release, all via reviewed, tested upgrades (zod v4 migration preserving the error contract, bcrypt v6 dropping the node-pre-gyp/tar critical chain, puppeteer 25 eliminating the transitive chain, playwright ≥ 1.55.1).

## Session/test isolation fix (this release)

`node --test` runs test files concurrently; they previously shared one database and dropped it during setup, wiping sibling files' state mid-flight (the root cause of CI-only intermittent auth 401s that had never been diagnosed). Each file now derives a unique database name. Root cause proven by a targeted reproduction before the fix (see REGRESSION_REPORT.md).
