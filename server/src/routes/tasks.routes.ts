import { Router } from 'express';
import type { TaskEventBus } from '../realtime/event-bus.js';
import type { TaskService } from '../task-service.js';

export function createTaskRouter(service: TaskService, eventBus: TaskEventBus) {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await service.list());
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const task = await service.create(req.body?.title, req.body?.description);
      await eventBus.publish({ type: 'task.created', taskId: task.id });
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id/status', async (req, res, next) => {
    try {
      const result = await service.changeStatus(req.params.id, req.body?.status, req.body?.actor);
      if (!result.changed) return res.status(204).end();
      await eventBus.publish({ type: 'task.status_changed', taskId: result.task.id });
      return res.json(result.task);
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      res.json(
        await service.edit(req.params.id, req.body?.title, req.body?.description, req.body?.actor),
      );
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await service.delete(req.params.id);
      await eventBus.publish({ type: 'task.deleted', taskId: req.params.id });
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
