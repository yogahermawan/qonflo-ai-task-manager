import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import type { AppConfig } from '../config.js';
import { MongoRepository } from './mongo-repository.js';
import { ensureMongoCollections } from './mongo-schema.js';
import { seedInitialData, type InitialData } from './seed.js';

export async function connectMongo(config: Pick<AppConfig, 'mongoUri' | 'mongoDatabase'>) {
  const client = new MongoClient(config.mongoUri, { appName: 'qonflo-task-manager' });
  try {
    await client.connect();
    const db = client.db(config.mongoDatabase);
    await db.command({ ping: 1 });
    await ensureMongoCollections(db);

    const serverDirectory = fileURLToPath(new URL('../../', import.meta.url));
    const seedPath = join(serverDirectory, 'seed', 'initial-data.json');
    const seed = JSON.parse(await readFile(seedPath, 'utf8')) as InitialData;
    await seedInitialData(db, seed);

    return { client, db, repository: new MongoRepository(client, db) };
  } catch (error) {
    await client.close();
    throw error;
  }
}
