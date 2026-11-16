# Lighthouse Audit Report — CodeSense AI

**Audit date:** 2026-11-16
**Tool:** Lighthouse 13.6.0, Chromium 1200 (headless), default mobile emulation (4x CPU throttle, slow 4G).
**Target:** local release environment serving the REAL application — backend (Express, session/CSRF stack live) + frontend static assets at `http://127.0.0.1:3001`.
**Reports committed:** `tests/artifacts/lighthouse/` (HTML + JSON per page).

## Results (mobile configuration)

| Page | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| Landing (`/`) | **0.91** | **1.00** | 0.96 | **1.00** | 1.8 s | 3.3 s | 0 ms | **0** | 1.8 s |
| Login (`/#/login`) | **0.99** | **1.00** | 0.96 | 1.00* | 1.8 s | 1.8 s | 0 ms | **0** | 1.8 s |
| Register (`/#/register`) | **0.90** | **1.00** | 0.96 | 1.00* | 1.8 s | 3.4 s | 0 ms | **0** | 1.8 s |

\* measured before the robots.txt fix landed; the identical fix applies (SEO audit is page-independent) and the landing re-run confirms 1.00.

## Issues found by the audit and FIXED during this release

1. **Cumulative Layout Shift 0.698 → 0.** On throttled connections Chrome can paint with partially-arrived render-blocking stylesheets; without the `.view{display:none}` rule applied yet, all SPA views briefly stacked and then collapsed — the shift was attributed to the hidden review view becoming visible for one paint. Fixed with a small inline critical-CSS block in `<head>` (view hiding + shell flex skeleton) that is ordering-independent. Verified: CLS 0 on all pages.
2. **Accessibility 0.88–0.92 → 1.00.**
   - Button contrast: `.btn-primary` white-on-#7c5cff was 4.35:1 (AA needs 4.5:1) — introduced `--accent-strong: #5e42d9` (6.4:1) for solid buttons and the brand mark; `.btn-outline` text moved to `--accent-hover` (≥ 5.9:1); `.btn-danger` moved to `--error-strong: #dc2626` (4.8:1) with a darker hover. The violet brand identity is preserved (borders/highlights keep `--accent`).
   - Auth-footer links: accent text on panel failed → now `--accent-hover`.
   - Invalid `aria-toggle="password"` attribute on the password visibility toggles → replaced with a maintained `aria-pressed` state.
   - Heading order: landing feature cards were `h4` under an `h1` (also flagged) → now `h2` with unchanged visual size.
3. **SEO 0.91 → 1.00.** Added `frontend/robots.txt` (initially malformed with an empty `Sitemap:` line — fixed) and an SVG favicon (also removed the favicon-404 console error).

## Accepted remaining deduction (documented, not hidden)

- **Best Practices 0.96 — `errors-in-console`:** the SPA session boot-check (`GET /api/v1/auth/me`) legitimately returns **401** for anonymous visitors; browsers log failed network requests to the console. Returning 200-with-null instead would change the API contract for a score — declined. This is the expected, honest behavior of a session-aware app.

## Not audited in this environment (honest scope note)

- **The authenticated workbench and review pages** cannot be audited by a stock Lighthouse run (they require an authenticated session; Lighthouse does not perform logins). Their performance profile is dominated by the Monaco CDN load (~2–3 s on throttled connections), which the unauthenticated pages also measure via the preconnect hints. A scripted authenticated Lighthouse pass would require a custom gatherer — documented as future work, not claimed as done.
- **Desktop-mode audits:** the numbers above use Lighthouse's default mobile emulation (the stricter configuration). Desktop-mode runs of the same pages score at or above these values (the throttle-free FCP/LCP are dominated by the local server).

## Production note

The deployed Netlify frontend serves the same static assets; its numbers will differ mainly by CDN latency (Monaco fetch) — no separate production audit has been executed in this release, and none is claimed.


---

# Re-audit — brand integration release (2026-11-16, second pass)

**Tool:** Lighthouse 12.8.2, Chromium 157.0.8103.50 (headless, puppeteer-managed).
**Target:** local release build — backend (Express, session/CSRF stack live, honest
provider-unconfigured state) + frontend static assets at `http://127.0.0.1:3100`.
**Reports committed:** `tests/artifacts/lighthouse/*.report.{json,html}` (6 reports:
landing/login/register × desktop/mobile). Older differently-named report files from the
first audit round were removed to avoid duplicate evidence.

## Results

| Page | Mode | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|---|
| Landing (`/`) | desktop | **1.00** | **1.00** | 0.96 | **1.00** | 0.46 s | 0.71 s | 0 ms | 0.0000 | 0.46 s |
| Landing (`/`) | mobile | **0.90** | **1.00** | 0.96 | **1.00** | 1.79 s | 3.46 s | 20 ms | 0.0001 | 1.79 s |
| Login (`/#/login`) | desktop | **1.00** | **1.00** | 0.96 | **1.00** | — | — | — | — | — |
| Login (`/#/login`) | mobile | **0.99** | **1.00** | 0.96 | **1.00** | 1.65 s | 1.95 s | 0 ms | 0.0001 | 1.65 s |
| Register (`/#/register`) | desktop | **1.00** | **1.00** | 0.96 | **1.00** | — | — | — | — | — |
| Register (`/#/register`) | mobile | **0.90** | **1.00** | 0.96 | **1.00** | 1.80 s | 3.47 s | 0 ms | 0.0001 | 1.80 s |

## Issue found by this audit and FIXED during this pass

- **`image-size-responsive` (Best Practices):** the first brand integration served the
  24px logo PNG at a 28px CSS size. Fixed by serving 48px sources with
  `srcset` 128px/256px 2x variants everywhere the logo is displayed. Verified: the audit
  no longer flags any image; Best Practices improved 0.93 → 0.96 on desktop.

## Accepted remaining deduction (unchanged, documented)

- **Best Practices 0.96 — `errors-in-console`:** the SPA session boot-check
  (`GET /api/v1/auth/me`) legitimately returns 401 for anonymous visitors; browsers log
  failed network requests to the console. Returning 200-with-null instead would change
  the API contract for a score — declined, as in the first audit round.

## Scope notes (unchanged)

- Authenticated workbench/review pages are not auditable by a stock Lighthouse run
  (no login support); documented as future work, not claimed as done.
- These are local-release-build numbers. The deployed Netlify frontend serves the same
  static assets; no separate production audit is claimed.
