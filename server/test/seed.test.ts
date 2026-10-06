import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBoardSeed } from '../src/persistence/seed.js';

test('normalizes the checked-in board seed timestamp to a BSON-compatible Date', () => {
  const board = normalizeBoardSeed({
    _id: 'default',
    name: 'Task board',
    columns: [],
    customFields: [],
    updatedAt: '2026-10-06T00:00:00.000Z',
  });
  assert.ok(board.updatedAt instanceof Date);
  assert.equal(board.updatedAt.toISOString(), '2026-10-06T00:00:00.000Z');
});

test('rejects invalid board seed timestamps', () => {
  assert.throws(
    () =>
      normalizeBoardSeed({
        _id: 'default',
        name: 'Task board',
        columns: [],
        customFields: [],
        updatedAt: 'not-a-date',
      }),
    /Invalid board seed updatedAt/,
  );
});
