import type { Actor, Board, Task } from '../types/task';
type ErrorBody = { message?: string };
export class ApiError extends Error {}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(body.message ?? 'Request failed');
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}
export const api = {
  actors: () => request<Actor[]>('/api/actors'),
  tasks: () => request<Task[]>('/api/tasks'),
  board: () => request<Board>('/api/board'),
  createTask: (title: string, description: string) =>
    request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify({ title, description }) }),
  editTask: (id: string, title: string, description: string, actor: string) =>
    request<Task>('/api/tasks/' + id, {
      method: 'PATCH',
      body: JSON.stringify({ title, description, actor }),
    }),
  moveTask: (id: string, status: string, actor: string) =>
    request<Task | undefined>('/api/tasks/' + id + '/status', {
      method: 'PATCH',
      body: JSON.stringify({ status, actor }),
    }),
  deleteTask: (id: string) => request<void>('/api/tasks/' + id, { method: 'DELETE' }),
};
