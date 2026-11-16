# Release Process — CodeSense AI

**Repository:** https://github.com/Manash07Bhoi/VS-Code.git
**Branch:** `main`
**Git author:** Manash <manash07ji@gmail.com> (from verified repo history)

---

## Release checklist

Before tagging or publishing a release, every item must be VERIFIED (not merely planned):

| # | Gate | How verified | Status |
|---|------|--------------|--------|
| R1 | Backend tests pass | `npm test` from `backend/` → 18/18 pass, exit 0 | VERIFIED |
| R2 | ESLint clean | `npm run lint` → 0 errors | VERIFIED |
| R3 | Frontend syntax valid | `node --check` on all frontend JS files | VERIFIED |
| R4 | No committed secrets | Secret scan clean; `.env` not tracked | VERIFIED |
| R5 | ZIP integrity | `unzip -t` on all three release archives | VERIFIED (per release) |
| R6 | Remote commit matches local | `git fetch` + `git rev-parse HEAD == origin/main` | VERIFIED (per push) |
| R7 | No force-push | Normal `git push origin main` only | VERIFIED |

---

## Creating the three release ZIPs

From the repository root, on the final committed `main`:

```bash
# Complete project
git archive --format=zip --output=CodeSense_AI_Final_Complete_Project.zip HEAD

# Frontend only
git archive --format=zip --output=CodeSense_AI_Final_Frontend.zip HEAD frontend/

# Backend only
git archive --format=zip --output=CodeSense_AI_Final_Backend.zip HEAD backend/

# Verify each
unzip -t CodeSense_AI_Final_Complete_Project.zip
unzip -t CodeSense_AI_Final_Frontend.zip
unzip -t CodeSense_AI_Final_Backend.zip

# Checksums
sha256sum CodeSense_AI_Final_*.zip
```

**Excluded from all ZIPs:** `.env`, `node_modules`, logs, caches, tokens, credentials, local database files, private user data. Safe `.env.example` files are included with empty/placeholder values only.

---

## Pushing to GitHub

1. Review `git status` and `git diff` — no secrets, no stray generated files.
2. Commit logically grouped changes with descriptive messages.
3. Push via secure credential helper (never embed token in remote URL):
   ```bash
   git push origin main
   ```
4. Fetch and verify: `git fetch origin && git rev-parse HEAD` == `git rev-parse origin/main`.
5. Never force-push to resolve a normal synchronization issue.

---

## Versioning

Releases are identified by the Git commit SHA deployed to `main`. The deployed commit SHA and (when applicable) Netlify deployment URL are recorded in the release evidence report.

---

## What is intentionally NOT released as production

- Live Gemini analysis — requires a real `GEMINI_API_KEY`; provider-unavailable path verified instead.
- Live cross-origin deployment — requires Netlify site ID and backend host; not performed.
- Production Lighthouse scores — requires a live deployment.
