# Changelog — CodeSense AI Documentation and Product

This changelog records material specification and implementation changes. Entries must be factual and traceable to a commit or delivery artifact. Do not fabricate release numbers, shipped features or dates.

## 15 November 2026 — Documentation package baseline

- Prepared a Markdown-only engineering specification package for CodeSense AI.
- Recorded observed GitHub baseline for `Manash07Bhoi/VS-Code` on `main`: root listing included `README.md` and `presentation.pptx`.
- Captured presentation scope: authentication, Monaco editor, language selection, AI-assisted analysis, categorized findings, improved-code recommendations and saved review history.
- Defined separate HTML/CSS/Vanilla JavaScript frontend and Node.js/Express backend as default direction, with MongoDB and backend-only Gemini integration as proposed choices.
- Established no-fake-data and honest verification requirements in `AGENT.md`.
- Defined desktop Chrome/Firefox as primary browser targets; Android is out of scope.
- Excluded paid tiers, billing and premium/developer-only screens or entitlements.

## Change-recording rules

For every later entry include date, commit/release reference, change summary, reason, affected areas, tests and limitations. Keep chronological order. Distinguish documentation changes from implemented functionality. Record features as shipped only after verification.


## Change management details

A meaningful entry identifies whether a change affects requirements, UI, API, schema, AI prompt, security, performance, testing, CI/CD or deployment. When a behavior changes, point to the corresponding document and record the migration/compatibility impact. When a defect is fixed, record its regression test. When a feature is removed or deferred, record the reason and confirm that navigation and docs no longer imply it exists.

Release headings are created only when a release artifact actually exists. A planned release is not a shipped release. Do not write "all tests passed" unless the exact test run is available and traceable.
