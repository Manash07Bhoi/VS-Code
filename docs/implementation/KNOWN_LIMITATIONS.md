# Known Limitations — CodeSense AI

**Date:** 2026-11-16. Direct and specific — each limitation says what is NOT possible and why.

## Execution & debugging

1. **No integrated terminal.** There is no shell bridge of any kind. A real terminal requires an isolated per-session sandbox (container/VM), CPU/memory/process/time/output caps, deny-by-default networking, ephemeral filesystems, an authenticated audited gateway and guaranteed teardown — deliberately not built in this release. The Terminal panel states this and never simulates output.
2. **No code execution.** Submitted code is never run, anywhere, by anything. "Run and Debug" offers no breakpoints and pretends nothing.
3. **No test execution.** The app cannot run user tests (only its own CI tests, which are developer/CI workflows, not app features).

## Language intelligence

4. **Python / Java / C++ have no language services.** They get Monaco tokenization and editing only — no completion, no diagnostics. The Integrations panel and docs state this; the Problems panel does not fabricate diagnostics for them.
5. **JS/TS diagnostics are in-browser only.** They come from Monaco's TypeScript worker — real syntax analysis, not a compiler. They are labeled "Editor" and never presented as compiler errors.
6. **Language override is session-only.** The status-bar language picker does not persist; language is derived from the file extension on reload (labeled in the picker dialog).

## Workspace & versioning

7. **The workspace is browser-local only.** localStorage-backed (2 MiB / 200 files); clearing browser data deletes it. It is not server persistence, not sync, not Git — the UI labels it in the status bar and the Source Control panel.
8. **No real Git.** The Source Control view tracks local changes against local checkpoints (snapshots, last 10). No branches, staging, remotes, or commits. Real Git requires an authenticated backend Git service — the required architecture is documented in the panel and in `docs/architecture/IDE_WORKBENCH_ARCHITECTURE.md`.
9. **Monaco loads from a CDN.** The editor requires network access to cdnjs (CSP-allow-listed). Offline use degrades to no editor. In restricted networks the TS diagnostics worker may fail to load — editing still works; diagnostics do not (the e2e suite reports an honest SKIP in that environment).

## AI assistance

10. **AI requires a configured provider.** Without `GEMINI_API_KEY`/`GEMINI_MODEL` on the backend, every AI action returns an explicit provider-unavailable state. No canned or simulated analysis exists. The deployed service **is** configured (`gemini-3.1-flash-lite`) and live review/explain/improve calls returning 201/200 were recorded on 2026-11-17 — see `docs/ai/GEMINI_LIVE_VERIFICATION.md`.
11. **AI findings are advisory.** As the limitation notice on every review states: findings may miss issues or include false positives; line numbers are model-reported and staleness-checked, not verified.
12. **Assist results are ephemeral.** Explain/improve responses are not persisted anywhere server-side (by design); a page reload clears them.
13. **AI proposals apply to the editor buffer, not disk.** Accepting a proposal marks the file dirty; an explicit save is still required (a deliberate safety step).

## Deployment boundary

14. **The backend is deployed on free tiers, which are not production infrastructure.** Live at
    <https://codesense-ai-backend-9skh.onrender.com> on Render Free with MongoDB Atlas free tier.
    Documented limits: spin-down after ~15 min idle (measured cold start ~22 s), no static egress
    IPs (so Atlas network access is broad — see `docs/security/ATLAS_NETWORK_ACCESS.md`), no
    persistent disk, single instance, no autoscaling, and no managed backups. CI/CD for the
    backend is a manual/API deploy, not push-triggered (the Render service is not linked to the
    GitHub App). Sessions survive restarts because they live in Atlas.
14b. **AI review depends on Gemini free-tier quota.** Model selection is validated against real
    calls (`gemini-3.1-flash-lite`, confirmed live in production); `gemini-2.5-flash*` now return
    404 for new keys and the higher flash tiers were returning 503/timeout at test time.
    When quota is exhausted or the provider is unavailable the API returns an honest
    rate-limited/unavailable status and never fabricates findings.
14c. **Free-tier CPU is small.** The service runs on 0.1 CPU / 512 MB. Gemini calls are I/O-bound
    so this is mostly invisible, but a cold start plus the first AI call can take several
    seconds longer than the warm numbers recorded above.
14d. **IPv6 rate-limit buckets are per-prefix, not per-address.** Since the `express-rate-limit`
    8 migration, address-based keys are normalised with `ipKeyGenerator` (a shared prefix shares
    one bucket). This is deliberate — it is what stops an IPv6 client from rotating addresses to
    bypass limits — but it means clients behind one NAT/prefix share a quota.
15. **No production Lighthouse audit.** Audits in `tests/artifacts/lighthouse/` were run against the local full-stack environment (real backend) — see `docs/testing/LIGHTHOUSE_REPORT.md` for scope and the one accepted Best-Practices deduction (the anonymous `/auth/me` 401 boot-check).

## Testing scope

16. **The e2e diagnostics check skips in restricted networks** (sandbox CDN worker block); CI runners with unrestricted network exercise the real path.
17. **No authenticated-page Lighthouse runs** (login-gated pages need a custom gatherer) — noted as future work, not claimed.
