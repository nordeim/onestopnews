import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ─── Lazy Proxy Connection ───────────────────────────────────────────────────
// [CRITICAL] Never eagerly create the database connection.
// Next.js imports modules at build time. An eager connection
// attempt at module load crashes the build in environments
// where DATABASE_URL is not available (CI, static export, etc.)
//
// The connection is deferred until the first property access via Proxy.
// This is the definitive pattern from PAD §5.4 / AGENTS.md §Drizzle ORM.
// ─────────────────────────────────────────────────────────────────────────────

function createClient(url: string) {
  return postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

// [DEPLOYMENT NOTE] max: 10 assumes a DEDICATED Node.js runtime
// (Docker, Railway, AWS ECS). Serverless platforms (Vercel, Lambda)
// will exhaust PostgreSQL max_connections rapidly.
// For serverless, swap to a connection pooler (PgBouncer or Supavisor).
function createDb(client: ReturnType<typeof postgres>) {
  return drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === "development",
  });
}

let _db: ReturnType<typeof createDb> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "[DB] DATABASE_URL is not set. Database queries will fail."
    );
  }

  _client = createClient(url);
  _db = createDb(_client);

  return _db;
}

// Exported as a Proxy — the connection is only initialized on first property access
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});
