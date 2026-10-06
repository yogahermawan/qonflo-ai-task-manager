import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import type { TaskChangeEvent, TaskEventBus } from '../src/realtime/event-bus.js';
import { MemoryTaskRepository } from '../src/repository.js';
import { TaskService } from '../src/task-service.js';

class RecordingEventBus implements TaskEventBus {
  readonly events: TaskChangeEvent[] = [];
  async start(): Promise<void> {}
  async close(): Promise<void> {}
  async publish(event: TaskChangeEvent): Promise<void> {
    this.events.push(event);
  }
}

async function withApi(
  run: (
    request: (path: string, init?: RequestInit) => Promise<Response>,
    events: RecordingEventBus,
  ) => Promise<void>,
) {
  const events = new RecordingEventBus();
  const app = createApp(
    new TaskService(new MemoryTaskRepository(), () => '2026-10-06T10:00:00.000Z'),
    events,
  );
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    await run((path, init) => fetch('http://127.0.0.1:' + port + path, init), events);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

async function json(response: Response) {
  return response.json() as Promise<{
    error?: string;
    message?: string;
    id?: string;
    status?: string;
    updatedBy?: string;
  }>;
}

const jsonRequest = (body: unknown): RequestInit => ({
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

test('API creates, moves, and publishes only real task changes', async () => {
  await withApi(async (request, events) => {
    const created = await request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Prepare report' }),
    });
    assert.equal(created.status, 201);
    const task = await json(created);
    assert.equal(task.status, 'to_do');
    assert.ok(task.id);
    assert.deepEqual(events.events, [{ type: 'task.created', taskId: task.id }]);

    const moved = await request(
      '/api/tasks/' + task.id + '/status',
      jsonRequest({ status: 'pending', actor: 'jane.smith' }),
    );
    assert.equal(moved.status, 200);
    assert.equal((await json(moved)).updatedBy, 'jane.smith');
    assert.equal(events.events.length, 2);
    assert.equal(events.events[1]?.type, 'task.status_changed');

    const noOp = await request(
      '/api/tasks/' + task.id + '/status',
      jsonRequest({ status: 'pending', actor: 'jane.smith' }),
    );
    assert.equal(noOp.status, 204);
    assert.equal(events.events.length, 2);

    const logs = await request('/api/tasks/' + task.id + '/audit-logs');
    const history = (await logs.json()) as Array<{
      actor: string;
      fromStatus: string;
      toStatus: string;
    }>;
    assert.deepEqual(
      history.map(({ actor, fromStatus, toStatus }) => ({ actor, fromStatus, toStatus })),
      [{ actor: 'jane.smith', fromStatus: 'to_do', toStatus: 'pending' }],
    );
  });
});

test('API rejects invalid input and skipped transitions', async () => {
  await withApi(async (request) => {
    const blank = await request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    assert.equal(blank.status, 422);
    assert.equal((await json(blank)).error, 'INVALID_TITLE');

    const malformed = await request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });
    assert.equal(malformed.status, 400);

    const created = await request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Task' }),
    });
    const task = await json(created);
    const skipped = await request(
      '/api/tasks/' + task.id + '/status',
      jsonRequest({ status: 'done', actor: 'john.doe' }),
    );
    assert.equal(skipped.status, 422);
    assert.equal((await json(skipped)).error, 'INVALID_TRANSITION');
  });
});

test('deleting a task emits an event and leaves audit logs available', async () => {
  await withApi(async (request, events) => {
    const created = await request('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Keep history' }),
    });
    const task = await json(created);
    await request(
      '/api/tasks/' + task.id + '/status',
      jsonRequest({ status: 'pending', actor: 'john.doe' }),
    );

    const deleted = await request('/api/tasks/' + task.id, { method: 'DELETE' });
    assert.equal(deleted.status, 204);
    assert.equal(events.events.at(-1)?.type, 'task.deleted');

    const logs = await request('/api/tasks/' + task.id + '/audit-logs');
    assert.equal(((await logs.json()) as unknown[]).length, 1);
  });
});
