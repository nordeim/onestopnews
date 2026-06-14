/**
 * score.ts — Pure domain function for article importance scoring.
 *
 * PAD §5.6: "calculateImportanceScore(inputs: ScoringInputs): number – returns float in 0.0–1.0 range."
 * MEP v5.1: "calculateImportanceScore returns float [0.0, 1.0] not 0–100"
 */

export interface ScoringInputs {
  /** Age in hours since publication (0 = just published) */
  ageInHours: number;
  /** Whether the article has a summary available */
  hasSummary: boolean;
  /** Source priority (lower is better, typically 1–5) */
  sourcePriority: number;
  /** Content availability level */
  contentAvailability: "title_only" | "excerpt" | "partial_text" | "full_text";
}

/**
 * Calculates an importance score for an article based on recency,
 * content availability, and source quality.
 *
 * Returns a float in the range [0.0, 1.0]
 */
export function calculateImportanceScore(inputs: ScoringInputs): number {
  // Recency factor: newer articles score higher (exponential decay)
  const maxAge = 24 * 7; // 1 week in hours
  const recencyFactor = Math.max(0, 1 - inputs.ageInHours / maxAge);

  // Content availability bonus
  const contentBonus =
    {
      title_only: 0,
      excerpt: 0.1,
      partial_text: 0.2,
      full_text: 0.3,
    }[inputs.contentAvailability] ?? 0;

  // Summary bonus
  const summaryBonus = inputs.hasSummary ? 0.15 : 0;

  // Source priority factor (lower priority number = higher quality)
  const sourceFactor = Math.max(0, 1 - (inputs.sourcePriority - 1) * 0.2);

  // Combined score (weighted average)
  const score = recencyFactor * 0.5 + contentBonus + summaryBonus + sourceFactor * 0.2;

  // Clamp to [0.0, 1.0]
  return Math.min(1, Math.max(0, score));
}
