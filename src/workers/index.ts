import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import {
  scoreQueue,
  createWorkerConnection,
} from "@/lib/queue";
import { db } from "@/lib/db";
import { articles, sources, summaries } from "@/lib/db/schema";
import { calculateImportanceScore } from "@/domain/ranking/score";
import { determineContentAvailability } from "./jobs/determineContentAvailability";
import { syncSchedulers } from "./jobs/scheduler";

// ─── WORKER CONCURRENCY (per PAD §6.2) ──────────────────────────────────────
const CONCURRENCY = {
  ingest: 50,    // I/O-bound: network fetches to RSS sources
  summarize: 5,  // AI-API-bound: rate-limited by Anthropic/OpenAI
  score: 20,     // CPU/DB-bound: scoring formula is fast
  feedSlice: 10, // Redis writes: fast but connection pool limited
} as const;

// ─── INGEST WORKER ───────────────────────────────────────────────────────────
interface FeedItem {
  title: string;
  excerpt?: string;
  body?: string;
  url: string;
  publishedAt?: Date;
}

function parseFeed(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _content: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _feedType: string
): FeedItem[] {
  // Simplified feed parser — in production, use a proper library
  // like `feedparser` for RSS/Atom or `fast-xml-parser` for XML
  return [];
}

async function processIngestJob(job: {
  data: { sourceId: string; schedulerId: string };
}) {
  const { sourceId } = job.data;

  // Fetch source details first (outside try so catch can access it)
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
  });

  if (!source) {
    throw new Error(`Source ${sourceId} not found`);
  }

  if (!source.isActive) {
    return { status: "skipped", reason: "source_inactive" };
  }

  try {
    // Fetch and parse feed (RSS/Atom/JSON)
    const feedUrl = source.feedUrl;
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${feedUrl}`);
    }

    const feedContent = await response.text();
    const parsedItems = parseFeed(feedContent, source.feedFormat);
    let newArticlesCount = 0;

    for (const item of parsedItems) {
      // Skip if no title
      if (!item.title) continue;

      // Determine content availability
      const contentAvailability = determineContentAvailability({
        title: item.title,
        excerpt: item.excerpt,
        body: item.body,
      });

      // Upsert article (idempotent via canonicalUrl)
      const result = await db
        .insert(articles)
        .values({
          sourceId: source.id,
          categoryId: source.categoryId,
          title: item.title,
          excerpt: item.excerpt ?? null,
          canonicalUrl: item.url,
          contentHash: `${item.title}-${item.publishedAt?.toISOString() ?? "no-date"}`,
          contentAvailability,
          publishedAt: item.publishedAt ?? new Date(),
        })
        .onConflictDoNothing({ target: articles.canonicalUrl })
        .returning({ id: articles.id });

      if (result[0]) {
        newArticlesCount++;
        // Enqueue scoring job for new article
        await scoreQueue.add("score", { articleId: result[0].id });
      }
    }

    // Update source health
    await db
      .update(sources)
      .set({
        lastFetchedAt: new Date(),
        failureCount: 0,
      })
      .where(eq(sources.id, sourceId));

    return { status: "success", newArticlesCount };
  } catch (error) {
    // Increment failure count
    const currentCount = source?.failureCount ?? 0;
    const newCount = currentCount + 1;

    await db
      .update(sources)
      .set({
        failureCount: newCount,
        // Auto-disable after 5 consecutive failures
        ...(newCount >= 5 ? { isActive: false } : {}),
      })
      .where(eq(sources.id, sourceId));

    throw error;
  }
}

// ─── SUMMARIZE WORKER ────────────────────────────────────────────────────────
interface SummaryData {
  summaryText: string;
  keyPoints: string[];
  sourcesCited: Array<{ url: string; title: string }>;
  model: string;
  tokensUsed: number;
  aiStatement: string;
  coveragePercentage: number;
}

async function callAISummary(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _article: {
  title: string;
  excerpt: string | null;
  body: string | null;
}): Promise<SummaryData> {
  // Simplified AI call — real implementation uses Vercel AI SDK
  // with Anthropic primary and OpenAI fallback
  return {
    summaryText: "Summary placeholder",
    keyPoints: ["Point 1", "Point 2"],
    sourcesCited: [{ url: "https://example.com", title: "Example" }],
    model: "claude-haiku-4-5",
    tokensUsed: 100,
    aiStatement: "AI-generated summary",
    coveragePercentage: 80,
  };
}

async function processSummarizeJob(job: { data: { articleId: string } }) {
  const { articleId } = job.data;

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }

  // CONTENT GUARD: Never summarise title_only or excerpt
  if (
    article.contentAvailability === "title_only" ||
    article.contentAvailability === "excerpt"
  ) {
    return { status: "skipped", reason: "insufficient_content" };
  }

  // Update status to pending
  await db
    .update(articles)
    .set({ summaryStatus: "pending" })
    .where(eq(articles.id, articleId));

  try {
    const summary = await callAISummary({
      title: article.title,
      excerpt: article.excerpt,
      body: null, // Body not stored in articles table (content availability used instead)
    });

    // Insert summary
    await db.insert(summaries).values({
      articleId: article.id,
      summaryText: summary.summaryText,
      keyPoints: summary.keyPoints,
      sourcesCited: summary.sourcesCited,
      model: summary.model,
      tokensUsed: summary.tokensUsed,
      aiStatement: summary.aiStatement,
      coveragePercentage: summary.coveragePercentage,
      originalArticleUrl: article.canonicalUrl,
    });

    // Update article status
    await db
      .update(articles)
      .set({
        summaryStatus: "ok",
        hasSummary: true,
      })
      .where(eq(articles.id, articleId));

    return { status: "success" };
  } catch (error) {
    // On failure, reset to 'none' to allow retry
    await db
      .update(articles)
      .set({ summaryStatus: "none" })
      .where(eq(articles.id, articleId));

    throw error;
  }
}

// ─── SCORE WORKER ────────────────────────────────────────────────────────────
async function processScoreJob(job: { data: { articleId: string } }) {
  const { articleId } = job.data;

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
    with: {
      source: true,
    },
  });

  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }

  const ageInHours =
    (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);

  const score = calculateImportanceScore({
    ageInHours,
    hasSummary: article.hasSummary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sourcePriority: (article as any).source?.priority ?? 2,
    contentAvailability: article.contentAvailability,
  });

  // Update importance score
  await db
    .update(articles)
    .set({ importanceScore: score })
    .where(eq(articles.id, articleId));

  return { status: "success", score };
}

// ─── FEED SLICE WORKER ──────────────────────────────────────────────────────
async function processFeedSliceJob(job: {
  data: { categoryId: string; sort: string };
}) {
  const { categoryId, sort } = job.data;

  // Refresh Redis cache for feed slice
  // In a real implementation, this would pre-compute and cache
  // the feed for fast retrieval by the web app
  return { status: "success", categoryId, sort };
}

// ─── WORKER DEFINITIONS ─────────────────────────────────────────────────────
const ingestWorker = new Worker("ingest", processIngestJob, {
  connection: createWorkerConnection(),
  concurrency: CONCURRENCY.ingest,
});

const summarizeWorker = new Worker("summarize", processSummarizeJob, {
  connection: createWorkerConnection(),
  concurrency: CONCURRENCY.summarize,
});

const scoreWorker = new Worker("score", processScoreJob, {
  connection: createWorkerConnection(),
  concurrency: CONCURRENCY.score,
});

const feedSliceWorker = new Worker("feed-slice", processFeedSliceJob, {
  connection: createWorkerConnection(),
  concurrency: CONCURRENCY.feedSlice,
});

const allWorkers = [
  ingestWorker,
  summarizeWorker,
  scoreWorker,
  feedSliceWorker,
];

// ─── EVENT HANDLERS ──────────────────────────────────────────────────────────
ingestWorker.on("completed", (job) => {
  console.log(`[Ingest] Completed: ${job.id}`, job.returnvalue);
});

summarizeWorker.on("completed", (job) => {
  console.log(`[Summarize] Completed: ${job.id}`, job.returnvalue);
});

scoreWorker.on("completed", (job) => {
  console.log(`[Score] Completed: ${job.id}`, job.returnvalue);
});

feedSliceWorker.on("completed", (job) => {
  console.log(`[FeedSlice] Completed: ${job.id}`, job.returnvalue);
});

allWorkers.forEach((worker) => {
  worker.on("failed", (job, err) => {
    console.error(`[${worker.name}] Failed: ${job?.id}`, err);
  });
});

// ─── GRACEFUL SHUTDOWN ───────────────────────────────────────────────────────
async function gracefulShutdown(signal: string) {
  console.log(`[Worker] Received ${signal}. Closing workers...`);

  await Promise.all(allWorkers.map((w) => w.close()));

  console.log("[Worker] All workers closed. Exiting.");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── STARTUP ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("[Worker] Starting worker service...");

  // Sync job schedulers for all active sources
  try {
    const scheduledCount = await syncSchedulers();
    console.log(`[Worker] Scheduled ${scheduledCount} active sources`);
  } catch (error) {
    console.error("[Worker] Failed to sync schedulers:", error);
  }

  console.log(
    `[Worker] All workers running with concurrency: ingest=${CONCURRENCY.ingest}, ` +
      `summarize=${CONCURRENCY.summarize}, score=${CONCURRENCY.score}, feedSlice=${CONCURRENCY.feedSlice}. ` +
      `Press Ctrl+C to stop.`
  );
}

main().catch((error) => {
  console.error("[Worker] Fatal error:", error);
  process.exit(1);
});
