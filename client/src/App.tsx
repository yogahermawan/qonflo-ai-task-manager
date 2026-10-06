import { useEffect, useState } from 'react';
import { api } from './api/client';
import { ActorPicker } from './components/ActorPicker';
import { Board } from './components/Board';
import { TaskCreateForm } from './components/TaskCreateForm';
import { TaskEditDialog } from './components/TaskEditDialog';
import type { Actor, Board as BoardType, BoardColumn, Task } from './types/task';
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
    const [t, a, b] = await Promise.all([api.tasks(), api.actors(), api.board()]);
    setTasks(t);
    setActors(a);
    setBoard(b);
    setActor((current) => (a.some((x) => x.id === current) ? current : (a[0]?.id ?? '')));
  }
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function move(t: Task, status: string) {
    if (!actor) {
      setError('Choose an actor before moving a task.');
      return;
    }
    await run(() => api.moveTask(t.id, status, actor).then(() => undefined));
  }
  async function remove(t: Task) {
    if (window.confirm('Delete "' + t.title + '"?')) await run(() => api.deleteTask(t.id));
  }
  async function addColumn() {
    const name = window.prompt('Name the new board step');
    if (name) await run(() => api.addColumn(name).then(() => undefined));
  }
  async function rename(c: BoardColumn) {
    const name = window.prompt('Rename step', c.name);
    if (name) await run(() => api.renameColumn(c.id, name).then(() => undefined));
  }
  async function removeColumn(c: BoardColumn) {
    if (window.confirm('Delete "' + c.name + '"? Move its tasks first.'))
      await run(() => api.deleteColumn(c.id).then(() => undefined));
  }
  return (
    <main>
      <header>
        <p className="eyebrow">Internal workspace</p>
        <h1>Task manager</h1>
        <p className="muted">Drag cards between any steps. Changes are recorded.</p>
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
          onEdit={setEdit}
          onDelete={remove}
          onAddColumn={() => void addColumn()}
          onRenameColumn={(c) => void rename(c)}
          onDeleteColumn={(c) => void removeColumn(c)}
          onReorder={(ids) => run(() => api.reorderColumns(ids).then(() => undefined))}
        />
      )}{' '}
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
