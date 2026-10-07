# Qonflo Mini Task Manager

A small React and Express task board with an auditable, forward-only workflow.

## What it does

- Create, list, edit, and delete tasks.
- Move a task only through to_do -> pending -> in_progress -> done.
- Reject skipped and backward moves on the API and in the drag-and-drop UI.
- Record each real status change in an immutable audit collection with actor, source, destination, and timestamp.
- Keep audit history after deleting the task.
- Synchronize connected clients after task creation, deletion, and real status changes.

The browser only talks to the API. MongoDB and Redis credentials are server-side environment variables.

## Local setup

Prerequisites: Node.js 20+, MongoDB configured as a replica set (MongoDB Atlas supports this), and Redis.

1. Run npm install.
2. Copy server/.env.example to server/.env, then set a private Atlas or replica-set MONGODB_URI and a reachable REDIS_URL.
3. Start Redis and MongoDB, then run npm run dev.

Open http://localhost:5173. The API is at http://localhost:3001, Scalar is at http://localhost:3001/api/docs.

Redis is required by default. For an isolated development session only, set ALLOW_REDIS_FALLBACK=true. That fallback is logged clearly and provides in-process events only, so it does not propagate across API instances.

### Docker Compose

Docker Compose starts the client, API, MongoDB replica set, and Redis:

    docker compose up --build

Open http://localhost:5173. Stop services with docker compose down. Add -v only when intentionally removing local database volumes.

## Architecture

```text
React + Vite client
  ├── HTTP API requests ───────────────► Express API
  └── Socket.IO updates ◄────────────── Express API
                                             ├── MongoDB: tasks and immutable audit logs
                                             └── Redis Pub/Sub: task-change events
```

- The client sends task commands to the Express API over HTTP.
- The API validates status transitions and writes task/audit data to MongoDB.
- The API publishes real task changes through Redis Pub/Sub.
- The API broadcasts those events to connected clients through Socket.IO.
2. Di awal tertulis **“Create, list, edit, and delete tasks.”**  
Kalau yang bisa diubah hanya status, ganti menjadi:

```md
- Create, list, delete, and move tasks through the defined status flow.
```

## Local realtime verification

Use one terminal from the repository root:

    npm run dev

This starts the Express API and Vite client together. The API must print API listening on port <PORT> before the browser can load tasks or connect Socket.IO.

To confirm realtime behavior, open the client URL in two browser windows. Create a task, move it through a valid next status, or delete it in the first window. The second window refreshes its task list without a manual browser reload.

Task edits do not currently publish a realtime event. The scoped realtime events are task creation, deletion, and valid status changes. A same-status update does not create an audit event or broadcast an event.

To observe the Redis publication directly when the local container is named qonflo-redis:

    docker exec -it qonflo-redis redis-cli SUBSCRIBE qonflo:task-changes

Then create, move, or delete a task. Redis displays the corresponding JSON event.

## Windows port troubleshooting

Some Windows and WSL configurations reserve local port ranges. If the API exits with EACCES while binding the default port 3001, choose a port outside the excluded range, such as 4001.

Set the same port in both local environment files, then stop and restart npm run dev:

    server/.env
    PORT=4001

    client/.env
    VITE_API_PROXY_TARGET=http://127.0.0.1:4001

Check reserved ranges with:

    netsh interface ipv4 show excludedportrange protocol=tcp

Keep VITE_API_BASE_URL empty for local Vite proxying. The client defaults to port 5173; stop older Vite processes if it switches to port 5174.

## GCP status
The repository contains Docker deployment assets and a GCP deployment plan, but it is not deployed to GCP and does not have a live GCP URL. Completing the plan requires access to a GCP project, billing, Artifact Registry, Cloud Run, Secret Manager, a VPC connector, and Memorystore, plus MongoDB network access configuration. These cloud resources and credentials are not part of this repository, so the deployment is intentionally left as documented infrastructure work.

## Assumptions
- A new task always starts with the `to_do` status.
- Actors come from a predefined list because authentication is outside this task's scope.
- Deleting a task removes it from the active board, but its audit history remains available in the audit collection.
- Redis is required for normal multi-instance event propagation. The documented local fallback is only for isolated development.

## Trade-offs
I used MongoDB, Redis Pub/Sub, and Socket.IO to demonstrate the requested stack and real-time flow. This adds more setup than file-based storage, but makes the data model and event flow closer to a production service.

Redis Pub/Sub is used for live event propagation, not durable event storage. If an API instance is offline, it will not replay missed Pub/Sub messages. A production system that requires guaranteed delivery would use a durable event mechanism or an outbox pattern.

## How audit logs are protected
Audit logs have no update or delete endpoint. The backend only creates a new audit record after a valid status transition, and task deletion does not delete related audit records. The task status update and audit-log insertion are handled together so the two records stay consistent.

## Main risk at larger scale
The main risk is database query and real-time fan-out volume as the number of tasks, audit logs, and connected clients grows. I would add database indexes, pagination for task and audit-log queries, and room-based Socket.IO broadcasts.

## First refactor for a larger system
I would first separate the domain layer from infrastructure concerns more clearly: task commands, MongoDB persistence, Redis events, and Socket.IO delivery. This would make it easier to scale API instances, replace infrastructure components, and introduce a durable event/outbox pattern later.

## If I had more time
I would add authentication, authorization, pagination, end-to-end browser tests, structured logging and metrics, and a durable event-delivery strategy.

## AI assistance
AI tools were used as development assistance for implementation and review. I reviewed the code, validated the behavior manually, ran the automated tests, and ran production builds before submission.
