export interface ActorDocument {
  _id: string;
  handle: string;
  displayName: string;
  active: boolean;
}
export interface BoardColumnDocument {
  id: string;
  name: string;
  position: number;
}
export interface CustomFieldDefinitionDocument {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
}
export interface BoardDocument {
  _id: string;
  name: string;
  columns: BoardColumnDocument[];
  customFields: CustomFieldDefinitionDocument[];
  updatedAt: Date;
}
export interface TaskDocument {
  _id: string;
  boardId: string;
  title: string;
  description: string;
  statusId: string;
  customValues: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}
export interface AuditEventDocument {
  _id: string;
  taskId: string;
  boardId: string;
  taskTitle: string;
  actorId: string;
  actorHandle: string;
  action: 'status' | 'edited';
  details?: string;
  fromStatusId: string;
  fromStatusLabel: string;
  toStatusId: string;
  toStatusLabel: string;
  createdAt: Date;
}
