# Implementation Plan

## Problem and scope

Evolve the existing React + TypeScript/Vite and Express + TypeScript mini task manager into a MongoDB-backed, customizable Kanban application. Retain the core task lifecycle and audit invariants while improving actor selection, displaying the last updater, splitting UI and backend routes into maintainable modules, documenting the API with Scalar, and adding layered test coverage including Playwright.

## Decisions and open questions

### Pending user decision: customization scope

The phrase "board atau task bisa disesuaikan sendiri sesuai kemauan user" can mean:
1. One shared board with shared configurable columns/statuses and custom task fields.
2. Separate boards/configuration per signed-in user, which requires accounts, authentication, and ownership.
3. One shared board with configurable columns but standard task fields.

A clarification was requested. Until answered, the architecture below is provisional. Recommended bounded default: one shared board, configurable ordered columns and task fields, no login/roles, and the existing actor picker remains self-selected. This matches the original no-auth constraint and avoids adding account management. Actor selection is attribution, not proof of identity.

Other assumptions to validate:
- Existing forward-only transition invariant remains. In a configurable ordered board, a task may move only to the immediately next column; reordering columns changes the next allowed stage. If arbitrary lane movement is intended, that conflicts with the original workflow rule and needs explicit approval.
- A single board is the initial deployment. Board ownership/multiple boards are excluded unless the scope answer requires them.
- Updated by is the actor on the most recent actual status transition. Creation shows creator/initial state only if a reliable creator is provided; do not invent an actor.
- Task deletion removes it from the active board while audit events survive and retain a task title/status-label snapshot.
- No authentication, authorization roles, notifications, or realtime collaboration unless separately approved.

## Proposed architecture

- Frontend: retain React, TypeScript, and Vite. Use the official MongoDB Node driver with request-boundary validation and Mongo collection validators/indexes; avoid an ODM unless implementation needs it. Use a page-level board composition with small Board, BoardColumn, TaskCard, ActorPicker, TaskCreateForm, BoardSettings, AuditHistory, and shared UI components. Add typed API client/hooks. Use a focused accessible DnD library (candidate: dnd-kit) for intentional Kanban movement.
- Backend: retain Express/TypeScript. Split task, board/configuration, and audit routes into separate route modules. Route handlers parse/validate request DTOs and delegate to services; services enforce workflow and audit invariants; repositories own MongoDB persistence.
- Persistence: MongoDB is accessed only by the Express backend through the official MongoDB Node driver. The MongoDB URI and credentials stay in server-side environment variables and are never sent to the browser. The React frontend calls the Express HTTP API only; it has no MongoDB driver or direct database connection. The backend validates incoming HTTP requests before database operations, with MongoDB collection validators/indexes as an additional storage-level safeguard. Collections store board configuration, tasks, and audit events. Tasks include boardId, title, statusId, custom field values, createdAt, updatedAt, and updatedBy actor reference. Board configuration stores ordered columns and approved custom-field definitions. Audit events include taskId, boardId, task-title snapshot, actor, from/to status IDs and label snapshots, and createdAt.
- Consistency: status update and audit append occur in one MongoDB transaction. The application connects to MongoDB Atlas using a server-only mongodb+srv URI. A dedicated, non-production Atlas database is used for transaction integration tests; the app setup does not require a local MongoDB service. Audit collection has no update/delete API; task deletion does not cascade to audit events. Add appropriate board/status/task chronological indexes.
- API docs: OpenAPI is the source for Scalar docs, served at a stable endpoint (proposed /api/docs) with the machine-readable schema available separately. Keep the spec generated or validated against actual route schemas to prevent drift.
- Actor UX: clearly labeled actor control with current choice, searchable/listbox behavior if the roster grows, keyboard support, and accessible focus. The actor roster is persisted in MongoDB and served by the API; any initial records come from setup/seed data, not frontend constants.
- Errors: consistent JSON errors for validation, not found, conflict/invalid transition, and internal/database errors. Never expose database internals. Frontend retains data on failed move and displays actionable feedback.

## Data and API strategy

Provisional entities:
- Actor: stable ID and display name in MongoDB; this is attribution only, not authenticated identity.
- Board: name, ordered columns[] with stable IDs/labels/positions, custom task field definitions, timestamps.
- Task: boardId, title, statusId, customValues, createdAt, updatedAt, updatedByActorId, deletedAt (or equivalent deletion marker if needed for recovery/history UI).
- AuditEvent: taskId, boardId, taskTitleSnapshot, actorId/label snapshot, fromStatusId/label, toStatusId/label, createdAt.

Proposed API groups:
- GET/POST /api/tasks; PATCH /api/tasks/:id/status; DELETE /api/tasks/:id.
- GET /api/tasks/:id/audit-logs.
- Board configuration read/update endpoints (final CRUD depends on the customization decision).
- GET /api/actors for the persisted actor roster.
- GET /api/openapi.json and Scalar UI at /api/docs.

Use Mongo ObjectId validation at the boundary. Validate normalized non-empty titles, column IDs/status transitions, actor membership, field types/required fields, and safe config updates. Paginate audit history only if the expected volume warrants it; preserve chronological order and stable tie-breaking.

## Test strategy

1. Domain/unit: title and field validation, ordered transitions, no-op semantics, actor validation, board configuration invariants.
2. Persistence/integration: Mongo repository reads/writes, transaction rollback on audit insert/update failure, restart persistence, delete-with-history retention, chronological ordering.
3. API integration: every endpoint success/error contract, malformed JSON/body, invalid IDs, not found, duplicate/no-op, skipped/backward transitions, board/configuration constraints, audit route immutability.
4. Frontend component: actor picker interactions/accessibility, card rendering, audit display, loading/empty/error states, config forms and validation.
5. Playwright E2E: create task, select actor, drag to next lane, see Updated by @..., inspect chronological audit, reload and verify Mongo persistence, configure board/task fields, handle rejected move and API outage.
6. Build/static: TypeScript checks and production build after implementation. Do not mark tests complete until commands are run and results recorded.

## Risks and mitigations

- Mongo transaction support varies by deployment: use an Atlas deployment that supports multi-document transactions and document its connection requirements.
- Self-selected actor can be spoofed: disclose this while auth remains out of scope; actual user identity requires explicit auth scope.
- User-configurable columns can invalidate existing tasks/history: stable IDs, prohibit unsafe deletion/reorder while tasks exist or require explicit task migration, and snapshot historic labels.
- Drag/drop can be inaccessible or accidental: choose keyboard-accessible controls and announce/currently confirm the target; server still enforces valid transition order.
- Custom fields can expand scope: support a bounded set of types and validation rules; avoid a generic workflow builder.
- Current project may include local test data and local JSON files: ensure runtime/user data and secrets are excluded from public submission.

## Implementation phases (subject to Checkpoint 2 approval)

1. Confirm customization decision and baseline behavior; establish requirements/plan.
2. Break work into dependency-ordered tasks and definitions of done.
3. Add Mongo configuration, models, repositories, services, and transactional tests.
4. Refactor backend route modules and expose OpenAPI/Scalar.
5. Refactor frontend components; add actor UX, last-updated actor, Kanban, and customization UI.
6. Add and run backend, component, and Playwright suites; fix failures.
7. Update README/API docs/agent log and perform a full requirement-to-test review.

## Checkpoint state

Checkpoint 1 and Checkpoint 2 approved. Checkpoint 3 implementation is active. The Atlas cloud connection is configured from the backend environment; live cloud connection remains unverified because no Atlas test URI is configured here. Customization scope remains open; T-010 is gated on that decision.
