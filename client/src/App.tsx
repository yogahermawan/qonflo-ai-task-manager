import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from './api/client';
import { ActorPicker } from './components/ActorPicker';
import { Board } from './components/Board';
import { TaskCreateForm } from './components/TaskCreateForm';
import { TaskEditDialog } from './components/TaskEditDialog';
import type { Actor, Board as BoardType, Task } from './types/task';
import './styles.css';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [actor, setActor] = useState('');
  const [edit, setEdit] = useState<Task | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [nextTasks, nextActors, nextBoard] = await Promise.all([
      api.tasks(),
      api.actors(),
      api.board(),
    ]);
    setTasks(nextTasks);
    setActors(nextActors);
    setBoard(nextBoard);
    setActor((current) =>
      nextActors.some((item) => item.id === current) ? current : (nextActors[0]?.id ?? ''),
    );
  }

  useEffect(() => {
    void load().catch((error) => setError(error.message));
    if (import.meta.env.VITE_DISABLE_REALTIME === 'true') return;
    const socket = io(import.meta.env.VITE_API_BASE_URL ?? undefined);
    socket.on('task:changed', () => {
      void load().catch((error: Error) => setError(error.message));
    });
    return () => {
      socket.close();
    };
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function move(task: Task, status: string) {
    if (!actor) {
      setError('Choose an actor before moving a task.');
      return;
    }
    await run(() => api.moveTask(task.id, status, actor).then(() => undefined));
  }

  return (
    <main>
      <header>
        <p className="eyebrow">Internal workspace</p>
        <h1>Task manager</h1>
        <p className="muted">Move tasks forward one step at a time. Changes sync automatically.</p>
      </header>
      <section className="workspace">
        <TaskCreateForm
          disabled={busy}
          onCreate={(title, description) =>
            run(() => api.createTask(title, description).then(() => undefined))
          }
        />
        <ActorPicker
          actors={actors}
          value={actor}
          disabled={busy || actors.length === 0}
          onChange={setActor}
        />
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!board ? (
        <p className="empty">Loading board...</p>
      ) : (
        <Board
          board={board}
          tasks={tasks}
          busy={busy}
          onMove={move}
          onInvalidMove={() => setError('Tasks must follow the defined status sequence.')}
          onEdit={setEdit}
          onDelete={(task) =>
            window.confirm('Delete "' + task.title + '"?')
              ? run(() => api.deleteTask(task.id))
              : Promise.resolve()
          }
        />
      )}
      {edit && (
        <TaskEditDialog
          task={edit}
          onClose={() => setEdit(null)}
          onSave={(title, description) =>
            run(() => api.editTask(edit.id, title, description, actor).then(() => undefined))
          }
        />
      )}
    </main>
  );
}
