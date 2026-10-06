import assert from 'node:assert/strict';
import test from 'node:test';
import { DomainError } from '../src/domain.js';
import { MemoryTaskRepository } from '../src/repository.js';
import { TaskService } from '../src/task-service.js';

test('records one audit event for each valid next-step transition', async () => {
  const service = new TaskService(new MemoryTaskRepository(), () => '2026-10-06T00:00:00.000Z');
  const task = await service.create('Prepare invoice', 'Initial notes');

  const pending = await service.changeStatus(task.id, 'pending', 'john.doe');
  assert.equal(pending.task.status, 'pending');
  assert.equal(pending.task.updatedBy, 'john.doe');
  assert.equal((await service.logs(task.id)).length, 1);

  const progress = await service.changeStatus(task.id, 'in_progress', 'jane.smith');
  assert.equal(progress.task.status, 'in_progress');
  assert.equal((await service.logs(task.id)).length, 2);
});

test('rejects skipped and backward transitions', async () => {
  const service = new TaskService(new MemoryTaskRepository());
  const task = await service.create('Review PR');

  await assert.rejects(
    () => service.changeStatus(task.id, 'done', 'jane.smith'),
    (error: unknown) =>
      error instanceof DomainError &&
      error.code === 'INVALID_TRANSITION' &&
      error.message === 'Tasks must follow the defined status sequence.',
  );

  await service.changeStatus(task.id, 'pending', 'jane.smith');
  await assert.rejects(
    () => service.changeStatus(task.id, 'to_do', 'jane.smith'),
    (error: unknown) => error instanceof DomainError && error.code === 'INVALID_TRANSITION',
  );
});

test('keeps same-status updates as no-ops without audit records', async () => {
  const service = new TaskService(new MemoryTaskRepository());
  const task = await service.create('Review PR');
  const result = await service.changeStatus(task.id, 'to_do', 'jane.smith');

  assert.equal(result.changed, false);
  assert.equal((await service.logs(task.id)).length, 0);
});

test('edits title and description with audit attribution', async () => {
  const service = new TaskService(new MemoryTaskRepository(), () => '2026-10-06T01:00:00.000Z');
  const task = await service.create('Draft', '');
  const edited = await service.edit(task.id, 'Draft v2', 'More context', 'maria.garcia');

  assert.equal(edited.title, 'Draft v2');
  assert.equal(edited.description, 'More context');
  assert.equal(edited.updatedBy, 'maria.garcia');
  assert.equal((await service.logs(task.id))[0].action, 'edited');
});

test('validates task fields and actors', async () => {
  const service = new TaskService(new MemoryTaskRepository());
  const task = await service.create('Send proposal');

  await assert.rejects(
    () => service.create('   '),
    (error: unknown) => error instanceof DomainError,
  );
  await assert.rejects(
    () => service.create('x'.repeat(141)),
    (error: unknown) => error instanceof DomainError,
  );
  await assert.rejects(
    () => service.edit(task.id, 'Good', 42, 'john.doe'),
    (error: unknown) => error instanceof DomainError,
  );
  await assert.rejects(
    () => service.changeStatus(task.id, 'pending', 'unknown.user'),
    (error: unknown) => error instanceof DomainError,
  );
});

test('retains audit records when a task is deleted', async () => {
  const service = new TaskService(new MemoryTaskRepository());
  const task = await service.create('Send proposal');
  await service.changeStatus(task.id, 'pending', 'maria.garcia');
  await service.delete(task.id);

  assert.equal((await service.list()).length, 0);
  assert.equal((await service.logs(task.id)).length, 1);
});
