# API Contract

Base URL: http://localhost:3001. Authentication is out of scope. The actor ID supplied for task editing and moves is self-asserted attribution.

| Method | Path                      | Purpose                                           |
| ------ | ------------------------- | ------------------------------------------------- |
| GET    | /health                   | Health check                                      |
| GET    | /api/actors               | Active actor roster                               |
| GET    | /api/board                | The fixed, ordered workflow columns               |
| GET    | /api/tasks                | Active tasks with their audit history             |
| POST   | /api/tasks                | Create a task with title and optional description |
| PATCH  | /api/tasks/:id            | Edit title and description; actor required        |
| PATCH  | /api/tasks/:id/status     | Move to the immediate next status; actor required |
| DELETE | /api/tasks/:id            | Delete active task and retain audit history       |
| GET    | /api/tasks/:id/audit-logs | Immutable audit history, oldest first             |

Status sequence: to_do+�u���R pending �w^~)�v in_progress+�u���R done. The API returns 422 INVALID_TRANSITION for a skipped or backward move. Updating to the same status returns 204 and does not append an audit event or publish a Socket.IO update.

Task titles are trimmed and limited to 140 characters. Descriptions are optional and limited to 2,000 characters.

Scalar is at http://localhost:3001/api/docs. OpenAPI JSON is at http://localhost:3001/api/openapi.json.
