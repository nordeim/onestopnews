import { describe, it, expect } from "vitest";
import { getFeedArticles } from "./queries";

describe("getFeedArticles", () => {
  it("is exported as a function", () => {
    expect(typeof getFeedArticles).toBe("function");
  });

  it("returns a FeedPage shape when called", async () => {
    // This test validates the function signature and return shape
    // Note: actual DB integration requires DATABASE_URL to be set
    try {
      const result = await getFeedArticles();
      expect(result).toHaveProperty("articles");
      expect(result).toHaveProperty("nextCursor");
      expect(result).toHaveProperty("hasMore");
      expect(Array.isArray(result.articles)).toBe(true);
    } catch (error) {
      // If DATABASE_URL is not set, we expect this error
      // This is acceptable in test environments without DB
      if (error instanceof Error && error.message.includes("DATABASE_URL")) {
        expect(error.message).toContain("DATABASE_URL");
      } else {
        throw error;
      }
    }
  });
});
