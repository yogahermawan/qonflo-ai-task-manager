import { useDroppable } from '@dnd-kit/core';
import type { BoardColumn as Column, Task } from '../types/task';
import { TaskCard } from './TaskCard';

export function BoardColumn({
  column,
  tasks,
  busy,
  onEdit,
  onDelete,
}: {
  column: Column;
  tasks: Task[];
  busy?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
}) {
  const drop = useDroppable({ id: 'column:' + column.id, data: { column } });

  return (
    <section
      ref={drop.setNodeRef}
      className={'board-column ' + (drop.isOver ? 'over' : '')}
      aria-label={column.name + ' column'}
    >
      <header>
        <h2>{column.name}</h2>
        <span>{tasks.length}</span>
      </header>
      <div className="column-cards">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} busy={busy} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}
