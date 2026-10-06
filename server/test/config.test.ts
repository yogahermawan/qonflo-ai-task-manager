import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

test('loads MongoDB settings and default API port from the server environment', () => {
  assert.deepEqual(loadConfig({ MONGODB_URI: 'mongodb://localhost:27017/qonflo?replicaSet=rs0' }), {
    port: 3001,
    mongoUri: 'mongodb://localhost:27017/qonflo?replicaSet=rs0',
    mongoDatabase: 'qonflo',
  });
});

test('allows explicit port and database name', () => {
  assert.deepEqual(
    loadConfig({
      PORT: '4010',
      MONGODB_URI: 'mongodb://localhost:27017/?replicaSet=rs0',
      MONGODB_DB: 'tasks_dev',
    }),
    {
      port: 4010,
      mongoUri: 'mongodb://localhost:27017/?replicaSet=rs0',
      mongoDatabase: 'tasks_dev',
    },
  );
});

test('rejects a missing or invalid MongoDB URI', () => {
  assert.throws(() => loadConfig({}), /MONGODB_URI is required/);
  assert.throws(() => loadConfig({ MONGODB_URI: 'http://localhost:27017' }), /must use mongodb/);
  assert.throws(() => loadConfig({ MONGODB_URI: 'mongodb:///' }), /include a host/);
});

test('rejects invalid API ports', () => {
  for (const PORT of ['0', '-1', '65536', '3000x']) {
    assert.throws(
      () => loadConfig({ PORT, MONGODB_URI: 'mongodb://localhost/qonflo' }),
      /PORT must be an integer/,
    );
  }
});
