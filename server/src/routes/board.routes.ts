import { Router } from 'express';
import type { TaskService } from '../task-service.js';

export function createBoardRouter(service: TaskService) {
  const router = Router();
  router.get('/', async (_request, response, next) => {
    try {
      response.json(await service.board());
    } catch (error) {
      next(error);
    }
  });
  return router;
}
