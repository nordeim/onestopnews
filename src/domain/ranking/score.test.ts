import { describe, it, expect } from "vitest";
import { calculateImportanceScore, type ScoringInputs } from "./score";

describe("calculateImportanceScore", () => {
  it("returns a value between 0 and 1", () => {
    const inputs: ScoringInputs = {
      ageInHours: 0,
      hasSummary: true,
      sourcePriority: 1,
      contentAvailability: "full_text",
    };
    const score = calculateImportanceScore(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("favors recent articles", () => {
    const recent = calculateImportanceScore({
      ageInHours: 0,
      hasSummary: false,
      sourcePriority: 3,
      contentAvailability: "excerpt",
    });
    const old = calculateImportanceScore({
      ageInHours: 24 * 7 + 1,
      hasSummary: false,
      sourcePriority: 3,
      contentAvailability: "excerpt",
    });
    expect(recent).toBeGreaterThan(old);
  });

  it("favors articles with summaries", () => {
    const withSummary = calculateImportanceScore({
      ageInHours: 1,
      hasSummary: true,
      sourcePriority: 2,
      contentAvailability: "partial_text",
    });
    const withoutSummary = calculateImportanceScore({
      ageInHours: 1,
      hasSummary: false,
      sourcePriority: 2,
      contentAvailability: "partial_text",
    });
    expect(withSummary).toBeGreaterThan(withoutSummary);
  });

  it("favors higher source priority (lower number)", () => {
    const highPriority = calculateImportanceScore({
      ageInHours: 1,
      hasSummary: false,
      sourcePriority: 1,
      contentAvailability: "full_text",
    });
    const lowPriority = calculateImportanceScore({
      ageInHours: 1,
      hasSummary: false,
      sourcePriority: 5,
      contentAvailability: "full_text",
    });
    expect(highPriority).toBeGreaterThan(lowPriority);
  });

  it("caps at 1.0", () => {
    const score = calculateImportanceScore({
      ageInHours: 0,
      hasSummary: true,
      sourcePriority: 1,
      contentAvailability: "full_text",
    });
    expect(score).toBeLessThanOrEqual(1);
  });
});
