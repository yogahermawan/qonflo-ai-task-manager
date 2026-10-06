import type { ErrorRequestHandler } from 'express';
import { DomainError } from '../domain.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res
      .status(400)
      .json({ error: 'INVALID_JSON', message: 'request body must be valid JSON' });
  }
  if (error instanceof DomainError) {
    const status =
      error.code === 'NOT_FOUND' ? 404 : error.code === 'CONCURRENT_UPDATE' ? 409 : 422;
    return res.status(status).json({ error: error.code, message: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Unexpected server error' });
};
