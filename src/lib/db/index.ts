import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// [DEPLOYMENT NOTE] max: 10 assumes a DEDICATED Node.js runtime
// (Docker, Railway, AWS ECS). Serverless platforms (Vercel, Lambda)
// will exhaust PostgreSQL max_connections rapidly.
// For serverless, swap to a connection pooler (PgBouncer or Supavisor).
function createClient(url: string) {
  return postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function createDb(client: ReturnType<typeof postgres>) {
  return drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === "development",
  });
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn("[DB] DATABASE_URL is not set. Database queries will fail.");
}

const client = url ? createClient(url) : ({} as ReturnType<typeof postgres>);

export const db = url
  ? createDb(client)
  : ({} as ReturnType<typeof createDb>);
