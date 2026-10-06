import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { MemoryTaskRepository } from '../src/repository.js';
import { TaskService } from '../src/task-service.js';

async function withApi(run: (request: (path: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
  const app = createApp(new TaskService(new MemoryTaskRepository(), () => '2026-10-06T10:00:00.000Z'));
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    await run((path, init) => fetch('http://127.0.0.1:' + port + path, init));
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

async function json(response: Response) {
  return response.json() as Promise<{ error?: string; message?: string; id?: string; status?: string; updatedBy?: string }>;
}

test('API lists persisted actors and creates then updates a task', async () => {
  await withApi(async request => {
    const actors = await request('/api/actors');
    assert.equal(actors.status, 200);
    assert.equal((await actors.json() as unknown[]).length, 3);
    const created = await request('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '  Prepare report  ' }) });
    assert.equal(created.status, 201);
    const task = await json(created);
    assert.equal(task.status, 'to_do');
    assert.ok(task.id);
    const moved = await request('/api/tasks/' + task.id + '/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'pending', actor: 'jane.smith' }) });
    assert.equal(moved.status, 200);
    assert.equal((await json(moved)).updatedBy, 'jane.smith');
    const logs = await request('/api/tasks/' + task.id + '/audit-logs');
    assert.equal(logs.status, 200);
    const history = await logs.json() as Array<{ actor: string; fromStatus: string; toStatus: string; taskTitle: string }>;
    assert.equal(history.length, 1);
    assert.equal(history[0].actor, 'jane.smith');
    assert.equal(history[0].fromStatus, 'to_do');
    assert.equal(history[0].toStatus, 'pending');
    assert.equal(history[0].taskTitle, 'Prepare report');
  });
});

test('API rejects invalid inputs, malformed JSON, skipped moves, and keeps no-op body empty', async () => {
  await withApi(async request => {
    const blank = await request('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '   ' }) });
    assert.equal(blank.status, 422);
    assert.equal((await json(blank)).error, 'INVALID_TITLE');
    const invalidJson = await request('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
    assert.equal(invalidJson.status, 400);
    assert.equal((await json(invalidJson)).error, 'INVALID_JSON');
    const created = await request('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Task' }) });
    const task = await json(created);
    const skipped = await request('/api/tasks/' + task.id + '/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'done', actor: 'john.doe' }) });
    assert.equal(skipped.status, 200);
    assert.equal((await json(skipped)).status, 'done');
    const noOp = await request('/api/tasks/' + task.id + '/status', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'done', actor: 'john.doe' }) });
    assert.equal(noOp.status, 204);
    assert.equal(await noOp.text(), '');
  });
});

test('API returns not found on deletion and preserves the endpoint contract', async () => {
  await withApi(async request => {
    const deleted = await request('/api/tasks/no-such-task', { method: 'DELETE' });
    assert.equal(deleted.status, 404);
    assert.equal((await json(deleted)).error, 'NOT_FOUND');
  });
});
