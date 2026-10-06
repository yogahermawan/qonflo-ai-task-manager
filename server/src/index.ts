import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { connectMongo } from './persistence/connect.js';
import { DevelopmentTaskEventBus, RedisTaskEventBus } from './realtime/event-bus.js';
import { createSocketServer } from './realtime/socket-server.js';
import { TaskService } from './task-service.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

const config = loadConfig(process.env);

try {
  const mongo = await connectMongo(config);
  const eventBus = config.redisUrl
    ? new RedisTaskEventBus(config.redisUrl)
    : new DevelopmentTaskEventBus();

  if (!config.redisUrl) {
    console.warn(
      'Redis development fallback is active; cross-instance realtime propagation is disabled.',
    );
  }

  const app = createApp(new TaskService(mongo.repository), eventBus);
  const server = createServer(app);
  const sockets = createSocketServer(server, config.clientOrigin);
  await eventBus.start((event) => sockets.broadcast(event));

  server.listen(config.port, () => console.log('API listening on port ' + config.port));

  const shutdown = () =>
    server.close(async () => {
      await Promise.all([mongo.client.close(), eventBus.close(), sockets.close()]);
    });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  const reason = error instanceof Error ? error.message : 'Unknown startup error';
  console.error('Unable to connect to MongoDB, Redis, or start the API: ' + reason);
  process.exitCode = 1;
}
