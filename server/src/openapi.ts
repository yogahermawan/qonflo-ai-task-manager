const id = [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }];

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Qonflo Mini Task Manager API',
    version: '2.0.0',
    description: 'No authentication. Actor values are self-asserted attribution.',
  },
  servers: [{ url: 'http://localhost:3001' }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { '200': { description: 'OK' } } },
    },
    '/api/actors': {
      get: { summary: 'List active actors', responses: { '200': { description: 'Actor list' } } },
    },
    '/api/board': {
      get: {
        summary: 'Read fixed ordered workflow columns',
        responses: { '200': { description: 'Board' } },
      },
    },
    '/api/tasks': {
      get: { summary: 'List active tasks', responses: { '200': { description: 'Task list' } } },
      post: {
        summary: 'Create task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', maxLength: 140 },
                  description: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Task' }, '422': { description: 'Invalid input' } },
      },
    },
    '/api/tasks/{id}': {
      patch: {
        summary: 'Edit title and description',
        parameters: id,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'actor'],
                properties: {
                  title: { type: 'string', maxLength: 140 },
                  description: { type: 'string', maxLength: 2000 },
                  actor: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Edited task' },
          '422': { description: 'Invalid input' },
        },
      },
      delete: {
        summary: 'Delete active task while retaining audit history',
        parameters: id,
        responses: { '204': { description: 'Deleted' }, '404': { description: 'Task not found' } },
      },
    },
    '/api/tasks/{id}/status': {
      patch: {
        summary: 'Move to the immediate next workflow status',
        description:
          'Only to_do+�u���R pending �w^~)�v in_progress+�u���R done is allowed. A same-status request returns 204 without audit or real-time event.',
        parameters: id,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status', 'actor'],
                properties: { status: { type: 'string' }, actor: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Moved task' },
          '204': { description: 'Same-status no-op' },
          '422': { description: 'Invalid status, actor, or transition' },
        },
      },
    },
    '/api/tasks/{id}/audit-logs': {
      get: {
        summary: 'List immutable audit history',
        parameters: id,
        responses: { '200': { description: 'Audit events, oldest first' } },
      },
    },
  },
} as const;
