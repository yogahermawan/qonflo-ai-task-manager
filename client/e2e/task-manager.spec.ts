import { expect, test, type Page } from '@playwright/test';

async function dragTaskToPending(page: Page) {
  const source = page.locator('.task-card');
  const target = page.locator('[aria-label="Pending column"]');
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Drag source or target was not visible');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 12,
    sourceBox.y + sourceBox.height / 2,
    { steps: 3 },
  );
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
}

const actors = [
  { id: 'john.doe', handle: 'john.doe', displayName: 'John Doe' },
  { id: 'jane.smith', handle: 'jane.smith', displayName: 'Jane Smith' },
];
const board = {
  id: 'default',
  name: 'Task board',
  columns: [
    { id: 'to_do', name: 'To do', position: 0 },
    { id: 'pending', name: 'Pending', position: 1 },
    { id: 'in_progress', name: 'In progress', position: 2 },
    { id: 'done', name: 'Done', position: 3 },
  ],
};

test('creates a task, chooses attribution, moves it, and keeps Updated by after reload', async ({
  page,
}) => {
  let tasks: Array<Record<string, unknown>> = [];
  await page.route(
    (url) => new URL(url).pathname.startsWith('/api/'),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === '/api/actors') return route.fulfill({ json: actors });
      if (url.pathname === '/api/board') return route.fulfill({ json: board });
      if (url.pathname === '/api/tasks' && request.method() === 'GET')
        return route.fulfill({ json: tasks });
      if (url.pathname === '/api/tasks' && request.method() === 'POST') {
        const body = request.postDataJSON() as { title: string };
        const task = {
          id: 'task-1',
          title: body.title.trim(),
          status: 'to_do',
          createdAt: '2026-10-06T10:00:00.000Z',
          updatedAt: '2026-10-06T10:00:00.000Z',
          updatedBy: null,
          auditLogs: [],
        };
        tasks = [task];
        return route.fulfill({ status: 201, json: task });
      }
      if (url.pathname === '/api/tasks/task-1/status' && request.method() === 'PATCH') {
        const body = request.postDataJSON() as { actor: string; status: string };
        tasks = [
          {
            ...tasks[0],
            status: body.status,
            updatedBy: body.actor,
            updatedAt: '2026-10-06T10:01:00.000Z',
            auditLogs: [
              {
                id: 'event-1',
                taskId: 'task-1',
                taskTitle: 'Prepare report',
                actor: body.actor,
                fromStatus: 'to_do',
                fromStatusLabel: 'To do',
                toStatus: 'pending',
                toStatusLabel: 'Pending',
                createdAt: '2026-10-06T10:01:00.000Z',
              },
            ],
          },
        ];
        return route.fulfill({ json: tasks[0] });
      }
      return route.fulfill({ status: 404, json: { message: 'Not found' } });
    },
  );

  await page.goto('/');
  await page.getByRole('radio', { name: /jane.smith/i }).click();
  await page.getByLabel('New task').fill('Prepare report');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('heading', { name: 'Prepare report' })).toBeVisible();
  await dragTaskToPending(page);
  await expect(page.getByText('Updated by')).toContainText('@jane.smith');
  await page.reload();
  await expect(page.getByText('Updated by')).toContainText('@jane.smith');
  await page.locator('button.text-button').first().click();
  await expect(page.getByText('@jane.smith moved to Pending')).toBeVisible();
});

test('shows a visible error when a move is rejected', async ({ page }) => {
  const task = {
    id: 'task-1',
    title: 'Blocked task',
    status: 'to_do',
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-06T10:00:00.000Z',
    updatedBy: null,
    auditLogs: [],
  };
  await page.route(
    (url) => new URL(url).pathname.startsWith('/api/'),
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/actors') return route.fulfill({ json: actors });
      if (url.pathname === '/api/board') return route.fulfill({ json: board });
      if (url.pathname === '/api/tasks' && route.request().method() === 'GET')
        return route.fulfill({ json: [task] });
      if (url.pathname.endsWith('/status'))
        return route.fulfill({
          status: 422,
          json: { message: 'Task may only move to the next board column.' },
        });
      return route.fulfill({ status: 404, json: { message: 'Not found' } });
    },
  );
  await page.goto('/');
  await dragTaskToPending(page);
  await expect(page.getByRole('alert')).toContainText('Task may only move');
  await expect(page.getByRole('heading', { name: 'Blocked task' })).toBeVisible();
});
