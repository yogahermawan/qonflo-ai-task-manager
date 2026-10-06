import type { MongoRepository } from './mongo-repository.js';
import type { AuditEventDocument, TaskDocument } from './documents.js';

interface LegacyTask {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface LegacyAuditEvent {
  id: string;
  taskId: string;
  actor: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
}

export interface LegacySnapshot {
  tasks: LegacyTask[];
  auditLogs: LegacyAuditEvent[];
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid legacy date in ' + field);
  return date;
}

export async function importLegacySnapshot(repository: MongoRepository, snapshot: LegacySnapshot) {
  const board = await repository.findBoard('default');
  if (!board) throw new Error('Default board must be initialized before importing tasks');

  const tasksById = new Map(snapshot.tasks.map(task => [task.id, task]));
  const latestActorByTask = new Map<string, { actor: string; createdAt: Date }>();
  for (const event of snapshot.auditLogs) {
    const createdAt = parseDate(event.createdAt, 'auditLogs.createdAt');
    const previous = latestActorByTask.get(event.taskId);
    if (!previous || previous.createdAt <= createdAt) latestActorByTask.set(event.taskId, { actor: event.actor, createdAt });
  }

  let importedTasks = 0;
  for (const task of snapshot.tasks) {
    if (!task.id || !task.title.trim() || !task.status) throw new Error('Invalid legacy task record');
    const document: TaskDocument = {
      _id: task.id,
      boardId: board._id,
      title: task.title.trim(),
      description: '',
      statusId: task.status,
      customValues: {},
      createdAt: parseDate(task.createdAt, 'tasks.createdAt'),
      updatedAt: parseDate(task.updatedAt, 'tasks.updatedAt'),
      updatedBy: latestActorByTask.get(task.id)?.actor ?? null,
    };
    if (await repository.importTaskIfMissing(document)) importedTasks++;
  }

  let importedAuditEvents = 0;
  for (const event of snapshot.auditLogs) {
    if (!event.id || !event.taskId || !event.actor || !event.fromStatus || !event.toStatus) {
      throw new Error('Invalid legacy audit event');
    }
    const actor = await repository.findActor(event.actor);
    const task = tasksById.get(event.taskId);
    const document: AuditEventDocument = {
      _id: event.id,
      taskId: event.taskId,
      boardId: board._id,
      taskTitle: task?.title?.trim() || 'Deleted task ' + event.taskId,
      actorId: event.actor,
      actorHandle: actor?.handle ?? event.actor,
      action: 'status',
      fromStatusId: event.fromStatus,
      fromStatusLabel: board.columns.find(column => column.id === event.fromStatus)?.name ?? event.fromStatus,
      toStatusId: event.toStatus,
      toStatusLabel: board.columns.find(column => column.id === event.toStatus)?.name ?? event.toStatus,
      createdAt: parseDate(event.createdAt, 'auditLogs.createdAt'),
    };
    if (await repository.importAuditEventIfMissing(document)) importedAuditEvents++;
  }

  return { importedTasks, importedAuditEvents };
}
