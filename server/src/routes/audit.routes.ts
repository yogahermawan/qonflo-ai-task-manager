import { Router } from 'express';
import type { TaskService } from '../task-service.js';

export function createAuditRouter(service: TaskService) {
  const router = Router();
  router.get('/tasks/:id/audit-logs', async (req, res, next) => {
    try {
      res.json(await service.logs(req.params.id));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
