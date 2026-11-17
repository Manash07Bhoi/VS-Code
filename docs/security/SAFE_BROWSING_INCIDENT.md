# Incident: Google Safe Browsing "Dangerous site" on the Netlify URL

**Status: OPEN — confirmed classification, root cause not conclusively established,
Google review not yet requested.** Opened 2026-11-17. Do not describe the site as
cleared until Google's own status changes and the browser warning disappears.

## 1. Confirmed status (Google's own data, not an inference)

Rendered from `https://transparencyreport.google.com/safe-browsing/search?url=codesenseai-review.netlify.app`
in a real Chromium session (`security_audit/transparency_report.png` in the workspace):

> **Current status: Some pages on this site are unsafe.** The site
> `codesenseai-review.netlify.app` contains harmful content, including pages that:
> *Try to trick visitors into sharing personal info or downloading software.*
> This info was last updated on Nov 17, 2026.

- Category class: **social engineering / deceptive content** (the report's wording maps to
  Google's `SOCIAL_ENGINEERING` threat type, not malware or unwanted software).
- Record timestamp: **2026-11-17T05:42:32Z**, i.e. about five minutes after the frontend
  deploy carrying the `/api` proxy went live at 05:37Z.
- The classification is **hostname-level**: `/`, `/login`, `/register`, a CSS file and a
  non-existent path all return the identical record and timestamp. Google does not publish
  per-URL samples here.

## 2. What was ruled out with evidence

| Suspected cause | Evidence | Verdict |
| --- | --- | --- |
| Compromised / modified deployment | 14 of 15 assets referenced by the live `index.html` are **byte-identical (SHA-256)** to the source commit; the 15th is Netlify's own injected `/.netlify/scripts/hud` badge script | ruled out |
| Injected scripts, iframes, hidden links | pattern scan of the deployed HTML/JS/CSS for `eval`, `new Function`, `document.write`, `atob`, `sendBeacon`, hidden iframes, spam keywords, off-site form actions | ruled out |
| Cloaking (different content per user agent) | `Googlebot`, Chrome and no-UA fetches of `/` are byte-identical | ruled out |
| Credential exfiltration | the only credential inputs are `#reg-password` / `#login-password`; they have **no `name` attributes**, the forms have no `action`, and the client posts to same-origin `/api/v1/auth/*`. A no-JS submit would transmit nothing | ruled out |
| Suspicious third-party code | landing page makes **zero** requests outside its own origin; the workbench loads only `cdnjs.cloudflare.com` `monaco-editor@0.52.0` (HTTP 200, version-pinned) | ruled out |
| Unauthorized deploy / repository change | all 12 Netlify deploys trace to our own commits; every `main` commit is authored by the project or Dependabot; 0 webhooks, 0 deploy keys, 1 collaborator | ruled out |
| Recycled subdomain with a pre-existing bad history | Netlify site `codesenseai-review` was created 2026-11-16T04:43Z, i.e. by this project | ruled out |

## 3. What remains: the plausible contributing signals

Not proven to be the trigger, but all are true of the deployed site as crawled:

1. **Catch-all 200s serving a credential form.** `_redirects` mapped `/*` to `index.html`
   with status 200, so `/any/invented/path` returned the sign-in page. Unlimited URLs, each
   serving a login/registration form, on a hostname registered hours earlier, is exactly the
   response pattern of a phishing kit. The router is **hash-based**, so nothing needed this
   fallback. This PR removes it (real 404 instead).
2. **Brand-adjacent naming.** The product is "CodeSense AI" and is described as
   "VS Code-inspired" (a Microsoft trademark) on the page that asks for credentials. Classifiers
   weigh brand similarity heavily for sign-in pages.
3. **No reputation / no Search Console property.** The host went from "no data" to flagged
   within a day; there is no verified property, no privacy or terms pages, and no other
   signals an anti-phishing classifier uses for legitimacy.

## 4. Remediation in this PR (not deployed)

- `frontend/_redirects`, `frontend/netlify.toml`: unknown paths now return a real **404**
  instead of the app shell.
- `frontend/404.html`: new minimal page, no forms, `noindex`.
- Security headers extended to the HTML entry points (`nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`); previously only `/js`, `/css`, `/assets` had them.
- No authentication, CSRF, session or rate-limit behaviour was weakened or changed.

Note: the Render backend keeps its own SPA fallback (`app.get(/^\/((?!api).)*$/)`) because it
also serves the app directly. That hostname is **not** classified by Safe Browsing (its record
reads "no data"), so it was deliberately left alone — changing it would risk the backend's
static-serving behaviour for no established benefit. It is a follow-up only if Google's samples
turn out to reference the Render URL.

## 5. Still required (owner action)

1. Verify the URL-prefix property `https://codesenseai-review.netlify.app/` in Search Console
   (Google gives an HTML file or meta tag to publish at that prefix).
2. Read **Security Issues** there for the sample URLs and exact category — Google does not
   expose samples through the public transparency report, and the Safe Browsing v4 API
   rejects API-key auth (`401`, requires OAuth2/GCP credentials).
3. After deploying this fix, submit a **review request** from the Security Issues page,
   describing the investigation and remediation above accurately.
4. Re-check the transparency report until the record changes, then confirm in a normal
   browser that the interstitial is gone. Clearance must be observed, never assumed.
