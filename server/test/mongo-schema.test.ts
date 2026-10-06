import assert from 'node:assert/strict';
import test from 'node:test';
import { COLLECTIONS, COLLECTION_VALIDATORS } from '../src/persistence/mongo-schema.js';

test('defines validators for every persisted entity collection', () => {
  assert.deepEqual(Object.keys(COLLECTION_VALIDATORS).sort(), [
    'actors',
    'auditEvents',
    'boards',
    'tasks',
  ]);
  assert.deepEqual(Object.values(COLLECTIONS).sort(), ['actors', 'auditEvents', 'boards', 'tasks']);
});

test('task validator requires persisted board, status, timestamps, and updater fields', () => {
  const required = COLLECTION_VALIDATORS.tasks.$jsonSchema.required as string[];
  assert.deepEqual(required, [
    '_id',
    'boardId',
    'title',
    'statusId',
    'customValues',
    'createdAt',
    'updatedAt',
    'updatedBy',
  ]);
});

test('audit validator includes actor and immutable from/to status snapshots', () => {
  const required = COLLECTION_VALIDATORS.auditEvents.$jsonSchema.required as string[];
  for (const field of [
    'taskId',
    'taskTitle',
    'actorId',
    'actorHandle',
    'fromStatusId',
    'fromStatusLabel',
    'toStatusId',
    'toStatusLabel',
    'createdAt',
  ]) {
    assert.ok(required.includes(field), 'missing ' + field);
  }
});
