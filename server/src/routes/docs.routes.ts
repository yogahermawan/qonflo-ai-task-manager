import { Router } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { openApiDocument } from '../openapi.js';

export function createDocsRouter() {
  const router = Router();
  router.get('/openapi.json', (_req, res) => res.json(openApiDocument));
  router.use(
    '/docs',
    apiReference({ url: '/api/openapi.json', pageTitle: 'Qonflo Task Manager API' }),
  );
  return router;
}
