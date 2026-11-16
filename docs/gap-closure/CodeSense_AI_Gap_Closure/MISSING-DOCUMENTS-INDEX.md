# Missing Documentation Addendum — Index

This folder supplements, rather than silently replaces, the original 33-file CodeSense AI documentation pack.

## New gap-closure documents

1. `GAP-AUDIT.md` — audit findings, status vocabulary and prioritized gaps.
2. `REQUIREMENTS-TRACEABILITY.md` — requirement-to-screen/API/data/security/test mapping.
3. `SCOPE-AND-ROADMAP.md` — MVP boundaries and phased exit gates.
4. `USER-STORIES-ACCEPTANCE.md` — user stories and acceptance criteria.
5. `API-CONTRACTS.md` — route inventory, payload shape, errors, auth and pagination.
6. `AUTH-SESSION-SECURITY.md` — auth/session lifecycle and security tests.
7. `AI-PROVIDER-OPERATIONS.md` — real provider adapter, failure, schema, prompt injection and budget rules.
8. `DATA-LIFECYCLE-MIGRATIONS.md` — retention, deletion, migrations, indexes and recovery.
9. `THREAT-MODEL.md` — trust boundaries, abuse cases and mitigations.
10. `OBSERVABILITY-INCIDENTS.md` — logs, metrics, health, alerts and incident handling.
11. `TEST-MATRIX.md` — test cases and release evidence.
12. `SCREEN-ACCEPTANCE-MATRIX.md` — screen-level controls and states.
13. `LANGUAGE-IMPLEMENTATION-MATRIX.md` — minimum five-language E2E support criteria.
14. `DECISIONS.md` — architecture decision records and unresolved decisions.
15. `FRONTEND-BACKEND-IMPLEMENTATION.md` — source layout, responsibilities and integration.
16. `ENVIRONMENTS-DEPLOYMENT-TOPOLOGY.md` — environment, configuration, deploy and rollback.
17. `DEPENDENCIES-LICENSES.md` — dependency, licence and supply-chain policy.
18. `PRIVACY-DATA-PROTECTION.md` — source-code privacy and data handling.
19. `DEFINITION-OF-DONE.md` — feature and release completion gates.
20. `PROJECT-STATUS-AND-RELEASE-EVIDENCE.md` — evidence-based project status.

## Integration instructions

- Keep the original `PRD.md`, `PRD2.md`, `AGENT.md`, `SOP.md`, architecture, design and security documents.
- Update `docs/DOCUMENTATION-INDEX.md` in the original pack to link to this addendum.
- Treat `AGENT.md` and `MASTER-ARENA-PROMPT.md` as controlling execution instructions, subject to stricter security and truthfulness rules here.
- Do not mark any item complete without source/test evidence.
- Do not create empty files to satisfy an index.
