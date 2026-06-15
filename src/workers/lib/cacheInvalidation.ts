import { Redis } from "ioredis";
import { env } from "@/lib/env";

/**
 * publishCacheInvalidation — Publish a cache invalidation event to Redis.
 *
 * Workers cannot use revalidateTag from next/cache (Next.js-only API).
 * Instead, workers publish invalidation events to a Redis channel.
 * The web app can subscribe to these events or check a Redis key.
 *
 * Channel format: cache:invalidate:<tag>
 *
 * @param tag — Cache tag to invalidate (e.g., 'feed:tech', 'topic-shell')
 * @returns true if published successfully, false otherwise
 */
export async function publishCacheInvalidation(tag: string): Promise<boolean> {
  let redis: Redis | null = null;

  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });

    const channel = `cache:invalidate:${tag}`;
    const message = JSON.stringify({
      tag,
      timestamp: new Date().toISOString(),
    });

    await redis.publish(channel, message);

    return true;
  } catch (error) {
    // Log but don't throw — cache invalidation is best-effort
    console.warn("[CacheInvalidation] Failed to publish invalidation:", error);
    return false;
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}
