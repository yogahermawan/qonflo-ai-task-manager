import express from 'express';
import cors from 'cors';
import { TaskService } from './task-service.js';
import { errorHandler } from './middleware/error-handler.js';
import { createActorRouter } from './routes/actors.routes.js';
import { createAuditRouter } from './routes/audit.routes.js';
import { createBoardRouter } from './routes/board.routes.js';
import { createDocsRouter } from './routes/docs.routes.js';
import { createTaskRouter } from './routes/tasks.routes.js';

export function createApp(service: TaskService) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', createDocsRouter());
  app.use('/api/tasks', createTaskRouter(service));
  app.use('/api', createAuditRouter(service));
  app.use('/api/actors', createActorRouter(service));
  app.use('/api/board', createBoardRouter(service));
  app.use(errorHandler);
  return app;
}
