# Five-Language Implementation and Verification Matrix — CodeSense AI

## 1. Release requirement

The requested minimum is five languages. The selected target set is JavaScript, TypeScript, Python, Java and C++. This is a product acceptance requirement; it is not a claim that any language is already implemented.

## 2. Per-language integration contract

For each language, the engineering team must verify:
1. Canonical language identifier.
2. Monaco language identifier and editor behavior.
3. Server registry entry and public capability response.
4. Source encoding and size limits.
5. Language-specific prompt context.
6. Output schema and finding category mapping.
7. Line/range mapping against original submitted source.
8. Report rendering and persisted history.
9. Valid source test.
10. Syntax/edge-case test.
11. Unsupported or disabled-language rejection.
12. Prompt-injection test.
13. Provider failure path.
14. Browser end-to-end test.

## 3. Target registry

| Display | Canonical ID | Monaco ID | Static analysis status | AI review status |
|---|---|---|---|---|
| JavaScript | `javascript` | `javascript` | Must record actual configured analyzer; do not assume | Disabled until E2E evidence |
| TypeScript | `typescript` | `typescript` | Must record actual configured analyzer; do not assume | Disabled until E2E evidence |
| Python | `python` | `python` | Must record actual configured analyzer; do not assume | Disabled until E2E evidence |
| Java | `java` | `java` | Must record actual configured analyzer; do not assume | Disabled until E2E evidence |
| C++ | `cpp` | `cpp` | Must record actual configured analyzer; do not assume | Disabled until E2E evidence |

## 4. Static analysis distinction

AI review is not the same as deterministic linting or compilation. If static analyzers are included, pin their exact versions and use safe fixed arguments. Never execute submitted binaries or arbitrary user programs. Do not claim compilation results unless a controlled isolated compiler pipeline is implemented, threat-modeled and tested. The initial product can provide AI-assisted review without claiming to compile code.

## 5. Release gating

A language is enabled only when all mandatory integration tests pass. If fewer than five pass, the product has not met the requested five-language release requirement. The selector must not show unsupported languages as available for analysis.
