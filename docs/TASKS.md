# Task Breakdown

## Completed

| Task | Outcome |
| --- | --- |
| MongoDB persistence | Tasks and audit logs are separate validated collections, with indexes and seeded actors/board. |
| Workflow service | The service allows only the immediate next fixed status and writes an audit event in the same transaction. |
| API and docs | Express routes are separated by domain; Scalar and OpenAPI document the contract. |
| Frontend | File-based React components provide compact Kanban drag/drop, editing, actor selection, and five-entry history. |
| Realtime | Redis Pub/Sub carries task changes between API instances; Socket.IO tells clients to refresh. |
| Docker | Compose creates client, API, Redis, and a MongoDB replica set. |
| Verification | Server tests, build, Playwright, format, and Compose configuration run before commit. |

## Deliberate boundaries

- The four workflow columns are fixed to preserve the required state machine.
- Authentication is excluded. The selected actor is audit attribution.
- The old JSON importer remains a one-time migration utility only; production reads and writes use MongoDB.
- Atlas or another replica-set-capable Mongo deployment is required for status/audit transactions.
