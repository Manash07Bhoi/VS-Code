# Release Notes — CodeSense AI Workbench Release

## v1.1.0 — live AI, hardened delivery (2026-11-17)

First release where the deployed product actually does what the UI promises end-to-end.

### AI is live and verified against the running service

- `GEMINI_MODEL=gemini-3.1-flash-lite`, validated by real API calls (the old examples named
  models that now 404 for new keys).
- **Provider payload defect fixed** (#11): the adapter sent a bare `Content[]` array with
  `generationConfig` in the request-options slot, so *every* live request failed with
  `400 Unknown name "role"`. Two regression tests now fail against the old shape.
- Deployed evidence, exercised through the public Netlify origin (proxy + CORS + cookies +
  CSRF + auth all included): register `201`, review `201` in 3.4 s with persisted findings,
  explain `200` (5 key points), improve `200` (3 changes), all on `gemini-3.1-flash-lite`.
  Details: `docs/ai/GEMINI_LIVE_VERIFICATION.md`.

### CI is green, and the two failures were real defects

- **`browser-qa` 360 px overflow** (#12): not flakiness. `#nav-email` and `.wb-account-slot`
  had no width rule, so overflow scaled with the signed-in email length — 5 px on CI,
  **63 px** at 390 px wide. Fixed with truncation + `min-width:0`; overflow is now 0 px at
  320/360/390/430. Measured before the change, re-measured after.
- **Dependency majors** (#8, #13): express `4.22.3 → 5.3.0` and express-rate-limit
  `7.5.1 → 8.7.4`. The rate-limit bump was *green in CI but unsafe*: v8 flagged three
  `keyGenerator`s for returning a bare `req.ip` (`ERR_ERL_KEY_GEN_IPV6`), which lets an IPv6
  client rotate addresses and bypass the limit. Fixed with `ipKeyGenerator` + 6 regression
  tests (2 fail against the old generators). Dependabot #9 was closed in favour of #13.

### Documentation corrections

- Three stale "backend not deployed" claims corrected (#11).
- `.env.example` no longer points at a retired model, and the Render guide's activation steps
  name a model that was actually observed returning 200.
- The Atlas network-access trade-off, the free-tier limits and the new IPv6 bucket semantics
  are recorded in `docs/implementation/KNOWN_LIMITATIONS.md`.

### Preserved

- `v1.0.0` release and every merged PR commit are untouched; no force-push, no branch
  protection bypass, no rewritten history.
- Verification-run accounts/reviews were deleted from Atlas; the real user account was kept.

---

# v1.0.0 — CodeSense AI Workbench Release

**Date:** 2026-11-16
**Codename:** *Workbench*
**Scope:** the existing CodeSense AI application, continued and improved (no rewrite).

## Headline

CodeSense AI is now **a VS Code-inspired AI-powered browser-based developer workbench**: a multi-file Monaco editor with tabs, explorer, search & replace, honest local change tracking, a command palette, a live status bar, Problems/Output/Terminal panels, dark/light themes, and an integrated AI review studio — on top of the existing authenticated review platform. Every dependency vulnerability was remediated (0 remaining), and the repository has its first fully green CI in history, with committed browser-QA and Lighthouse evidence.

## New features

- **Workbench** — activity bar, sidebar panels, multi-file tabs with dirty state and unsaved-change protection, command palette (Ctrl+Shift+P) and quick open (Ctrl+P), status bar reflecting real editor state, resizable bottom panel, responsive 360→1920px, dark/light themes.
- **AI review studio** — review the current file, the selection (line-offset-corrected navigation), or with a security focus; explain code; generate fix proposals reviewed in a side-by-side diff with explicit Accept/Reject; stale-finding protection via source digests; honest provider-unavailable states everywhere.
- **New backend capability** — `POST /api/v1/assist` (ephemeral explain/improve, validated + sanitized, auth/CSRF/rate-limited) and an optional `focus: "security"` mode on reviews.
- **Browser QA infrastructure** — Playwright suite across the five required viewports with committed screenshots + HTML report; rewritten puppeteer e2e (29 checks); a real-pattern secret scanner; CI browser-qa job.

## Security

- zod 3 → 4 (CVE-2023-5444; error contract preserved byte-for-byte), bcrypt 5 → 6 (eliminates the critical `tar` path-traversal chain), puppeteer 22 → 25 via reviewed Dependabot merge (removes the 10-package vulnerable chain), playwright ≥ 1.55.1 (SSL verification advisory). **Final audit: 0 vulnerabilities.**
- Fixed real defects: logout now clears the actual session cookie (`cs.sid`, not a nonexistent `connect.sid`); session persistence uses a canonical single-save flow; static assets exempted from the API rate limiter (fixes shared-proxy boot breakage); secret scan detects real credential formats.

## Fixes

- **CI had never been green** (0/20+ historical runs). Root cause proven: concurrent `node --test` files shared one MongoDB database and dropped it during setup, intermittently wiping each other's state (reproduced deterministically). Each file now derives a unique database.
- Workflow defects fixed: nonexistent e2e path in syntax checks, over-broad secret scan, missing runner MongoDB, unsupported puppeteer headless flag, Playwright/ubuntu-26.04 incompatibility.
- Workbench correctness: welcome-overlay CSS conflict that swallowed editor clicks; Monaco swallowing global shortcuts (capture-phase keybindings); status-bar overflow at 360px; mispositioned panel resizer.
- Lighthouse-audited fixes: CLS 0.698 → 0 (inline critical CSS), accessibility 0.88 → 1.00 (AA button contrast tokens, valid ARIA, heading order), SEO → 1.00 (robots.txt, favicon).

## Incompatible changes

- The `/editor` route now opens the workbench (legacy alias); the single-file editor page was replaced (all prior capabilities exist in the workbench superset).
- `package-lock.json` regenerated throughout; Node ≥ 20 still required.

## Known limitations

See `docs/implementation/KNOWN_LIMITATIONS.md` — direct and specific (no terminal/execution/debugging by design, no real Git, browser-local workspace, advisory-only AI findings).

> **Superseded (2026-11-17):** the "backend not deployed" limitation recorded for **v1.0.0** was
> true at the time of that release. The backend is now deployed and verified on Render's free
> tier — see `docs/deployment/RENDER_FREE_DEPLOYMENT.md`. This note is kept so the v1.0.0 record
> stays historically accurate rather than being rewritten.
