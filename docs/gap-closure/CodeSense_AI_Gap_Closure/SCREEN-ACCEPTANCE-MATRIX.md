# Screen-by-Screen Acceptance Matrix — CodeSense AI

## 1. Public screens

### Registration
Required: email, password, submit, login link, inline field errors, pending state, server failure state.
Acceptance: no duplicate submit; password visibility control is keyboard accessible; success only after server confirms account creation.

### Login
Required: email, password, submit, register link, generic credential error, session-expired handling.
Acceptance: no account enumeration; rate limiting communicated safely; successful session leads to intended internal route.

## 2. Authenticated screens

### Dashboard / home
Required: primary new-review action and actual recent-review records if present.
Acceptance: no fabricated counts, charts or activity. First-use state derives from a real empty query.

### Editor workspace
Required: Monaco editor, language selector, source length indicator, Analyze button, editor loading/error state, submission state.
Acceptance: language options come from backend registry; no unsupported language appears; unsaved source is not silently lost; no fake progress animation; duplicate submit controlled.

### Review report
Required: review status, summary, limitations, findings, source locations where validated, recommendations and improved-code panel.
Acceptance: every finding maps to persisted report data; no unvalidated line number; no findings does not mean safe; copy controls perform real clipboard actions; applying a suggestion requires confirmation and never overwrites source silently.

### Review history
Required: list, filter/sort/search only if implemented, pagination, empty state, no-match state, load failure and deletion confirmation.
Acceptance: all results are owner-scoped; filters reset pagination; pagination bounded; deleting last result returns to real empty state.

### Account/session menu
Required: current account identity from `/auth/me`, logout.
Acceptance: no hardcoded user identity; logout revokes server session and returns to public state.

## 3. Shared states

Every screen with remote data must define:
- initial/loading;
- loaded with data;
- true empty;
- filtered no-results;
- validation error;
- unauthorized/expired session;
- forbidden/not-found;
- dependency/network failure;
- retry behavior;
- stale response behavior.

## 4. Desktop layout

Test minimum supported viewport and a wide desktop viewport, browser zoom to 200%, long source, long finding text, and report with many findings. Define exact breakpoints in the design system and verify no horizontal overflow except the code editor where intentional.

## 5. Controls inventory

Every visible button, link, menu, tab, selector, modal and keyboard shortcut must map to an implemented action and a test ID. Remove decorative controls that imply functionality but have no behavior.
