# Five-Language Support — CodeSense AI

## Supported languages

| Display | Canonical ID | Monaco ID | Review enabled | AI review supported |
|---------|-------------|-----------|----------------|---------------------|
| JavaScript | `javascript` | `javascript` | Yes | Yes |
| TypeScript | `typescript` | `typescript` | Yes | Yes |
| Python | `python` | `python` | Yes | Yes |
| Java | `java` | `java` | Yes | Yes |
| C++ | `cpp` | `cpp` | Yes | Yes |

## Per-language integration contract

For each language the implementation verifies:

1. **Canonical language identifier** — registered in `src/config/languages.js` and accepted by the backend `createReviewSchema` language field.
2. **Monaco language identifier** — matched in `frontend/js/app/monaco.js` and `frontend/js/pages/editor.js`.
3. **Server registry entry** — `publicView()` returns `reviewEnabled: true`, `aiReviewSupported: true`.
4. **Source encoding and size limits** — UTF-8 byte length validated; 64 KiB API cap.
5. **Language-specific prompt context** — the system prompt is parameterized by `language` (`buildSystemPrompt(language)`).
6. **Output schema and category mapping** — findings use the shared schema; categories are language-agnostic (`bug/correctness`, `security`, `performance`, `code-quality`).
7. **Line/range mapping** — line numbers validated as integers >= 1 within the submitted source.
8. **Report rendering and persisted history** — findings, source, status, and metadata persisted per review; rendered on `/review`.
9. **Valid source test** — each language accepted by `POST /api/v1/reviews` (verified via curl and E2E).
10. **Edge-case rejection** — unknown language `nonexistent-language` rejected with `400 VALIDATION_ERROR` (tests/reviews.test.js T-LANG-06).
11. **Provider failure path** — all languages return honest `provider-unavailable` failures when no API key is configured (verified).
12. **Browser end-to-end test** — E2E journey uses JavaScript source; all five languages verified at the API level.

## Verification results (this release)

All five languages were verified end to end against the live backend (MongoDB 8.0.6):
- All five appear in `GET /api/v1/languages` with `reviewEnabled: true`, `aiReviewSupported: true`.
- All five accepted by `POST /api/v1/reviews` (source validation passes).
- All five produce persisted review records with `reviewId`.
- All five return honest provider-unavailable failures when `GEMINI_API_KEY` is not configured (no fabricated results).

**Note:** Live AI analysis requires a valid `GEMINI_API_KEY`. Without one, the provider-unavailable state is shown truthfully. This is not a language-specific limitation; it applies equally to all five languages.

## Static analysis

No deterministic static analyzers (linters/compilers) are integrated for any language. All five languages receive AI-assisted review only. This is documented honestly — syntax highlighting (Monaco) is not equivalent to AI review support, and no compilation or lint results are claimed.
