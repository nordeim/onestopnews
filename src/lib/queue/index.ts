import { Queue } from "bullmq";
import { env } from "@/lib/env";

// ── Redis Connection Factory ──────────────────────────────────────────────

/** Creates a BullMQ-compatible Redis connection config. */  
function createConnection() {
  return {
    host: new URL(env.REDIS_URL).hostname,
    port: Number(new URL(env.REDIS_URL).port) || 6379,
    maxRetriesPerRequest: null,
  } as const;
}

/** Pings Redis to check connectivity. Exported for health checks. */
export async function pingRedis(): Promise<boolean> {
  const conn = createConnection();
  // Dynamically import ioredis to avoid version conflict at top level
  const { Redis } = await import("ioredis");
  const redis = new Redis(conn);
  try {
    await redis.ping();
    await redis.quit();
    return true;
  } catch {
    return false;
  }
}

// ── Shared Default Job Options ─────────────────────────────────────────────
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

// ── Queue Definitions ──────────────────────────────────────────────────────
export const ingestQueue = new Queue("ingest", {
  connection: createConnection(),
  defaultJobOptions,
});

export const summarizeQueue = new Queue("summarize", {
  connection: createConnection(),
  defaultJobOptions,
});

export const scoreQueue = new Queue("score", {
  connection: createConnection(),
  defaultJobOptions,
});

export const feedSliceQueue = new Queue("feed-slice", {
  connection: createConnection(),
  defaultJobOptions,
});
