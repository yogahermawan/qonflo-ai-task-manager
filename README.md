# Mini Task Manager

A focused internal task manager that makes every task-status change attributable and traceable.

## Run locally

Prerequisite: Node.js 20+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:3001`.

```bash
npm test       # backend TaskService tests
npm run build  # production builds for both applications
```

## Architecture

- `client`: React + TypeScript + Vite. It renders the task list, actor selector, status controls, and an expandable audit history.
- `server`: Express + TypeScript. Routes are thin; `TaskService` owns validation and the state transition/audit invariant.
- `data/tasks.json`: a deliberately small JSON repository. Task records and append-only audit records are stored separately; writes use a temporary file then rename, avoiding a partially-written file on a normal process interruption.

The API exposes `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id/status`, `DELETE /api/tasks/:id`, and `GET /api/tasks/:id/audit-logs`.

## Assumptions

- A task starts at `to_do`; the create form only asks for a title.
- Valid transitions are forward-only: `to_do → pending → in_progress → done`. A request to its current status is accepted as a no-op and creates no audit entry.
- Actors are the predefined users shown in the UI. Authentication is intentionally outside this exercise's scope.
- Deleting a task removes it from the active task list but retains its audit history. Audit entries cannot be edited or deleted by any API.

## How the audit log is protected

There is no update or delete audit-log endpoint. The log type is readonly, the repository only appends a new record inside the same persistence operation that changes status, and the service never exposes a mutable audit-log command. In a production system I would strengthen this with a database transaction, append-only permissions, and separate audit storage/retention policies.

## Trade-offs

JSON persistence keeps setup and review friction low, but it is not appropriate for concurrent multi-instance writes. The server also uses a single process-local mutation queue to serialize writes; that protects one Node process, not a fleet. I chose this so the important domain behavior remains easy to inspect.

For a larger system, I would first replace the repository with PostgreSQL and perform the task update plus audit insert in one database transaction. Next would be authentication/actor identity, optimistic concurrency (`version`/ETag), pagination, observability, and an outbox for downstream events.

## AI assistance

AI was used as a development assistant for scaffolding and copy review. The solution was validated by reading the generated code, manually exercising create/transition/no-op/invalid-transition flows, running the service tests, and running production builds. All design choices and submitted code can be explained by the author.
