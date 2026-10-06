# Mini Task Manager

A focused internal task manager that makes every task-status change attributable and traceable.

## Run locally

Prerequisites: Node.js 20+ and a MongoDB Atlas cluster with a database user.

1. Copy server/.env.example to server/.env.
2. Replace MONGODB_URI with the connection string from Atlas. URL-encode any special characters in the database user's password.
3. Add the server's outbound IP address to the Atlas project's IP access list.
4. Run:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:3001`. MongoDB is accessed only by the server; the browser communicates with the API. Keep server/.env private and never commit it.

```bash
npm test       # backend tests
npm run build  # production builds for both applications
```

## Architecture

- `client`: React + TypeScript + Vite. It renders the task list, actor selector, status controls, and an expandable audit history.
- `server`: Express + TypeScript. Routes are thin; `TaskService` owns validation and the state transition/audit invariant. The server reads the Atlas URI from its environment.
- `data/tasks.json`: the existing JSON repository is being replaced by MongoDB in this implementation.

The API exposes `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id/status`, `DELETE /api/tasks/:id`, and `GET /api/tasks/:id/audit-logs`.

## Assumptions

- A task starts at `to_do`; the create form only asks for a title.
- Valid transitions are forward-only: `to_do -> pending -> in_progress -> done`. A request to its current status is accepted as a no-op and creates no audit entry.
- Actors are seeded into MongoDB and displayed by the UI. Authentication is intentionally outside this exercise's scope.
- Deleting a task removes it from the active task list but retains its audit history. Audit entries cannot be edited or deleted by any API.

## How the audit log is protected

There is no update or delete audit-log endpoint. The log type is readonly, the repository only appends a new record inside the same persistence operation that changes status, and the service never exposes a mutable audit-log command. The task update plus audit append use a MongoDB transaction.

## Trade-offs

MongoDB Atlas stores application data. Actor and initial board records are seed configuration stored in MongoDB; runtime task data is not embedded in frontend code. Actor selection is self-asserted because authentication is intentionally outside this exercise's scope.

For a larger system, I would first add authenticated actor identity and authorization, then optimistic concurrency (`version`/ETag), pagination, observability, and an outbox for downstream events.

## AI assistance

AI was used as a development assistant for scaffolding and copy review. The solution was validated by reading the generated code, running automated service/configuration tests, and running production builds. All design choices and submitted code can be explained by the author.

## API reference and browser tests

Start the API, then open http://localhost:3001/api/docs for the Scalar reference. The OpenAPI JSON is served from /api/openapi.json. The full endpoint contract is in docs/API.md.

Run browser tests with:

    npm run test:e2e

The Playwright suite uses mocked API responses to verify browser behavior without requiring access to an Atlas test database. Backend persistence and transaction tests need a separate non-production Atlas URI and remain pending.
