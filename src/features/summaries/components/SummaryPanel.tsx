"use client";

import { useOptimistic } from "react";
import type { SummarisationOutput } from "@/features/summaries/lib/summariseSchema";
import { NutritionLabel } from "./NutritionLabel";
import { DisclosureBadge } from "./DisclosureBadge";
import type { ArticleWithSummary } from "@/domain/articles/types";

type SummaryStatus = ArticleWithSummary["summaryStatus"];

interface SummaryPanelProps {
  articleId: string;
  initialStatus: SummaryStatus;
  summary?: SummarisationOutput | null;
  onRequestSummary?: () => void;
}

/**
 * SummaryPanel — 5-state state machine for AI summaries.
 *
 * PRD §7.1 & PAD §7.4:
 *   none         → Show "Request AI Summary" button
 *   pending      → Show "Generating AI summary..." status
 *   ok           → Render <NutritionLabel>
 *   needs_review → Show "Summary under editorial review" notice
 *   disabled     → Render null (no UI hint)
 *
 * Uses useOptimistic() for instant UI updates when requesting a summary.
 */
export function SummaryPanel({
  initialStatus,
  summary,
  onRequestSummary,
}: SummaryPanelProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    initialStatus,
    (_state, newStatus: SummaryStatus) => newStatus
  );

  switch (optimisticStatus) {
    case "disabled":
      return null;

    case "none":
      return (
        <div id="ai-summary" className="my-8 border-l-2 border-dispatch-ember bg-paper-100/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-dispatch-ember" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
              AI Summary
            </span>
          </div>
          <p className="font-ui text-ink-600 mb-4">
            No AI summary is available for this article yet.
          </p>
          {onRequestSummary && (
            <button
              type="button"
              onClick={() => {
                setOptimisticStatus("pending");
                onRequestSummary();
              }}
              className="inline-flex items-center gap-2 rounded-sm bg-dispatch-ember px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white hover:bg-dispatch-ember/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dispatch-ember focus-visible:ring-offset-2"
              disabled={initialStatus === "pending"}
            >
              Request AI Summary
            </button>
          )}
        </div>
      );

    case "pending":
      return (
        <div id="ai-summary" className="my-8 border-l-2 border-ink-300 bg-paper-100/50 p-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ink-300 animate-pulse" aria-hidden="true" />
            <span className=" Monad font-ui text-ink-600">
              Generating AI summary...
            </span>
          </div>
        </div>
      );

    case "needs_review":
      return (
        <div
          id="ai-summary"
          className="my-8 border-l-2 border-amber-500 bg-amber-50 p-6"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="monospace font-ui text-amber-800">
              Summary under editorial review
            </span>
          </div>
          <p className="mt-2 font-ui text-sm text-amber-700">
            This summary has been flagged for review by our editorial team.
            It will be re-examined shortly.
          </p>
        </div>
      );

    case "ok":
      if (!summary) {
        return (
          <div className="my-8 border-l-2 border-ink-300 bg-paper-100/50 p-6">
            <p className="font-ui text-ink-600">
              Summary status is marked as complete, but no summary data is available.
            </p>
          </div>
        );
      }
      return (
        <section id="ai-summary" className="my-8">
          <div className="mb-4 flex items-center gap-3">
            <DisclosureBadge status="ok" />
          </div>
          <NutritionLabel summary={summary} />
        </section>
      );

    default:
      // Ensure the status is exhausted
      return null;
  }
}
