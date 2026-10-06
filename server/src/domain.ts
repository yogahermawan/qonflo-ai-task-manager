export interface AuditLog {
  readonly id: string;
  readonly taskId: string;
  readonly taskTitle: string;
  readonly actor: string;
  readonly action: 'status' | 'edited';
  readonly details?: string;
  readonly fromStatus: string;
  readonly fromStatusLabel: string;
  readonly toStatus: string;
  readonly toStatusLabel: string;
  readonly createdAt: string;
}
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}
export interface TaskView extends Task {
  auditLogs: readonly AuditLog[];
}
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
