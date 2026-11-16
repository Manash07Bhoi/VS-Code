# Programming Language Support and Capability Policy

## 1. Why this policy exists

Monaco syntax highlighting, static analysis and AI-assisted review are distinct capabilities. A language can be highlighted by Monaco without having a compiler, linter or validated analysis prompt integrated. The product must never present these capabilities as equivalent.

## 2. Capability dimensions

For each language, track separately:
- **Editor mode:** Monaco language identifier and syntax/tokenization behavior.
- **Static analysis:** actual installed/configured parser, linter or analyzer and version.
- **AI review:** provider prompt/schema coverage and test evidence.
- **Location quality:** whether line/range findings are validated against the submitted source.
- **Support status:** enabled for review, editor-only, experimental/internal or unsupported.

The language selector should present only capabilities appropriate to the action. Users must know when a language is editor-only and cannot be submitted for review.

## 3. Initial release recommendation

Start with a deliberately small set whose editor mode, backend language mapping, prompt behavior, source limits and automated tests can be verified end to end. JavaScript and TypeScript are a practical initial pair because the application itself uses JavaScript and established static-analysis tooling is available. Python may be added when its analyzer/prompt and test corpus are integrated. Additional languages such as Java, C and C++ should be enabled only after equivalent validation.

This is a proposed rollout order, not a claim that these languages are already supported. Arena must inspect the current environment, provider capability and available tools, then record the actual selected language set and evidence.

## 4. Language registry

Maintain one authoritative capability registry on the backend. Each entry should define canonical identifier, display name, Monaco identifier, review-enabled flag, static analyzer identity/version when present, AI review support state, source size policy and capability notes. Frontend receives a safe public view of enabled options. Do not duplicate hardcoded lists in multiple unrelated components.

## 5. Validation rules

The server validates language IDs against the authoritative registry. Unknown/disabled language is rejected before provider call. The browser cannot enable a language by altering request data. If an analyzer is unavailable in production, its capability is marked unavailable and no deterministic-analysis claim is made.

## 6. Language-specific tooling

Use fixed, known tools and safe arguments. Do not execute the submitted program. If a parser/linter processes source files, isolate temporary files, cap input/time/memory, disable network where feasible, and treat tool output as untrusted. Record exact analyzer versions and configuration. Do not install a tool dynamically from user-submitted source.

## 7. Test coverage

For every enabled language, test:
- editor mode and language switch;
- source submission and canonical backend mapping;
- valid source and syntax-error cases;
- source-size limits;
- analyzer availability/error path;
- AI response schema and location mapping;
- prompt injection embedded in comments/strings;
- report display and history retrieval;
- unsupported-language rejection.

A language is not review-supported until its required tests pass in the target application environment.

## 8. Release documentation

Keep this table current with actual evidence:

| Language | Editor mode | Static analyzer | AI review tested | Release status |
|---|---|---|---|---|
| JavaScript | Record verified implementation | Record actual tool or none | Record actual test evidence | Enable only after verification |
| TypeScript | Record verified implementation | Record actual tool or none | Record actual test evidence | Enable only after verification |
| Python | Record verified implementation | Record actual tool or none | Record actual test evidence | Enable only after verification |
| Other languages | Add only with implementation evidence | Record actual tool or none | Record actual test evidence | Disabled until verified |

Do not fill this table with invented versions or mark items complete based on intention. Update it after real implementation and browser testing.
