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

    React + Vite+�u���@�w^~)�tHTTP / Socket.IK�u���@�w^~)�t> Express API 5�@��5����(��������������������������������������������y��y�(�������������������������������������������ן�w�P֍&VF�2V"�7V"�w^~)�t�u���C��F�W"���7F�6W0�����&V7B�G�U67&�B���6����f��R�&6VB6����V�G2f�"F�R&�&B�6��V��2�6&G2�f�&�2�7F�"�6�W"��BVF�B��7F�'�����W�&W72�G�U67&�B���&�WFW2FV�VvFR��WBfƖFF����Bv�&�f��r'V�W2F�F6�6W'f�6R�������v�D"���6W&FRF6�2�BVF�DWfV�G26���V7F���2�v�F�6���V7F���fƖFF�'2�B��FW�W2�7FGW2WFFR�BVF�B��6W'B'V�����RG&�67F�������&VF�2V"�7V"���V&Ɨ6�W2F6��6��vRWfV�G26�V6����7F�6R6�'&�F67BF�V�F��G2�v�6�6�WB��6ƖV�G2����6�6�WB�򢣢6ƖV�G2&V6V�fRF6��6��vVB�B&V��BF�V�"F6�Ɨ7B�6�R�7FGW2����2V֗B��WfV�Bࠤ���v�D"G&�67F���2&WV�&R&WƖ66WB�F�2FW����V�G27W�'BF�VӲ7F�F���R��6����v�D"6W'fW"F�W2��B�F�R6���6R7F6�6��f�wW&W26��v�R���FR&WƖ66WBࠢ22v�&�f��r�BVF�B'V�W0��F6�&Vv��2����F�F��F�R��ǒfƖBG&�6�F���2&S���F�F�w^~)�u"V�F��r�u���b��&�w&W72�w^~)�u"F��P��G&���r6&B��F���F�W"6��V���VfW2�B���6R�B6��w3�F6�2�W7Bf����rF�RFVf��VB7FGW26WVV�6R�F�R&6�V�BƖW2F�R6�R'V�R�6�F�&V7B�6��26���B'�72�Bࠤ&WVW7BF�F�R7W'&V�B7FGW2&WGW&�2#B��6��FV�B�w&�FW2��VF�B&V6�&B��BV֗G2��&V��F��RWfV�B�VF�B��w2&RV�B���ǒF�&�Vv�F�RV&Ɩ2��FV�WF��rF6�F�W2��BFV�WFR�G2��w2ࠢ22FW7F��r�BVƗG�6�V6�0����FW7@���'V�'V��@���'V�FW7C�S&P�F�6�W"6���6R6��f�p��FW7G26�fW"fƖBG&�6�F���2��FV��FV�B��fW2v�F��WB�WfV�B�6��VB�&6�v&B&V�V7F���2�&W6W'fVBVF�B��w2gFW"FV�WF������WBfƖFF����6��f�wW&F�����B'&�w6W"G&r�G&�&V�f��"ࠢ22���F�R�V��F�7V�V�B�26W'fVBB����V���6��66�"�26W'fVBB���F�72�6VR�F�72����E҆F�72����B�f�"F�RV�G���B7V��'�ࠢ2277V�F���2�BG&FR��fg0���F�R7F��r�2�6�W"7WƖW26V�b�76W'FVBGG&�'WF����WF�V�F�6F����BWF��&��F���&RFVƖ&W&FVǒ�WG6�FRF��2F�Rֆ��R66�R��&VF�2�2&WV�&VB����&���W&F���&V6W6R����V��'�'&�F67F��rv�V�B��B7��6�&�旦R6W&FR�&�6W76W2��&VF�2V"�7V"�2W�V�W&��&�GV7F���7�7FV�F�B�VVG2wV&�FVVBF�v�7G&V�FVƗfW'�v�V�BW6R��WF&���BGW&&�R6��7V�W"��F6�7&VF����BFV�WF���V&Ɨ6�gFW"F�RFF&6Rw&�FR�7FGW26��vW2V&Ɨ6���ǒgFW"F�RG&�67F���7V66VVG2��F�R&�&B�2F�Rf�W"f��VBv�&�f��r7FGW6W2&WV�&VB'�F�RW�W&6�6R��VW��r�Bf��VB��W2F�RG&�6�F���'V�RW�Ɩ6�B�BV7�F�W����ࠢ22t5FW����V�B�ࠥF��2&W�6�F�'��2��FW����V�B�&VG��B��6�VFW2t5FW����V�B���'WB�2��B7W'&V�FǒFW���VBF�t5���F�W&R�2��ƗfRt5U$�ࠣ�'V��BF�R6W'fW"�B6ƖV�B��vW2v�F�6��VB'V��B�B7F�&RF�V���'F�f7B&Vv�7G'��"�'V�F�R���6��VB'V��6WB���t�D%�U$��$TD�5�U$���B4ĔT�E��$�t��W6��r6V7&WB��vW#�w&�BF�R6��VB'V�6W'f�6R66�V�B6V7&WB66W72�2���7BF�R7FF�26ƖV�B��6��VB'V�&V���B�v���"6��VB7F�&vRv�F���B&��6W"�6��f�wW&VBF�&�����B6�6�WB��G&ff�2F�F�R�6W'f�6R�B�W6R���v�D"F�2v�F��WGv�&�66W72&W7G&�7FVBF�F�RFW����V�BF���"��vVB���v��6��F�&�R6W'f�6R6V�V7FVB'�F�R�&v旦F����W6R&WƖ6�6WB�6&�RF����w�f�"G&�67F���2�R�W6R�V��'�7F�&Rf�"&VF�2�B6���V7B6��VB'V�F�&�Vv�e26���V7F�"�6��f�wW&R֖���7F�6W2�"6�6�WB���6��F�&�R6���V7F���&�WF��rf�"F�RFW6�&VB&V�F��R&V�f��"�b�FB6��VB���F�&��r�V�F�6�V6�2�7G'V7GW&VB��w2��B4�6����G2f�"FW7G2�B��vR'V��G2&Vf�&R&�GV7F���&���F���ࠢ22�76�7F�6P���v2W6VB2FWfV���V�B76�7F�B�F�R6�FR�v�&�f��r'V�W2�G&FR��fg2��BfW&�f�6F���6����G2&R��FV�FVBF�&RW����&�R'�F�RWF��"�

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
