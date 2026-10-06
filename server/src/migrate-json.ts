import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { connectMongo } from './persistence/connect.js';
import { importLegacySnapshot } from './persistence/import-json.js';

const config = loadConfig(process.env);
const serverDirectory = fileURLToPath(new URL('..', import.meta.url));
const sourcePath = join(serverDirectory, '../data/tasks.json');
const connection = await connectMongo(config);

try {
  const snapshot = JSON.parse(await readFile(sourcePath, 'utf8'));
  const result = await importLegacySnapshot(connection.repository, snapshot);
  console.log('Imported ' + result.importedTasks + ' tasks and ' + result.importedAuditEvents + ' audit events.');
} catch (error) {
  console.error('JSON import failed. MongoDB data was not overwritten.', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
} finally {
  await connection.client.close();
}
