# Implementation Plan

## Decisions

- Keep the product focused: one shared fixed board, no authentication, roles, notifications, or dashboards.
- Enforce the required forward-only sequence in TaskService. The client provides immediate drag-and-drop feedback but cannot override the backend.
- Use MongoDB transactions for the task-status write and audit insertion.
- Require Redis in ordinary operation for cross-instance event propagation. ALLOW_REDIS_FALLBACK=true is an explicit development-only, in-process fallback.
- Use Socket.IO to notify clients, which reload their task list after task changes.

## Delivery checklist

- [x] MongoDB collections, validators, indexes, seed data, and transaction-backed repository
- [x] Redis Pub/Sub event bus and Socket.IO broadcast
- [x] Fixed forward-only Kanban board with invalid-drop message
- [x] Dockerfiles, Compose, and environment examples
- [x] Scalar/OpenAPI documentation
- [x] API, service, and Playwright coverage
- [x] README, API contract, and GCP deployment plan
