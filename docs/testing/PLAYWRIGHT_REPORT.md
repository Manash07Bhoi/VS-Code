# Playwright Browser QA Report — CodeSense AI

**Run date:** 2026-11-16
**Environment:** local release sandbox — backend on Node 24 with MongoDB 8.0.4, frontend served by the backend (real app, no mocks); Chromium 1200 via Playwright 1.57.0.
**Suite:** `tests/responsive.spec.js` (7 tests), config `playwright.config.js`.

## Results

**7 passed, 0 failed, 0 skipped** (44.3 s)

| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | workbench at mobile-360 (360×800) | ✓ 8.0s | `tests/artifacts/screenshots/workbench-mobile-360.png` + `-panels.png` |
| 2 | workbench at mobile-390 (390×844) | ✓ 7.8s | `workbench-mobile-390.png` + `-panels.png` |
| 3 | workbench at tablet-768 (768×1024) | ✓ 8.0s | `workbench-tablet-768.png` + `-panels.png` |
| 4 | workbench at laptop-1366 (1366×768) | ✓ 8.0s | `workbench-laptop-1366.png` + `-panels.png` |
| 5 | workbench at desktop-1920 (1920×1080) | ✓ 8.3s | `workbench-desktop-1920.png` + `-panels.png` |
| 6 | authentication boundaries hold | ✓ 1.2s | — (protected route redirects to login) |
| 7 | invalid credentials show a generic error | ✓ 2.1s | — (generic toast, no enumeration, stays on login) |

Full HTML report: `tests/artifacts/html-report/index.html` (committed as evidence).

## What each viewport test verifies

Register (real form) → open workbench → activity bar / status bar / tab strip render → **no horizontal overflow at ≤ 768px** → status bar shows real state (Spaces: 4, UTF-8, Ln/Col) → first-run scratch file model ready → ≥ 7 functional activity views → command palette opens, searches ("save all"), executes, closes → bottom panel opens (Ctrl+Shift+M) → Terminal pane shows the honest unavailable state → theme toggles and restores → activity-bar view switching (Search panel) → screenshots (workbench + panels) → sign out.

## Defects found and fixed by this suite during development

1. **Static assets were rate-limited**: ~35 ES-module requests per page load against a 100/min general limiter broke app boot (also a real production risk behind shared proxies). Static assets now serve before the limiter; APIs remain limited.
2. **Mobile sidebar overlay covered the bottom panel tabs and status bar** — the sidebar is now a bounded slide-over drawer (≤ 900px).
3. **Status bar overflowed at 360px** — items condense responsively (verified no horizontal overflow).
4. **Browser tests could race app bootstrap** — `main.js` now exposes `__CODESENSE_READY`; tests wait for it.
5. **Login failure assertion mismatch** — the app surfaces a generic toast (no account enumeration); the test now asserts the real behavior.

## Environment blocker (honest disclosure)

The release sandbox's network policy blocks the Monaco TypeScript worker CDN fetch from inside blob workers (main-thread CDN access works). The puppeteer e2e suite therefore **skips** (with an explicit SKIP log line, never a pass) its editor-diagnostics check in this environment. CI runners have unrestricted network and execute the real diagnostics path.

## Reproduction

```bash
# backend with MongoDB running
cd backend && PORT=3000 MONGODB_URI=mongodb://127.0.0.1:27017/qa \
  SESSION_SECRET=… CSRF_SECRET=… GEMINI_API_KEY='' node server.js &
E2E_BASE_URL=http://127.0.0.1:3000 \
  node backend/node_modules/@playwright/test/cli.js test --config playwright.config.js
```
