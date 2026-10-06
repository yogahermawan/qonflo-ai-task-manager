# Agent Log

## 2026-10-07 - Realtime, container, and workflow delivery

- Replaced production JSON persistence with MongoDB collections for tasks and audit events. Status writes and audit inserts run in one MongoDB transaction.
- Added Redis Pub/Sub and Socket.IO. Redis is required unless ALLOW_REDIS_FALLBACK=true is explicitly set for isolated development; that fallback warns and only reaches the current process.
- Added Dockerfiles and docker-compose.yml for React/nginx, Express, a MongoDB replica set, and Redis.
- Restored the required fixed four-step workflow. The backend rejects skipped and backward transitions; client drag/drop keeps invalid cards at their origin and shows+ßuÁ‚ùÁ\Tasks must follow the defined status sequence.È›y¯ßy›
- Removed configurable column APIs and UI so the implementation matches the fixed workflow scope.
- Added/updated tests for transition audit logs, idempotent status changes with no event, invalid transitions, and retained audit logs after deletion.
- Verification in this session: npm test passed (18 tests), npm run build passed. Playwright and Docker Compose validation remain in the final verification sequence.
