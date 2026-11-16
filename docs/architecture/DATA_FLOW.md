# Data Flow — CodeSense AI

**Updated:** 2026-11-16

## 1. Authentication

```
Browser ── POST /auth/register {email,password}
        └─▶ zod validation ─▶ bcrypt hash (cost 12) ─▶ User created
            ─▶ session regenerate ─▶ session{userId,email,csrfToken} saved ─▶ 201 + Set-Cookie cs.sid
Browser ── POST /auth/login {email,password}
        └─▶ lookup ─▶ bcrypt compare ─▶ session regenerate+save ─▶ 200 + fresh CSRF token
Browser ── POST /auth/logout (CSRF) ─▶ session destroyed ─▶ cs.sid cookie cleared
```

## 2. Review (persisted)

```
Workbench AI panel / dashboard
  ── POST /reviews {source, language, title?, focus?}  [auth+CSRF+ratelimit+zod]
       └─▶ language registry check ─▶ size cap (64 KiB)
           ─▶ Review{accepted, sha256(source), focus} persisted
           ─▶ GeminiAdapter.analyze()  (server-side key; retries bounded by total deadline)
                └─▶ strict JSON ─▶ normalize findings (allow-lists, sanitize)
           ─▶ Review{completed, findings, summary} persisted
  ◀─ {reviewId, findings, summary, limitationNotice} | providerUnavailable (honest 502-path)
```

## 3. Assist (ephemeral)

```
Workbench (Explain / Generate Fix Suggestions)
  ── POST /assist {action, source, language, hasSelection?}  [auth+CSRF+ratelimit+zod]
       └─▶ GeminiAdapter.assist(action)
            explain ─▶ {explanation, keyPoints, caveats}
            improve ─▶ {improvedCode, changes[], summary, caveats}
  ◀─ result (NOT persisted anywhere server-side)
       improve ─▶ Diff viewer (read-only) ─▶ Accept marks file dirty ─▶ explicit Ctrl+S persists
```

## 4. Workspace (browser-local)

```
Monaco model edit ─▶ workspace.write(path) ─▶ localStorage persist ─▶ events
  ─▶ tab dirty dot / explorer dot / SCM change list / status bar count
Ctrl+S ─▶ workspace.save(path) (savedContent = content) ─▶ event ─▶ indicators clear
Checkpoint ─▶ snapshot of all contents stored locally (history of last 10)
Search/Replace ─▶ in-memory scan of all file contents ─▶ match navigation / guarded replace
```

## 5. Editor diagnostics

```
Monaco language services (JS/TS, in-browser worker)
  ─▶ markers per model ─▶ Problems panel groups (path) with severity + source "Editor"
AI review findings ─▶ same panel, source "AI Review", staleness-checked by sha256 digest
```

## 6. Static assets & SPA

```
GET /  ─▶ index.html (SPA fallback for non-API paths)
GET /js/*, /css/* ─▶ express.static (before the rate limiter; API stays limited)
GET /*  ─▶ index.html (hash routes resolve client-side)
```
