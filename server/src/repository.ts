import type { ClientSession } from 'mongodb';
import type {
  ActorDocument,
  AuditEventDocument,
  BoardDocument,
  TaskDocument,
} from './persistence/documents.js';
export type RepositorySession = ClientSession | undefined;
export interface TaskDataRepository {
  inTransaction<T>(operation: (session: RepositorySession) => Promise<T>): Promise<T>;
  listActors(): Promise<ActorDocument[]>;
  findActor(id: string, session?: RepositorySession): Promise<ActorDocument | null>;
  findBoard(id: string, session?: RepositorySession): Promise<BoardDocument | null>;
  saveBoard(board: BoardDocument, session?: RepositorySession): Promise<unknown>;
  listTasks(boardId: string, session?: RepositorySession): Promise<TaskDocument[]>;
  findTask(id: string, session?: RepositorySession): Promise<TaskDocument | null>;
  createTask(task: TaskDocument, session?: RepositorySession): Promise<unknown>;
  updateTaskStatus(
    id: string,
    expectedStatus: string,
    statusId: string,
    updatedAt: Date,
    updatedBy: string,
    session?: RepositorySession,
  ): Promise<boolean>;
  updateTaskDetails(
    id: string,
    title: string,
    description: string,
    updatedAt: Date,
    updatedBy: string,
    session?: RepositorySession,
  ): Promise<boolean>;
  deleteTask(id: string, session?: RepositorySession): Promise<boolean>;
  appendAuditEvent(event: AuditEventDocument, session?: RepositorySession): Promise<unknown>;
  listAuditEvents(taskId: string, session?: RepositorySession): Promise<AuditEventDocument[]>;
  listAuditEventsForTasks(taskIds: string[]): Promise<AuditEventDocument[]>;
}
const TEST_ACTORS: ActorDocument[] = [
  { _id: 'john.doe', handle: 'john.doe', displayName: 'John Doe', active: true },
  { _id: 'jane.smith', handle: 'jane.smith', displayName: 'Jane Smith', active: true },
  { _id: 'maria.garcia', handle: 'maria.garcia', displayName: 'Maria Garcia', active: true },
];
const TEST_BOARD: BoardDocument = {
  _id: 'default',
  name: 'Task board',
  columns: [
    { id: 'to_do', name: 'To do', position: 0 },
    { id: 'pending', name: 'Pending', position: 1 },
    { id: 'in_progress', name: 'In progress', position: 2 },
    { id: 'done', name: 'Done', position: 3 },
  ],
  customFields: [],
  updatedAt: new Date('2026-10-06T00:00:00.000Z'),
};
export class MemoryTaskRepository implements TaskDataRepository {
  private state = {
    actors: structuredClone(TEST_ACTORS),
    boards: [structuredClone(TEST_BOARD)],
    tasks: [] as TaskDocument[],
    events: [] as AuditEventDocument[],
  };
  private queue = Promise.resolve();
  async inTransaction<T>(operation: (session: RepositorySession) => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      const previous = this.state;
      this.state = structuredClone(previous);
      try {
        return await operation(undefined);
      } catch (error) {
        this.state = previous;
        throw error;
      }
    });
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  async listActors() {
    return structuredClone(this.state.actors.filter((a) => a.active));
  }
  async findActor(id: string) {
    return structuredClone(this.state.actors.find((a) => a._id === id && a.active) ?? null);
  }
  async findBoard(id: string) {
    return structuredClone(this.state.boards.find((b) => b._id === id) ?? null);
  }
  async saveBoard(board: BoardDocument) {
    const i = this.state.boards.findIndex((b) => b._id === board._id);
    if (i < 0) this.state.boards.push(structuredClone(board));
    else this.state.boards[i] = structuredClone(board);
  }
  async listTasks(boardId: string) {
    return structuredClone(
      this.state.tasks
        .filter((t) => t.boardId === boardId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    );
  }
  async findTask(id: string) {
    return structuredClone(this.state.tasks.find((t) => t._id === id) ?? null);
  }
  async createTask(task: TaskDocument) {
    this.state.tasks.push(structuredClone(task));
  }
  async updateTaskStatus(
    id: string,
    expected: string,
    status: string,
    updatedAt: Date,
    updatedBy: string,
  ) {
    const t = this.state.tasks.find((x) => x._id === id && x.statusId === expected);
    if (!t) return false;
    t.statusId = status;
    t.updatedAt = updatedAt;
    t.updatedBy = updatedBy;
    return true;
  }
  async updateTaskDetails(
    id: string,
    title: string,
    description: string,
    updatedAt: Date,
    updatedBy: string,
  ) {
    const t = this.state.tasks.find((x) => x._id === id);
    if (!t) return false;
    t.title = title;
    t.description = description;
    t.updatedAt = updatedAt;
    t.updatedBy = updatedBy;
    return true;
  }
  async deleteTask(id: string) {
    const i = this.state.tasks.findIndex((t) => t._id === id);
    if (i < 0) return false;
    this.state.tasks.splice(i, 1);
    return true;
  }
  async appendAuditEvent(e: AuditEventDocument) {
    this.state.events.push(structuredClone(e));
  }
  async listAuditEvents(id: string) {
    return structuredClone(
      this.state.events
        .filter((e) => e.taskId === id)
        .sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a._id.localeCompare(b._id),
        ),
    );
  }
  async listAuditEventsForTasks(ids: string[]) {
    const set = new Set(ids);
    return structuredClone(this.state.events.filter((e) => set.has(e.taskId)));
  }
}
