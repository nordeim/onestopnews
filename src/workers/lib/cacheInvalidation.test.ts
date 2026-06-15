import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── UNIT TEST: Cache Invalidation ───────────────────────────────────────────
//
// TDD Approach: Write failing tests first, then implement.
//
// Workers cannot use revalidateTag from next/cache (Next.js-only API).
// Instead, workers publish invalidation events to Redis, and the web app
// subscribes to these events or checks a Redis key on each request.
//
// Requirements (per PRD v4.3 §9.2):
//   - publishCacheInvalidation() writes to Redis channel
//   - Handles Redis connection errors gracefully
//   - Channel format: cache:invalidate:<tag>
// ─────────────────────────────────────────────────────────────────────────────

// Mock Redis using a proper class mock
const mockPublish = vi.fn().mockResolvedValue(1);
const mockQuit = vi.fn().mockResolvedValue(undefined);

vi.mock("ioredis", () => {
  class MockRedis {
    publish = mockPublish;
    quit = mockQuit;
  }
  return { Redis: MockRedis };
});

// Mock env module
vi.mock("@/lib/env", () => ({
  env: {
    REDIS_URL: "redis://localhost:6379",
  },
}));

describe("cacheInvalidation", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockPublish.mockClear();
    mockQuit.mockClear();
  });

  describe("publishCacheInvalidation", () => {
    it("publishes cache invalidation event to Redis channel", async () => {
      const { publishCacheInvalidation } = await import("./cacheInvalidation");

      const result = await publishCacheInvalidation("feed:tech");

      expect(result).toBe(true);
      expect(mockPublish).toHaveBeenCalledWith(
        "cache:invalidate:feed:tech",
        expect.stringContaining("feed:tech")
      );
    });

    it("handles Redis connection errors gracefully", async () => {
      // Reset and setup the reject
      mockPublish.mockRejectedValueOnce(new Error("Redis connection failed"));

      const { publishCacheInvalidation } = await import("./cacheInvalidation");

      // Should not throw even if Redis is unavailable
      const result = await publishCacheInvalidation("feed:tech");
      expect(result).toBe(false);
    });

    it("uses correct Redis channel format", async () => {
      const { publishCacheInvalidation } = await import("./cacheInvalidation");

      await publishCacheInvalidation("topic-shell");

      // Verify the channel uses the correct format
      expect(mockPublish).toHaveBeenCalledWith(
        "cache:invalidate:topic-shell",
        expect.any(String)
      );
    });
  });
});
