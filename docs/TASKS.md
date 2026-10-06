# Task Breakdown

Checkpoint 1 is approved. This breakdown is based on docs/REQUIREMENTS.md and docs/PLAN.md. No application code or dependencies have been changed in Checkpoint 2.

## Open decision that gates T-010

T-010 depends on a user decision about customization scope. The options are:
- One shared board with configurable columns and custom task fields (recommended in the draft).
- One shared board with configurable columns and fixed task fields.
- Separate boards per user, which requires authenticated accounts and ownership rules.

The original ordered, forward-only status rule is retained in all options unless the user explicitly changes it. Until this decision is explicit, T-010 cannot be implemented. Other tasks can proceed after Checkpoint 2 approval.

## Ordered tasks

### T-001 - Establish MongoDB Atlas runtime configuration

- Objective: Configure the backend to connect to MongoDB Atlas and document server-only credentials and network requirements.
- Requirements / ACs: REQ-001 AC-001.1-001.2, REQ-006 AC-006.1.
- Likely files: package.json, package-lock.json, server/package.json, server/src/index.ts, server/.env.example, README.md.
- Dependencies: None.
- Edge cases: Missing/invalid Atlas URI, unescaped credentials, database user/IP access list errors, DNS/network failure, readiness/shutdown handling.
- Automated tests: Configuration validation and startup/readiness behavior; live Atlas smoke test only when an isolated test URI is available.
- Documentation impact: Atlas connection setup, required server env vars, database user and IP access list prerequisites.
- Definition of done: Server connects through a server-only Atlas URI; no secret is committed; missing/unavailable DB fails clearly; instructions require no local Mongo service.
- Status: Implemented; config tests and production build pass. Live Atlas connection remains unverified because no test-cluster URI/network credentials are configured in this environment.

### T-002 - Add Mongo models, repositories, indexes, actor/board persistence, and data import

- Objective: Define persistence boundaries for actors, board configuration, tasks, and append-only audit events; provide a deliberate importer for existing JSON data if it is to be retained.
- Requirements / ACs: REQ-001 AC-001.1/001.3, REQ-003 AC-003.1/003.3, REQ-006 AC-006.5/006.6.
- Likely files: server/src/models/*, server/src/repositories/*, server/src/migrations/*, data/tasks.json (read-only import source).
- Dependencies: T-001. The generic board document supports later settings work; ownership/configuration UI remains gated on the T-010 scope decision.
- Edge cases: Duplicate import, invalid legacy records, ID conversion, missing board/actor references, deleted task with historical events.
- Automated tests: Repository CRUD/persistence/index tests; importer idempotence and invalid-record handling; audit retention query test.
- Documentation impact: Document collections, index strategy, and safe import command.
- Definition of done: Typed Mongo repositories, validators, and indexes cover actors/boards/tasks/audit events; default configuration is seeded without overwriting user edits; the legacy import is idempotent. Service wiring into these repositories is completed by T-003 because status/audit consistency must be implemented as one transaction, not as a full-store snapshot write.
- Status: Schemas, typed repositories, seed data, importer, and connection bootstrap implemented; unit/build checks pass. No live Mongo integration run because the Docker engine is unavailable.

### T-003 - Implement domain validation and transactional task/audit services

- Objective: Centralize task creation, ordered status transitions, no-op behavior, updatedBy, deletion, audit append, and board/task input validation.
- Requirements / ACs: REQ-001 AC-001.3, REQ-005 AC-005.1-005.2, REQ-006 AC-006.1-006.6, REQ-010 AC-010.1.
- Likely files: server/src/domain/*, server/src/services/*, server/src/validation/*.
- Dependencies: T-002; board config details from T-010 decision.
- Edge cases: Empty/oversize title, invalid actor/status/ObjectId, same-status request, skipped/backward move, transaction failure, simultaneous moves, delete with retained history.
- Automated tests: Unit tests for validation/transitions; MongoDB Atlas integration tests against a dedicated non-production database for atomic task update + audit insert, rollback, no-op, and delete retention.
- Documentation impact: Record state transition, no-op, and audit consistency behavior in docs/PLAN.md and API contract.
- Definition of done: Service enforces approved rules; successful move updates status and updatedBy atomically with one audit event; invalid/no-op operations create no event.

### T-004 - Split and implement backend route modules

- Objective: Keep each endpoint/domain in focused route files and make route handlers delegate to services.
- Requirements / ACs: REQ-007 AC-007.1-007.3, REQ-011 AC-011.1-011.3.
- Likely files: server/src/app.ts, server/src/routes/tasks.routes.ts, server/src/routes/boards.routes.ts, server/src/routes/actors.routes.ts, server/src/routes/audit.routes.ts, server/src/middleware/*.
- Dependencies: T-003; endpoint surface for T-010 depends on the scope decision.
- Edge cases: Malformed body, invalid identifier, not found, invalid transition, DB failure, unknown endpoint, deleted-task audit lookup.
- Automated tests: Supertest API contract tests for success and common error responses.
- Documentation impact: Keep route list and error response shape current in OpenAPI/README.
- Definition of done: Routes are separated; all handlers map errors consistently; no direct persistence logic is embedded in route files.

### T-005 - Cover backend inputs and API behavior

- Objective: Complete backend tests for endpoint contracts, domain validation, persistence, and failure behavior.
- Requirements / ACs: REQ-006, REQ-007 AC-007.3, REQ-010 AC-010.1-010.2, REQ-011.
- Likely files: server/test/unit/*, server/test/integration/*, server/package.json.
- Dependencies: T-001 through T-004.
- Edge cases: Missing/null/wrong-type values, whitespace, oversized fields, unknown actor, invalid ID, no-op, invalid transition, Mongo outage, transaction rollback, duplicate requests, history after delete.
- Automated tests: Node test runner or Vitest + Supertest against dedicated MongoDB Atlas test database configured via a private test URI.
- Documentation impact: Update npm test instructions and clearly state required Mongo test topology.
- Definition of done: Each listed input/failure class has an automated assertion; tests isolate data and clean up; repeated runs are deterministic.

### T-006 - Publish accurate OpenAPI and Scalar documentation

- Objective: Describe actual API contracts and host the interactive Scalar reference.
- Requirements / ACs: REQ-009 AC-009.1-009.3.
- Likely files: server/openapi.yaml (or generated schema), server/src/routes/docs.routes.ts, server/package.json, docs/API.md.
- Dependencies: T-004; T-010 endpoint decisions if customization API is included.
- Edge cases: Error variants, examples, stale schema, docs/spec route failure.
- Automated tests: Validate OpenAPI schema; smoke-test Scalar and machine-readable spec routes; compare route response shapes with API tests.
- Documentation impact: docs/API.md gives URL and regeneration/update workflow.
- Definition of done: Scalar is reachable, the spec covers every public endpoint and validation/error response, and examples match tested implementation.

### T-007 - Extract focused frontend components and shared API/types

- Objective: Split the current page into maintainable file-based components without changing approved behavior.
- Requirements / ACs: REQ-008 AC-008.1-008.3.
- Likely files: client/src/App.tsx, client/src/components/*, client/src/api/*, client/src/types/*, client/src/hooks/*.
- Dependencies: None for extraction; coordinate contract changes with T-004.
- Edge cases: Loading, empty, errors, long titles, responsive layout, no history.
- Automated tests: Component tests for rendering, API states, and accessible labels; TypeScript build.
- Documentation impact: Briefly note the component layout in README only if useful.
- Definition of done: App composition is small and readable, API/types are shared, and existing flows still build and render.

### T-008 - Improve actor picker and show Updated by

- Objective: Provide a clear accessible actor-selection experience and display the last real status-change actor/time on each task.
- Requirements / ACs: REQ-004 AC-004.1-004.3, REQ-005 AC-005.1-005.3.
- Likely files: client/src/components/ActorPicker.tsx, client/src/components/TaskCard.tsx, client/src/api/*; server actor/task DTOs.
- Dependencies: T-002, T-003, T-004, T-007.
- Edge cases: Empty roster, keyboard focus, unavailable actor, task not yet transitioned, API failure.
- Automated tests: Component and API tests; Playwright check of selected actor and Updated by before/after a move and reload.
- Documentation impact: State clearly that actor selection is self-asserted without authentication.
- Definition of done: Picker is keyboard-usable and selected actor is visible; updater survives reload and is not fabricated for unmodified tasks.

### T-009 - Implement Kanban board and deliberate status movement

- Objective: Render status lanes and safely move cards using accessible drag/drop while preserving backend workflow rules.
- Requirements / ACs: REQ-002 AC-002.1-002.4, REQ-006 AC-006.1-006.3, REQ-011 AC-011.2.
- Likely files: client/src/components/Board.tsx, BoardColumn.tsx, TaskCard.tsx, client/src/components/board/*, client/src/hooks/*, client/package.json.
- Dependencies: T-003, T-004, T-007, T-008.
- Edge cases: Drop outside board, same lane, invalid/skipped target, network error, concurrent update, keyboard interaction, narrow screen.
- Automated tests: Component tests for droppable states; Playwright move/invalid move/error flow.
- Documentation impact: README user instructions describe board moves and ordered workflow.
- Definition of done: Only valid next-column moves persist; rejected moves restore the card and show feedback; every successful move records actor/history.

### T-010 - Implement approved board/task customization

- Objective: Build the exact configuration UI/API approved by the user, preserving existing tasks and historical audit meaning.
- Requirements / ACs: REQ-003 AC-003.1-003.3, REQ-010 AC-010.1-010.3.
- Likely files: server/src/routes/boards.routes.ts, server/src/services/board.service.ts, server/src/validation/board.schema.ts, client/src/components/BoardSettings.tsx, client/src/components/TaskFields.tsx, docs/PLAN.md.
- Dependencies: Explicit customization-scope decision; T-002, T-003, T-004, T-007, T-009.
- Edge cases: Duplicate/blank names, remove/reorder a populated status, migrate tasks safely, change field type/requiredness with existing values, historical label snapshots.
- Automated tests: API validation and persistence tests; Playwright configuration/reload and existing-task/history regression.
- Documentation impact: Explain supported customization, transition-order effects, and limitations.
- Definition of done: Only the approved configuration scope is present; unsafe edits are rejected or require an explicit safe migration; historical events remain interpretable.

### T-011 - Add Playwright end-to-end suite

- Objective: Exercise full user flows in a real browser against the app and Mongo-backed API.
- Requirements / ACs: REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008, REQ-010 AC-010.3.
- Likely files: package.json, package-lock.json, playwright.config.ts, client/e2e/*, test scripts.
- Dependencies: T-001, T-004, T-007 through T-010.
- Edge cases: Persistence after reload, invalid move, API/Mongo failure state, keyboard flow, empty board.
- Automated tests: Playwright Chromium suite; use isolated board/actor fixtures and isolated Atlas test database.
- Documentation impact: Document install/run commands and prerequisites; CI command if CI is added.
- Definition of done: Required create/select/move/update-by/history/customization/reload/error flows pass and are repeatable from a clean environment.

### T-012 - Final documentation and requirement traceability review

- Objective: Reconcile README, API docs, setup, tests, and accepted requirements with shipped behavior.
- Requirements / ACs: All REQ and AC IDs.
- Likely files: README.md, docs/REQUIREMENTS.md, docs/PLAN.md, docs/API.md, docs/AGENT_LOG.md, .gitignore.
- Dependencies: T-001 through T-011.
- Edge cases: Secrets/runtime data accidentally tracked, undocumented env vars, stale API/test claims, unresolved acceptance criteria.
- Automated tests: Full backend test suite, Playwright suite, production build, OpenAPI validation.
- Documentation impact: This task is the documentation and final review.
- Definition of done: Every accepted AC maps to implementation and a passing verification; docs are accurate; no secrets or local runtime data are staged; unresolved limitations are listed.

## Ordering rationale

Database topology precedes repository work; repository contracts precede transactional domain logic; services precede routes and UI consumers. Backend API tests and OpenAPI follow stable route contracts. Component extraction can proceed independently after approval; actor attribution requires backend DTO support; Kanban depends on the status API. Customization is gated on the explicit scope choice because it changes both schema and workflow semantics. Playwright follows stable backend/frontend contracts, and the final traceability review comes last.

## High-risk tasks

- T-003: Mongo transaction behavior must keep status and audit synchronized under failures/concurrent requests.
- T-010: Configuration changes can invalidate tasks and change status meaning; this task is intentionally blocked until scope is explicit.
- T-011: Browser tests need reproducible Mongo replica-set startup and data isolation.
- T-008: A dropdown-selected actor is not verified identity while auth remains out of scope.

## Checkpoint state

Checkpoint 2 task breakdown draft. Awaiting explicit approval before implementation. T-010 remains gated on the user's customization-scope decision.

## Implementation progress

- T-001: Implemented. Atlas configuration is backend-only; live connection is pending a dedicated test URI.
- T-002: Implemented foundations: collections, validators, indexes, seed, and importer.
- T-003: Implemented and unit-tested. Mongo transaction integration remains pending an isolated Atlas database.
- T-004: Implemented and API-tested. Routes are split by task, audit, actor, board-read, and docs domains.
- T-005: Partially implemented. Backend unit/API validation tests pass; Atlas integration tests remain pending test credentials.
- T-006: Implemented. OpenAPI and Scalar are available at /api/openapi.json and /api/docs.
- T-007 through T-009: Implemented and browser-tested. Status movement is drag/drop only; no click-to-move action remains.
- T-010: Blocked on customization scope decision.
- T-011: Partially implemented. Playwright tests pass with HTTP fixtures; an Atlas-backed full-stack suite awaits the test database.
- T-012: Pending final review after T-010 and Atlas integration coverage.
