import { Router } from 'express';
import type { TaskService } from '../task-service.js';
export function createTaskRouter(service: TaskService) {
  const r = Router();
  r.get('/', async (_q, s, n) => {
    try {
      s.json(await service.list());
    } catch (e) {
      n(e);
    }
  });
  r.post('/', async (q, s, n) => {
    try {
      s.status(201).json(await service.create(q.body?.title, q.body?.description));
    } catch (e) {
      n(e);
    }
  });
  r.patch('/:id', async (q, s, n) => {
    try {
      s.json(await service.edit(q.params.id, q.body?.title, q.body?.description, q.body?.actor));
    } catch (e) {
      n(e);
    }
  });
  r.patch('/:id/status', async (q, s, n) => {
    try {
      const x = await service.changeStatus(q.params.id, q.body?.status, q.body?.actor);
      if (!x.changed) return s.status(204).end();
      return s.json(x.task);
    } catch (e) {
      return n(e);
    }
  });
  r.delete('/:id', async (q, s, n) => {
    try {
      await service.delete(q.params.id);
      s.status(204).end();
    } catch (e) {
      n(e);
    }
  });
  return r;
}
