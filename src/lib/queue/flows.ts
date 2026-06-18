/**
 * flows.ts — BullMQ FlowProducer DAG for atomic post-ingest processing.
 *
 * Per PAD §6.4: After ingestion inserts new articles, enqueue an atomic
 * flow where:
 *   - Children: score-article jobs (one per new article) on the `score` queue
 *   - Parent:   refresh-feed-slice job on the `feed-slice` queue
 *
 * The parent runs ONLY after ALL children complete (BullMQ FlowProducer
 * guarantee). This ensures the feed-slice cache invalidation does not fire
 * until every new article has been scored — preventing stale ordering in
 * the feed.
 *
 * Connection: Uses the Queue (producer) connection config from @/lib/queue
 * (enableOfflineQueue: false) — flow producers are producers, not workers.
 */

import { FlowProducer } from "bullmq";
import { createQueueConnection } from "./index";

// ── Types ──────────────────────────────────────────────────────────────────

export interface PostIngestFlowInput {
  /** IDs of newly-inserted articles that need scoring */
  newArticleIds: string[];
  /** Category ID for the feed-slice cache invalidation */
  categoryId: string;
}

// ── Singleton FlowProducer ─────────────────────────────────────────────────
// Module-level singleton — reused across all flow enqueues in this process.
// Avoids per-call connection churn.

let _flowProducer: FlowProducer | null = null;

function getFlowProducer(): FlowProducer {
  if (!_flowProducer) {
    _flowProducer = new FlowProducer({ connection: createQueueConnection() });
  }
  return _flowProducer;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Enqueues an atomic post-ingest flow:
 *   - Parent (refresh-feed-slice) runs only after ALL children complete
 *   - Children (score-article) run in parallel on the score queue
 *
 * @param input — newArticleIds + categoryId
 */
export async function enqueuePostIngestFlow(
  input: PostIngestFlowInput
): Promise<void> {
  const flowProducer = getFlowProducer();

  // Build children: one score-article job per new article.
  const children = input.newArticleIds.map((articleId) => ({
    name: "score-article",
    queueName: "score",
    data: { articleId },
    opts: { priority: 2 },
  }));

  // Build the flow tree: parent refresh-feed-slice + children score-article.
  // BullMQ guarantees the parent only runs after all children complete.
  await flowProducer.add({
    name: "refresh-feed-slice",
    queueName: "feed-slice",
    data: {
      categoryId: input.categoryId,
      sort: "latest",
    },
    opts: { priority: 1 },
    children,
  });
}
