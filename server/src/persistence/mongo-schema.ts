import type { Db, Document } from 'mongodb';

export const COLLECTIONS = {
  actors: 'actors',
  boards: 'boards',
  tasks: 'tasks',
  auditEvents: 'auditEvents',
} as const;

export const COLLECTION_VALIDATORS: Record<string, Document> = {
  actors: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'handle', 'displayName', 'active'],
      properties: {
        _id: { bsonType: 'string', minLength: 1 },
        handle: { bsonType: 'string', minLength: 1, maxLength: 80 },
        displayName: { bsonType: 'string', minLength: 1, maxLength: 120 },
        active: { bsonType: 'bool' },
      },
    },
  },
  boards: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'columns', 'customFields', 'updatedAt'],
      properties: {
        _id: { bsonType: 'string', minLength: 1 },
        name: { bsonType: 'string', minLength: 1, maxLength: 120 },
        columns: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['id', 'name', 'position'],
            properties: {
              id: { bsonType: 'string', minLength: 1 },
              name: { bsonType: 'string', minLength: 1, maxLength: 80 },
              position: { bsonType: 'int', minimum: 0 },
            },
          },
        },
        customFields: { bsonType: 'array' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
  tasks: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        '_id',
        'boardId',
        'title',
        'statusId',
        'customValues',
        'createdAt',
        'updatedAt',
        'updatedBy',
      ],
      properties: {
        _id: { bsonType: 'string', minLength: 1 },
        boardId: { bsonType: 'string', minLength: 1 },
        title: { bsonType: 'string', minLength: 1, maxLength: 140 },
        description: { bsonType: 'string', maxLength: 2000 },
        statusId: { bsonType: 'string', minLength: 1 },
        customValues: { bsonType: 'object' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        updatedBy: { bsonType: ['string', 'null'] },
      },
    },
  },
  auditEvents: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        '_id',
        'taskId',
        'boardId',
        'taskTitle',
        'actorId',
        'actorHandle',
        'fromStatusId',
        'fromStatusLabel',
        'toStatusId',
        'toStatusLabel',
        'createdAt',
      ],
      properties: {
        _id: { bsonType: 'string', minLength: 1 },
        taskId: { bsonType: 'string', minLength: 1 },
        boardId: { bsonType: 'string', minLength: 1 },
        taskTitle: { bsonType: 'string', minLength: 1 },
        actorId: { bsonType: 'string', minLength: 1 },
        actorHandle: { bsonType: 'string', minLength: 1 },
        action: { enum: ['status', 'edited'] },
        details: { bsonType: 'string', maxLength: 2000 },
        fromStatusId: { bsonType: 'string', minLength: 1 },
        fromStatusLabel: { bsonType: 'string', minLength: 1 },
        toStatusId: { bsonType: 'string', minLength: 1 },
        toStatusLabel: { bsonType: 'string', minLength: 1 },
        createdAt: { bsonType: 'date' },
      },
    },
  },
};

export async function ensureMongoCollections(db: Db): Promise<void> {
  for (const [name, validator] of Object.entries(COLLECTION_VALIDATORS)) {
    const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
    if (exists) {
      await db.command({
        collMod: name,
        validator,
        validationLevel: 'strict',
        validationAction: 'error',
      });
    } else {
      await db.createCollection(name, {
        validator,
        validationLevel: 'strict',
        validationAction: 'error',
      });
    }
  }

  await db
    .collection(COLLECTIONS.actors)
    .createIndex({ handle: 1 }, { unique: true, name: 'actor_handle_unique' });
  await db
    .collection(COLLECTIONS.tasks)
    .createIndex({ boardId: 1, statusId: 1, updatedAt: -1 }, { name: 'board_status_updated' });
  await db
    .collection(COLLECTIONS.auditEvents)
    .createIndex({ taskId: 1, createdAt: 1, _id: 1 }, { name: 'task_audit_chronological' });
  await db
    .collection(COLLECTIONS.auditEvents)
    .createIndex({ boardId: 1, createdAt: -1 }, { name: 'board_audit_recent' });
}
