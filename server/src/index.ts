import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { connectMongo } from './persistence/connect.js';
import { TaskService } from './task-service.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

const config = loadConfig(process.env);

try {
  const mongo = await connectMongo(config);
  const app = createApp(new TaskService(mongo.repository));
  const server = app.listen(config.port, () => console.log('API listening on port ' + config.port));
  const shutdown = () => server.close(() => { void mongo.client.close(); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  const reason = error instanceof Error ? error.message : 'Unknown startup error';
  console.error('Unable to connect to MongoDB or start the API: ' + reason);
  process.exitCode = 1;
}
