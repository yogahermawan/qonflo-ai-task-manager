# API Contract

Base URL: http://localhost:3001. Authentication is out of scope. An actor ID is required for task edits and status moves, and represents self-asserted attribution.

| Method | Path                      | Purpose                                          |
| ------ | ------------------------- | ------------------------------------------------ |
| GET    | /health                   | Health check                                     |
| GET    | /api/actors               | Active actor roster                              |
| GET    | /api/board                | Shared board and ordered columns                 |
| POST   | /api/board/columns        | Add a step with name                             |
| PATCH  | /api/board/columns/order  | Reorder all columns with columnIds               |
| PATCH  | /api/board/columns/:id    | Rename a step                                    |
| DELETE | /api/board/columns/:id    | Delete an empty non-final step                   |
| GET    | /api/tasks                | Tasks with audit history                         |
| POST   | /api/tasks                | Create task with title and optional description  |
| PATCH  | /api/tasks/:id            | Edit title and description; actor required       |
| PATCH  | /api/tasks/:id/status     | Move a task to any existing step; actor required |
| DELETE | /api/tasks/:id            | Delete active task, retaining audit history      |
| GET    | /api/tasks/:id/audit-logs | Immutable audit events oldest first              |

Task title is trimmed and limited to 140 characters. Description is optional and limited to 2,000 characters. A no-op move to the current column returns 204 and does not create history.

A task may be moved to any current board column. Every actual move and task edit appends an audit event. The UI shows the five newest events. A populated column cannot be deleted; move its tasks first. The final remaining column cannot be deleted.

Scalar is served at http://localhost:3001/api/docs and OpenAPI JSON at http://localhost:3001/api/openapi.json.
