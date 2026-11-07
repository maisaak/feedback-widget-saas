import path from "node:path";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { getDatabaseUrl, hasDatabaseUrl } from "./env";
import { findWorkspaceRoot } from "./paths";
import * as schema from "./schema";

/**
 * Both the hosted driver (node-postgres) and the embedded driver (PGlite)
 * implement the same Drizzle API, so application code stays driver agnostic.
 */
export type Database = PgDatabase<any, typeof schema>;

const globalForDatabase = globalThis as typeof globalThis & {
  feedbackWidgetDb?: Promise<Database>;
  feedbackWidgetPool?: Pool;
};

const LOCAL_ENUM_SQL = `
DO $$ BEGIN
  CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

const LOCAL_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);
CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  message text NOT NULL,
  email text,
  rating integer,
  status feedback_status NOT NULL DEFAULT 'new',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedbacks_project_id_idx ON feedbacks (project_id);
`;

async function ensureLocalSchema(client: { exec: (sql: string) => Promise<unknown> }): Promise<void> {
  // PGlite does not run drizzle-kit migrations on its own. Running the same
  // statements keeps an embedded database ready with zero configuration.
  await client.exec(LOCAL_ENUM_SQL);
  await client.exec(LOCAL_SCHEMA_SQL);
}

async function createDatabase(): Promise<Database> {
  if (hasDatabaseUrl()) {
    const pool =
      globalForDatabase.feedbackWidgetPool ??
      new Pool({ connectionString: getDatabaseUrl(), max: 10 });
    if (process.env.NODE_ENV !== "production") {
      globalForDatabase.feedbackWidgetPool = pool;
    }
    return drizzleNodePg(pool, { schema });
  }

  const [{ PGlite }, path, fs] = await Promise.all([
    import("@electric-sql/pglite"),
    import("node:path"),
    import("node:fs/promises"),
  ]);
  const dataDir =
    process.env.PGLITE_DATA_DIR ?? path.join(findWorkspaceRoot(), ".data", "pglite");
  // PGlite's NodeFS only creates the database directory itself.
  await fs.mkdir(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  await ensureLocalSchema(client);
  return db;
}

/**
 * Lazily creates (and memoizes) the database connection. Without
 * DATABASE_URL this falls back to an embedded Postgres (PGlite) so the app
 * runs with no external services.
 */
export function getDb(): Promise<Database> {
  globalForDatabase.feedbackWidgetDb ??= createDatabase();
  return globalForDatabase.feedbackWidgetDb;
}

/**
 * Drops the memoized connection. Only useful for short-lived CLI scripts.
 */
export async function closeDb(): Promise<void> {
  const pending = globalForDatabase.feedbackWidgetDb;
  globalForDatabase.feedbackWidgetDb = undefined;
  if (!pending) return;
  await pending;
  if (globalForDatabase.feedbackWidgetPool) {
    await globalForDatabase.feedbackWidgetPool.end();
    globalForDatabase.feedbackWidgetPool = undefined;
  }
}
