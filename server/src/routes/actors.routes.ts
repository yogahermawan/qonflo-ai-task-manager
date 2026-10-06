import { Router } from 'express';
import type { TaskService } from '../task-service.js';

export function createActorRouter(service: TaskService) {
  const router = Router();
  router.get('/', async (_req, res, next) => {
    try {
      const actors = await service.actors();
      res.json(actors.map(({ _id, handle, displayName }) => ({ id: _id, handle, displayName })));
    } catch (error) {
      next(error);
    }
  });
  return router;
}
