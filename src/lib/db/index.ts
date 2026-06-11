import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * [CRITICAL] Never eagerly create the database connection.
 * Next.js imports modules at build time. An eager connection
 * attempt at module load crashes the build in environments
 * where DATABASE_URL is not available (CI, static export, etc.)
 *
 * We use a lazy proxy pattern: the DB client is only created
 * on first actual query execution.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _client: ReturnType<typeof postgres> | undefined = undefined;

function getDb() {
  if (_db) return _db;

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "[DB] DATABASE_URL is not set. Check environment variables."
    );
  }

  _client = postgres(process.env.DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // [DEPLOYMENT NOTE] max: 10 assumes a DEDICATED Node.js runtime
  // (Docker, Railway, AWS ECS). Serverless platforms (Vercel, Lambda)
  // will exhaust PostgreSQL max_connections rapidly.
  // For serverless, swap to a connection pooler (PgBouncer or Supavisor).
  _db = drizzle(_client, { schema, logger: process.env.NODE_ENV === "development" });

  return _db;
}

/**
 * Exported as a Proxy so the connection is deferred until
 * the first property access (i.e., the first query).
 */
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
}) as ReturnType<typeof getDb>;
