# Requirements and Acceptance Criteria

| ID      | Requirement           | Acceptance criteria                                                                                                       | Verification                                        |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| REQ-001 | MongoDB persistence   | Tasks and audit events use separate collections; audit logs survive task deletion.                                        | Unit/API tests and Mongo collection schema tests    |
| REQ-002 | Fixed status workflow | Only to_do+�u���R pending �w^~)�v in_progress+�u���R done is accepted; skipped/backward moves return INVALID_TRANSITION.  | Service and API tests; Playwright invalid-drop test |
| REQ-003 | Immutable audit       | Every real status update creates one event with task, actor, from/to statuses, and time. Same-status updates create none. | Service/API tests                                   |
| REQ-004 | Clear attribution     | Actor picker is accessible; task cards show last updater; history shows the latest five entries.                          | API and Playwright tests                            |
| REQ-005 | Realtime flow         | Create, delete, and real status changes publish through Redis and Socket.IO; same-status updates emit none.               | API event-bus test                                  |
| REQ-006 | Docker readiness      | Compose starts client, API, Mongo replica set, and Redis using environment configuration.                                 | docker compose config                               |
| REQ-007 | Maintainable code     | Frontend uses small components and backend routes are separated by domain.                                                | TypeScript production build                         |
| REQ-008 | API documentation     | OpenAPI and Scalar describe the public API.                                                                               | /api/openapi.json and /api/docs                     |
