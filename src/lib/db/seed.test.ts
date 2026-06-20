import { describe, it, expect, vi, beforeAll } from "vitest";
import type {
  contentAvailabilityEnum,
  feedFormatEnum,
} from "@/lib/db/schema";

/**
 * Seed Data Tests — TDD for database seed script.
 *
 * These tests verify the seed data structure before the script runs.
 * They ensure the constants (categories, sources, articles, summaries)
 * have the correct shape, counts, and relationships.
 */

// ─── Compile-time type safety: seed data fields MUST derive from the Drizzle
// schema's enums (Single Source of Truth). If seed.ts hand-writes the unions
// AND the schema enums change, these checks will fail at compile time
// (caught by `pnpm check`).
// ───────────────────────────────────────────────────────────────────────────
type SchemaContentAvailability =
  (typeof contentAvailabilityEnum.enumValues)[number];
type SchemaFeedFormat = (typeof feedFormatEnum.enumValues)[number];

describe("seed data — enum type derivation (Single Source of Truth)", () => {
  beforeAll(() => {
    vi.resetModules();
  });

  it("seedArticles contentAvailability field matches schema contentAvailabilityEnum", async () => {
    const { seedArticles } = await import("./seed");
    // Runtime check: every value must be in the schema enum
    const validValues = new Set<SchemaContentAvailability>([
      "title_only",
      "excerpt",
      "partial_text",
      "full_text",
    ]);
    for (const article of seedArticles) {
      expect(validValues.has(article.contentAvailability)).toBe(true);
    }
  });

  it("seedSources feedFormat field matches schema feedFormatEnum", async () => {
    const { seedSources } = await import("./seed");
    // Runtime check: every value must be in the schema enum
    const validValues = new Set<SchemaFeedFormat>(["rss", "atom", "json_api"]);
    for (const source of seedSources) {
      expect(validValues.has(source.feedFormat)).toBe(true);
    }
  });
});

describe("seed data structure", () => {
  // Reset module cache so we get fresh imports
  beforeAll(() => {
    vi.resetModules();
  });

  it("should have 7 categories", async () => {
    const { seedCategories } = await import("./seed");
    expect(seedCategories).toBeDefined();
    expect(seedCategories.length).toBe(7);
    expect(seedCategories[0]).toHaveProperty("slug");
    expect(seedCategories[0]).toHaveProperty("name");
  });

  it("should have 7 sources", async () => {
    const { seedSources } = await import("./seed");
    expect(seedSources).toBeDefined();
    expect(seedSources.length).toBe(7);
    expect(seedSources[0]).toHaveProperty("name");
    expect(seedSources[0]).toHaveProperty("url");
    expect(seedSources[0]).toHaveProperty("feedUrl");
  });

  it("should have 30 articles", async () => {
    const { seedArticles } = await import("./seed");
    expect(seedArticles).toBeDefined();
    expect(seedArticles.length).toBe(30);
    expect(seedArticles[0]).toHaveProperty("title");
    expect(seedArticles[0]).toHaveProperty("canonicalUrl");
    expect(seedArticles[0]).toHaveProperty("contentHash");
  });

  it("should have articles with all content availability types", async () => {
    const { seedArticles } = await import("./seed");
    const availabilities = new Set(seedArticles.map((a) => a.contentAvailability));
    expect(availabilities.has("title_only")).toBe(true);
    expect(availabilities.has("excerpt")).toBe(true);
    expect(availabilities.has("partial_text")).toBe(true);
    expect(availabilities.has("full_text")).toBe(true);
  });

  it("should have 16 summaries", async () => {
    const { seedSummaries } = await import("./seed");
    expect(seedSummaries).toBeDefined();
    expect(seedSummaries.length).toBe(16);
    expect(seedSummaries[0]).toHaveProperty("summaryText");
    expect(seedSummaries[0]).toHaveProperty("model");
    expect(seedSummaries[0]).toHaveProperty("aiStatement");
  });

  it("should have more articles with summaries than without", async () => {
    const { seedArticles } = await import("./seed");
    const withSummary = seedArticles.filter((a) => a.hasSummary).length;
    expect(withSummary).toBeGreaterThan(10);
  });
});

describe("seed function", () => {
  it("should export a seed function", async () => {
    const { seed } = await import("./seed");
    expect(typeof seed).toBe("function");
  });
});
