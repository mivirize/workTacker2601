import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

// ---------------------------------------------------------------------------
// Singleton Drizzle client backed by a pg connection pool
// ---------------------------------------------------------------------------

let client: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(
  connectionString?: string,
): ReturnType<typeof drizzle<typeof schema>> {
  if (!client) {
    const pool = new Pool({
      connectionString: connectionString ?? process.env['DATABASE_URL'],
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    client = drizzle(pool, {
      schema,
      logger: process.env['NODE_ENV'] === 'development',
    });
  }

  return client;
}

export type Db = ReturnType<typeof getDb>;
