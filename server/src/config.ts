export interface AppConfig { port: number; mongoUri: string; mongoDatabase: string; }

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const mongoUri = env.MONGODB_URI?.trim();
  if (!mongoUri) throw new Error('MONGODB_URI is required');

  let parsed: URL;
  try {
    parsed = new URL(mongoUri);
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI');
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error('MONGODB_URI must use mongodb:// or mongodb+srv:// and include a host');
  }

  const rawPort = env.PORT?.trim() || '3001';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const mongoDatabase = env.MONGODB_DB?.trim() || parsed.pathname.replace(/^\/+|\/+$/g, '') || 'qonflo';
  return { port, mongoUri, mongoDatabase };
}
