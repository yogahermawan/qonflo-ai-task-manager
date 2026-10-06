import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Board as BoardType, Task } from '../types/task';
import { BoardColumn } from './BoardColumn';

export function Board({
  board,
  tasks,
  busy,
  onMove,
  onInvalidMove,
  onEdit,
  onDelete,
}: {
  board: BoardType;
  tasks: Task[];
  busy?: boolean;
  onMove: (task: Task, target: string) => Promise<void>;
  onInvalidMove: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    const target = event.over?.data.current?.column?.id as string | undefined;
    if (!task || !target || target === task.status) return;

    const currentIndex = board.columns.findIndex((column) => column.id === task.status);
    const targetIndex = board.columns.findIndex((column) => column.id === target);
    if (targetIndex !== currentIndex + 1) {
      onInvalidMove();
      return;
    }

    await onMove(task, target);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <section className="board" aria-label={board.name}>
        {board.columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => task.status === column.id)}
            busy={busy}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </section>
    </DndContext>
  );
}
