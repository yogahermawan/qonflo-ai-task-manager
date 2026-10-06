import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

const mongo = 'mongodb://localhost:27017/qonflo?replicaSet=rs0';
const redis = 'redis://localhost:6379';

test('loads MongoDB, Redis, and default API settings', () => {
  assert.deepEqual(loadConfig({ MONGODB_URI: mongo, REDIS_URL: redis }), {
    port: 3001,
    mongoUri: mongo,
    mongoDatabase: 'qonflo',
    redisUrl: redis,
    allowRedisFallback: false,
    clientOrigin: 'http://localhost:5173',
  });
});

test('allows explicit settings and development Redis fallback', () => {
  assert.deepEqual(
    loadConfig({
      PORT: '4010',
      MONGODB_URI: 'mongodb://localhost:27017/?replicaSet=rs0',
      MONGODB_DB: 'tasks_dev',
      ALLOW_REDIS_FALLBACK: 'true',
      CLIENT_ORIGIN: 'http://localhost:4173',
    }),
    {
      port: 4010,
      mongoUri: 'mongodb://localhost:27017/?replicaSet=rs0',
      mongoDatabase: 'tasks_dev',
      redisUrl: undefined,
      allowRedisFallback: true,
      clientOrigin: 'http://localhost:4173',
    },
  );
});

test('rejects missing infrastructure configuration', () => {
  assert.throws(() => loadConfig({}), /MONGODB_URI is required/);
  assert.throws(
    () => loadConfig({ MONGODB_URI: 'http://localhost:27017', REDIS_URL: redis }),
    /must use mongodb/,
  );
  assert.throws(
    () => loadConfig({ MONGODB_URI: 'mongodb:///', REDIS_URL: redis }),
    /include a host/,
  );
  assert.throws(() => loadConfig({ MONGODB_URI: mongo }), /REDIS_URL is required/);
});

test('rejects invalid API ports', () => {
  for (const PORT of ['0', '-1', '65536', '3000x']) {
    assert.throws(
      () => loadConfig({ PORT, MONGODB_URI: mongo, REDIS_URL: redis }),
      /PORT must be an integer/,
    );
  }
});
