# Dependency Audit — CodeSense AI

**Audit date:** 2026-11-16
**Scope:** `backend/package.json` (the only package manifest with a lockfile; the frontend is dependency-free vanilla JS loaded from CDNs with CSP allow-lists).

## Method

Audits were reproduced with `npm audit` / `npm audit --json` against the committed `package-lock.json`, and every remediation was validated with the full test suite (`npm test`, 19 files) plus `npm run lint` before commit. No blind `npm audit fix --force` was used at any point.

## Timeline of findings

| Stage | Total | Critical | High | Notes |
|---|---|---|---|---|
| Historical report (baseline `22ea434`) | 16 | 1 | 15 | As reported in the task brief |
| Reproduced at baseline `22ea434` | 15 | 1 | 14 | Recount at task start (advisory DB drift since the historical report) |
| After direct remediations (`23c1028`) | 12 | 0 | 12 | zod 3.24.2 → 4.6.7 and bcrypt 5.1.1 → 6.0.0; the critical `tar` chain and `@mapbox/node-pre-gyp` eliminated; installing `@playwright/test@1.57.0` also lifted `playwright` to 1.57 (≥ 1.55.1), clearing the Playwright SSL advisory |
| After Dependabot PR #4 (puppeteer 22.6.0 → 25.17.0) | 0 | 0 | 0 | Final state — see below |

The remaining 12 findings at the intermediate stage were all inside the puppeteer dependency chain (`puppeteer`, `puppeteer-core`, `@puppeteer/browsers`, `basic-ftp`, `get-uri`, `pac-proxy-agent`, `proxy-agent`, `extract-zip`, `tar-fs`, `ws`, `chromium-bidi` and its nested `zod`) — every one of them is resolved by the reviewed puppeteer 25.17.0 upgrade (PR #4), which drops the vulnerable transitive graph entirely.

## Final state

`npm audit` reports **0 vulnerabilities (0 critical, 0 high, 0 moderate, 0 low)** after all remediations and reviewed Dependabot merges land on `main`. This claim is reproducible: clone the repository, `cd backend && npm ci && npm audit`.

## What was deliberately NOT done

- No `npm audit fix --force` — the breaking upgrades were reviewed and tested individually.
- No `overrides` were introduced — every fix is a real, compatible version bump.
- No dependency was removed merely to make the audit green; `puppeteer` remains a devDependency because `tests/e2e.js` uses it.
