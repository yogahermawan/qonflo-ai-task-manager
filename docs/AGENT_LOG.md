# Agent Log

## 2026-10-06 - T-001 MongoDB runtime configuration

- Added the official MongoDB Node driver and dotenv to the server workspace.
- Added server-only environment parsing for Mongo URI, database name, and port; server entry point connects and pings Mongo before listening, and closes the client on shutdown.
- Added server/.env.example and compose.yaml for a local Mongo replica set; ignored local .env files while allowing the example.
- Kept the JSON repository temporarily wired until T-002 replaces it; Mongo is checked at startup but is not yet the task persistence backend.
- Tests: npm test passed (7 tests); npm run build passed for server and client; docker compose config --quiet passed.
- Blocker: docker compose up --wait could not run because Docker Desktop Linux engine pipe was unavailable. Local replica-set startup was not verified; this is no longer required after the cloud target was confirmed.
- Open decision: board customization scope is still unconfirmed; T-010 remains gated.

## 2026-10-06 - T-002 Mongo persistence foundation

- Added typed Mongo collections for actors, boards, tasks, and audit events, JSON Schema validators, and query indexes.
- Added first-run seed data for the initial actor roster and default ordered board; seeding uses set-on-insert so later database edits are preserved.
- Added targeted repository methods, transaction wrapper, and idempotent legacy JSON import command.
- Deviation: T-002 originally said all runtime reads/writes switch here. Kept service wiring for T-003 instead because status mutation and audit append need a targeted transaction; a full-store adapter would permit lost writes under concurrent instances.
- Tests: npm test passed (12 tests); npm run build passed for server and client.
- Live Mongo repository/transaction integration remains unverified until a Mongo replica set is reachable.

## 2026-10-06 - MongoDB Cloud target clarified

- User confirmed the application uses MongoDB Cloud/Atlas, not a local Mongo service.
- Updated README and server/.env.example to use an Atlas mongodb+srv URI; removed the local Docker Compose Mongo service.
- Updated planning/test notes: cloud access is server-only; Atlas requires a database user and the backend network/IP to be allowed. Integration tests must use a dedicated non-production Atlas database, never a production database.
- The MongoDB driver accepts the mongodb+srv format. Atlas is suitable for the planned transaction provided the selected deployment supports multi-document transactions.
- No Atlas credentials were requested or stored. Live connection remains unverified until the user configures the URI privately in server/.env or an isolated test environment.

## 2026-10-06 - T-003 through T-009 partial implementation

- Switched production server wiring to MongoRepository through TaskService. Status update uses a transaction, compare-and-set status write, and one appended audit event. The actor, title and status labels are snapshotted in audit events.
- Split API handling into task, actor, audit, board-read, and documentation route modules with one shared error handler. GET /api/actors and GET /api/board read persisted Mongo data for the UI.
- Added OpenAPI 3.1 document and Scalar at /api/docs; docs/API.md records the current public contract.
- Split the client into typed API client, types, actor picker, task form, Kanban board/column/card, and audit-history components. The actor picker is an accessible radio group and the board supports dnd-kit pointer/keyboard drag sensors plus button fallback for keyboard users.
- Added API tests for route behavior and Playwright browser tests with HTTP fixtures. Results: backend unit/API tests 18/18 passed; production build passed; Playwright 2/2 passed.
- Live Atlas integration/transaction tests remain unverified without a dedicated non-production Atlas URI. The board/task customization write API and UI remain blocked on the pending customization-scope decision.

## 2026-10-06 - Startup environment-path correction

- Fixed server startup to load server/.env relative to the server entry file. dotenv previously resolved from the workspace root when using npm run dev, leaving MONGODB_URI unavailable even though server/.env existed.
- Startup now surfaces the safe Mongo connection failure message after configuration loads, so Atlas DNS, access-list, user, or permission failures are distinguishable from a missing environment variable.
- Verified server/.env has set values, uses mongodb+srv, and contains no template placeholder. Backend tests (18/18) and production builds pass. Live Atlas startup still awaits successful Atlas connectivity.

## 2026-10-06 - Shared board customization and editable tasks

- User chose free task movement among all configured board steps. Removed immediate-next-column enforcement while retaining no-op behavior for the current column.
- Added shared board-step create, rename, reorder, and delete APIs. Delete rejects a populated step and a final remaining step.
- Added task description and task-edit API. Edits update attribution and append an audit event.
- Reworked compact Kanban interaction: the full card is draggable without a Drag label; edit/history/delete controls stop drag activation. The history drawer shows the five newest events.
- Tests: backend 19/19 passed; build passed; Playwright 2/2 passed.

## 2026-10-06 - Atlas status-move validation fix

- Fixed MongoDB audit-event insertion for status moves. Optional details was serialized by the driver as null, which violates the collection validator that accepts a string when details exists.
- Status events now omit details entirely; edit events continue to persist a string detail.
- Reproduced the reported task status endpoint failure against Atlas, then verified 200 responses on isolated port 3002 and the running port 3001 service. Backend tests 19/19 and build pass.
