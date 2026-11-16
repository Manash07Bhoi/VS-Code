# CodeSense AI — Engineering Documentation Package

This archive contains the Markdown product, UX, architecture, security, testing, operations and Arena Agent documentation for CodeSense AI. It is a documentation package, not the application source code.

## Authoritative sources

- GitHub repository: https://github.com/Manash07Bhoi/VS-Code.git
- Original product brief: `presentation.pptx` in the repository.
- Master Arena prompt: `MASTER-ARENA-PROMPT.md`.
- Non-negotiable rules: `AGENT.md`.
- Product requirements: `PRD.md` and `PRD2.md`.
- Documentation map: `docs/DOCUMENTATION-INDEX.md`.

## Repository baseline

The connected GitHub repository was inspected on 15 November 2026. Its public `main` root showed `README.md` and `presentation.pptx`; the README contained only a short repository label. The presentation was approximately 4.86 MB. This is a dated observation, not a permanent claim. Arena must clone and inspect the live repository before implementation.

The PowerPoint describes authentication, a Monaco-based editor, language selection, AI analysis, bug/security/performance findings, beginner-friendly explanations, improved-code recommendations and saved review history. Its proposed stack includes HTML/CSS/JavaScript or React, Node.js/Express REST API, MongoDB, Gemini/OpenAI, JWT and Monaco. This documentation resolves the frontend direction as semantic HTML/CSS/Vanilla JavaScript and requires separate frontend/backend directories.

## Product distinction

The application is built using Visual Studio Code; it is not a recreation of the full VS Code desktop product. Monaco is the embedded editor component. First release is a code-review platform, not a compiler, code execution sandbox, full IDE or collaboration suite.

## Proposed stack

- Frontend: HTML5, CSS3, Vanilla JavaScript.
- Editor: Monaco Editor.
- Backend: Node.js and Express.js.
- Database: MongoDB and Mongoose.
- AI: backend-only Gemini integration; additional provider only when implemented and tested.
- Validation: server-side schema validation.
- Authentication: secure password hashing and secure session/token lifecycle.

Arena must verify supported versions and deployment compatibility during implementation. These choices do not imply that the components currently exist in the repository.

## Usage order

1. Read `MASTER-ARENA-PROMPT.md` and `AGENT.md`.
2. Clone and inspect the repository.
3. Read the complete PowerPoint.
4. Update `REPOSITORY-AUDIT.md` using actual repository evidence.
5. Reconcile scope and architecture.
6. Implement the application in separate `frontend/` and `backend/` directories.
7. Keep docs synchronized with actual behavior.
8. Complete testing, security, release and ZIP verification.

## Scope exclusions

No paid tier, billing, subscription, pricing, upgrade, premium-only or developer-only feature/page is part of the product. Android is not a target platform. Git provider integration, team collaboration and real-time collaborative editing are future scope.

## Delivery integrity

This archive intentionally contains Markdown files only. The future application ZIP must contain real source, tests, docs and safe configuration while excluding secrets, credentials, real user data and dependency caches. Never fabricate data, functionality or test evidence. See `AGENT.md`.
