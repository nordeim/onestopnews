/**
 * auth.ts — Dedicated Drizzle instance for Auth.js adapter.
 *
 * The main `db` proxy (in index.ts) defers connection until first query,
 * but `@auth/drizzle-adapter` requires a real drizzle instance at init time.
 * This file creates an eager instance for the adapter only.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "[DB] DATABASE_URL is not set. Auth.js DrizzleAdapter cannot initialize."
  );
}

const client = postgres(url, {
  max: process.env.NODE_ENV === "production" ? 10 : 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

/** Real Drizzle instance for Auth.js adapter (NOT a Proxy). */
export const authDb = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});
