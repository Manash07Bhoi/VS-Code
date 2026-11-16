# Release Notes — CodeSense AI Workbench Release

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

See `docs/implementation/KNOWN_LIMITATIONS.md` — direct and specific (no terminal/execution/debugging by design, no real Git, browser-local workspace, advisory-only AI findings, backend not deployed).
