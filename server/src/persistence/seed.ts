import type { Db } from 'mongodb';
import type { ActorDocument, BoardDocument } from './documents.js';

export interface BoardSeed extends Omit<BoardDocument, 'updatedAt'> {
  updatedAt: Date | string;
}

export interface InitialData {
  actors: ActorDocument[];
  boards: BoardSeed[];
}

export function normalizeBoardSeed(board: BoardSeed): BoardDocument {
  const updatedAt = board.updatedAt instanceof Date ? board.updatedAt : new Date(board.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) throw new Error('Invalid board seed updatedAt');
  return { ...board, updatedAt };
}

export async function seedInitialData(db: Db, data: InitialData): Promise<void> {
  const actors = db.collection<ActorDocument>('actors');
  const boards = db.collection<BoardDocument>('boards');

  for (const actor of data.actors) {
    await actors.updateOne({ _id: actor._id }, { $setOnInsert: actor }, { upsert: true });
  }
  for (const seed of data.boards) {
    const board = normalizeBoardSeed(seed);
    await boards.updateOne({ _id: board._id }, { $setOnInsert: board }, { upsert: true });
  }
}
